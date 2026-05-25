// Thumbnail Matching Script - Generates missing thumbnails for apps
// Lists apps that need AI-generated thumbnails

const missingThumbnails = [
  {
    appId: 'ai-personalizedcontent',
    appName: 'AI Sales Intelligence Pro',
    description: 'Create highly personalized content that speaks directly to your audience',
    category: 'video',
    keyFeatures: ['content personalization', 'audience targeting', 'marketing automation', 'custom messaging', 'data-driven insights']
  },
  {
    appId: 'ai-sales',
    appName: 'AI Sales Email Writer',
    description: 'Boost your sales with intelligent AI-driven strategies',
    category: 'lead-gen',
    keyFeatures: ['email writing', 'sales outreach', 'template generation', 'follow-up automation', 'conversion optimization']
  },
  {
    appId: 'ai-proposal',
    appName: 'Competitor Spy AI',
    description: 'Create winning proposals with AI-powered writing assistance',
    category: 'lead-gen',
    keyFeatures: ['proposal generation', 'business writing', 'custom templates', 'competitive analysis', 'client presentation']
  },
  {
    appId: 'sales-assistant-app',
    appName: 'AI Agency Builder Suite',
    description: 'Your complete AI sales assistance platform',
    category: 'lead-gen',
    keyFeatures: ['sales assistance', 'client management', 'pipeline tracking', 'automated follow-ups', 'performance analytics']
  },
  {
    appId: 'sales-page-builder',
    appName: 'Sales Call Follow-Up AI',
    description: 'Build high-converting sales pages in minutes',
    category: 'lead-gen',
    keyFeatures: ['landing page creation', 'conversion optimization', 'A/B testing', 'template library', 'analytics integration']
  },
  {
    appId: 'personalizer-profile',
    appName: 'AI Documentation Writer',
    description: 'Generate compelling personalized profiles with AI',
    category: 'personalizer',
    keyFeatures: ['profile generation', 'linkedin optimization', 'bio writing', 'professional branding', 'content creation']
  },
  {
    appId: 'personalizer-url-video-generation',
    appName: 'Newsletter Repurposer AI',
    description: 'Generate personalized videos from URLs with smart templates',
    category: 'video',
    keyFeatures: ['url video generation', 'content repurposing', 'template system', 'automated editing', 'multi-format export']
  },
  {
    appId: 'ai-product-launch-intelligence-agent',
    appName: 'Launch Campaign Builder AI',
    description: 'AI-powered product launch intelligence and competitor analysis',
    category: 'ai-agents',
    keyFeatures: ['product launch planning', 'market analysis', 'competitor research', 'campaign strategy', 'timeline management']
  },
  {
    appId: 'ai-real-estate-agent-team',
    appName: 'Real Estate Marketing AI',
    description: 'AI-powered real estate marketing and client relations',
    category: 'ai-agents',
    keyFeatures: ['property listings', 'client matching', 'market insights', 'marketing automation', 'lead generation']
  },
  {
    appId: 'ai-reasoning-agent',
    appName: 'Fraud Investigation Assistant',
    description: 'AI-powered reasoning and analysis for investigations',
    category: 'ai-agents',
    keyFeatures: ['data analysis', 'pattern recognition', 'report generation', 'evidence tracking', 'risk assessment']
  },
  {
    appId: 'blog-to-podcast-agent-',
    appName: 'Blog To Podcast AI',
    description: 'Transform blog content into engaging podcasts',
    category: 'ai-agents',
    keyFeatures: ['content transformation', 'audio generation', 'podcast editing', 'multi-platform export', 'audience engagement']
  },
  {
    appId: 'local-travel-agent-',
    appName: 'Smart Local Travel Agent Hub',
    description: 'AI-powered local travel planning and recommendations',
    category: 'ai-agents',
    keyFeatures: ['travel planning', 'local recommendations', 'itinerary creation', 'booking assistance', 'destination guides']
  }
];

console.log('Apps needing AI-generated thumbnails:', missingThumbnails.length);
missingThumbnails.forEach(app => {
  console.log(`  - ${app.appId}: ${app.appName}`);
});