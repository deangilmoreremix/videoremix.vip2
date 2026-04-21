import { createClient } from '@supabase/supabase-js';

export interface ImageGenerationRequest {
  appId: string;
  appName: string;
  description: string;
  category: string;
  keyFeatures: string[];
  targetSize: { width: number; height: number };
}

export interface GeneratedImage {
  url: string;
  alt: string;
  prompt: string;
  metadata: {
    appId: string;
    category: string;
    generatedAt: string;
    model: string;
    quality: string;
  };
}

export class AIImageGenerator {
  private openaiApiKey: string;
  private supabase: any;

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY!;
    // Use service role key for storage operations to bypass RLS
    this.supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
    );
  }

  async generateAppThumbnail(request: ImageGenerationRequest): Promise<GeneratedImage> {
    const prompt = this.buildPrompt(request);

    try {
      console.log(`🎨 Generating thumbnail for ${request.appName}...`);

      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          prompt: prompt,
          n: 1,
          size: '1024x1024', // Best quality for thumbnails
          response_format: 'url',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${error}`);
      }

      const data = await response.json();

      if (!data.data || !data.data[0] || !data.data[0].url) {
        throw new Error('Invalid response from OpenAI API');
      }

      // Download and store the image
      const imageUrl = data.data[0].url;
      const storedUrl = await this.downloadAndStoreImage(imageUrl, request.appId);

      return {
        url: storedUrl,
        alt: `${request.appName} - ${request.description}`,
        prompt: prompt,
        metadata: {
          appId: request.appId,
          category: request.category,
          generatedAt: new Date().toISOString(),
          model: 'dall-e-3',
          quality: 'hd'
        },
      };
    } catch (error) {
      console.error('Image generation failed:', error);
      throw new Error(`Failed to generate image for ${request.appName}: ${error.message}`);
    }
  }

  private buildPrompt(request: ImageGenerationRequest): string {
    const categoryPrompts = {
      video: 'professional video editing software interface, cinematic lighting, modern UI design',
      'ai-image': 'digital art creation tools interface, vibrant color palette, creative workspace',
      branding: 'brand identity design workspace, clean and professional, corporate design tools',
      personalizer: 'user profile customization interface, personalized dashboard, modern UX design',
      creative: 'creative workspace with design tools, artistic composition, innovative interface',
      'lead-gen': 'sales funnel visualization dashboard, conversion metrics interface, business analytics'
    };

    const categoryStyle = categoryPrompts[request.category] || 'modern software interface, clean design';

    return `Create a realistic, professional software interface thumbnail for "${request.appName}" - ${request.description}.

Key features to visualize: ${request.keyFeatures.join(', ')}

Style requirements:
- ${categoryStyle}
- Professional, modern UI design
- Clean, minimal interface
- High-quality, realistic rendering
- Software application screenshot style
- No text overlays except functional UI elements
- 4K quality, photorealistic, professional grade
- Focus on functionality and user experience
- Modern design trends, sleek and intuitive

The image should look like a real software application interface that users would want to use.`;
  }

  private async downloadAndStoreImage(imageUrl: string, appId: string): Promise<string> {
    try {
      console.log(`📥 Downloading image for ${appId}...`);

      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }

      const imageBlob = await response.blob();

      // Convert to buffer for Supabase storage
      const arrayBuffer = await imageBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Supabase storage
      const fileName = `thumbnails/${appId}-ai-thumbnail-${Date.now()}.png`;

      const { data, error } = await this.supabase.storage
        .from('app-assets')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Failed to store image: ${error.message}`);
      }

      // Get public URL
      const { data: publicUrlData } = this.supabase.storage
        .from('app-assets')
        .getPublicUrl(fileName);

      console.log(`✅ Stored image: ${publicUrlData.publicUrl}`);
      return publicUrlData.publicUrl;

    } catch (error) {
      console.error('Image storage failed:', error);
      throw new Error(`Failed to store image: ${error.message}`);
    }
  }

  async generateBatch(requests: ImageGenerationRequest[]): Promise<GeneratedImage[]> {
    const results: GeneratedImage[] = [];

    // Process in smaller batches to avoid rate limits
    const batchSize = 3; // OpenAI allows 5 per minute for DALL-E 3

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      console.log(`\n🔄 Processing batch ${Math.floor(i/batchSize) + 1}: ${batch.length} images`);

      const batchPromises = batch.map(request => this.generateAppThumbnail(request));
      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`❌ Failed to generate image for ${batch[index].appName}:`, result.reason);
        }
      });

      // Rate limiting - wait 20 seconds between batches (OpenAI allows ~5 images per minute)
      if (i + batchSize < requests.length) {
        console.log('⏱️  Waiting 20 seconds for rate limit...');
        await new Promise(resolve => setTimeout(resolve, 20000));
      }
    }

    return results;
  }

  async testConnection(): Promise<boolean> {
    try {
      const testPrompt = "A simple blue square on a white background, minimal, clean design";

      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          prompt: testPrompt,
          n: 1,
          size: '256x256',
          response_format: 'url',
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('AI Image API test failed:', error);
      return false;
    }
  }
}