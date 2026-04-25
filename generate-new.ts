import { appThumbnailSpecs } from './src/data/appThumbnailSpecs.js';

const categoryPrompts = {
  video: 'professional video editing software interface, cinematic lighting, modern UI design',
  'ai-image': 'digital art creation tools interface, vibrant color palette, creative workspace',
  branding: 'brand identity design workspace, clean and professional, corporate design tools',
  personalizer: 'user profile customization interface, personalized dashboard, modern UX design',
  creative: 'creative workspace with design tools, artistic composition, innovative interface',
  'lead-gen': 'sales funnel visualization, conversion metrics dashboard'
};

function buildPrompt(request) {
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

const generatedAt = "2026-04-21T05:39:59+00:00";
const timestamp = 1776705000018;

const newEntries = appThumbnailSpecs.map((spec, index) => ({
  url: `https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/${spec.appId}-ai-thumbnail-${timestamp + index}.png`,
  alt: `${spec.appName} - ${spec.description}`,
  prompt: buildPrompt(spec),
  metadata: {
    appId: spec.appId,
    category: spec.category,
    generatedAt,
    model: 'dall-e-3',
    quality: 'hd'
  }
}));

console.log(JSON.stringify(newEntries, null, 2));