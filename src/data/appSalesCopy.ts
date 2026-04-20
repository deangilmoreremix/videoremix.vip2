export interface SalesCopy {
  tonality: string;
  whatItDoes: string;
  howItMakesMoney: string;
  whyBusinessesNeedIt: string;
}

export interface AppSalesData {
  [appId: string]: SalesCopy;
}

export const appSalesCopy: AppSalesData = {
  'video-creator': {
    tonality: 'Steve Jobs',
    whatItDoes: 'Transforms simple text prompts and keywords into professional, cinematic videos with AI-powered editing and storytelling.',
    howItMakesMoney: 'Local businesses can charge $800-2500 per custom video for clients like restaurants, salons, and retail stores needing high-quality promotional content.',
    whyBusinessesNeedIt: 'In a world where video is the language of connection, this tool gives you the power to create revolutionary marketing that turns viewers into loyal customers. Think different—your competitors are still using static images.'
  },
  'promo-generator': {
    tonality: 'Hemingway',
    whatItDoes: 'Creates promotional videos from product descriptions and target keywords.',
    howItMakesMoney: 'Charge local businesses $400-1200 for short promotional videos that highlight services and drive bookings.',
    whyBusinessesNeedIt: 'Videos sell. This makes them fast. Businesses need sales. Use it.'
  },
  'video-ai-editor': {
    tonality: 'Steve Jobs',
    whatItDoes: 'Intelligently edits raw footage using AI to create polished, engaging videos with automatic cuts, transitions, and effects.',
    howItMakesMoney: 'Offer video editing services for $600-1800 per project, targeting local events, weddings, and business testimonials.',
    whyBusinessesNeedIt: 'Raw footage is chaos. This tool brings order and beauty. It\'s the future of storytelling—simple, powerful, and accessible to everyone willing to change how they connect with audiences.'
  },
  'text-to-speech': {
    tonality: 'Hemingway',
    whatItDoes: 'Converts written text into natural-sounding voice narration for videos and presentations.',
    howItMakesMoney: 'Sell voiceover services for $200-800 per script, perfect for local podcasts, training videos, and marketing spots.',
    whyBusinessesNeedIt: 'Voice matters. This gives professional narration without studio costs. Businesses need it for videos that talk to customers.'
  },
  'niche-script': {
    tonality: 'Steve Jobs',
    whatItDoes: 'Generates targeted video scripts tailored to specific niches and audiences using AI analysis of market trends.',
    howItMakesMoney: 'Create and sell niche-specific video scripts for $300-1000 each, helping local businesses in industries like real estate, healthcare, and fitness.',
    whyBusinessesNeedIt: 'One size fits none. This tool crafts messages that resonate deeply with your audience. It\'s not just content—it\'s the revolution in personalized marketing that builds lasting relationships.'
  },
  'personalizer-url-video-generation': {
    tonality: 'Hemingway',
    whatItDoes: 'Creates videos from website URLs by analyzing content and generating relevant video narratives.',
    howItMakesMoney: 'Charge $500-1500 for website-to-video conversions, ideal for local businesses wanting to repurpose web content into engaging video ads.',
    whyBusinessesNeedIt: 'Websites have stories. Videos tell them better. This turns static pages into dynamic sales tools. Businesses need videos to compete.'
  },
  'landing-page': {
    tonality: 'Challenger Sale',
    whatItDoes: 'Builds high-converting landing pages with AI-optimized layouts, copy, and CTAs based on industry best practices.',
    howItMakesMoney: 'Offer landing page design services for $400-1200 per page, targeting local businesses launching new services or products.',
    whyBusinessesNeedIt: 'Stop guessing what works. The status quo of generic templates is failing. Our data-driven approach challenges conventional wisdom, teaching you why certain elements convert 3x better. Your landing pages will dominate, not just exist.'
  },
  'sales-monetizer': {
    tonality: 'Value-Based',
    whatItDoes: 'Analyzes sales data to identify and implement monetization strategies that maximize revenue from existing customer interactions.',
    howItMakesMoney: 'Provide consulting services charging $500-2000 per analysis, helping local businesses optimize pricing, upselling, and cross-selling opportunities.',
    whyBusinessesNeedIt: 'Every customer interaction is a revenue opportunity. This tool delivers measurable value by uncovering hidden profits in your sales process, ensuring your business captures the full potential of every lead.'
  },
  'ai-referral-maximizer': {
    tonality: 'Challenger Sale',
    whatItDoes: 'Optimizes referral programs with AI-driven incentives and tracking to maximize word-of-mouth growth.',
    howItMakesMoney: 'Implement and manage referral systems for local businesses, charging $300-1000 per setup plus monthly maintenance fees of $200-500.',
    whyBusinessesNeedIt: 'Referrals aren\'t random—they\'re predictable. The myth that "good service leads to referrals" is incomplete. Our system challenges this by teaching businesses how to systematically engineer referral triggers that compound growth exponentially.'
  },
  'smart-crm-closer': {
    tonality: 'Value-Based',
    whatItDoes: 'Enhances CRM systems with AI-powered lead scoring and automated follow-up sequences to increase close rates.',
    howItMakesMoney: 'Offer CRM optimization services for $600-1800 per setup, helping local businesses convert more leads into paying customers.',
    whyBusinessesNeedIt: 'Your CRM is a goldmine of untapped potential. This tool delivers quantifiable value by automating the sales process, ensuring no opportunity slips through the cracks and maximizing your return on customer relationships.'
  },
  'funnelcraft-ai': {
    tonality: 'Challenger Sale',
    whatItDoes: 'Designs and optimizes complete sales funnels with AI analysis of user behavior and conversion bottlenecks.',
    howItMakesMoney: 'Create custom sales funnels for local businesses, charging $800-2500 per funnel with ongoing optimization fees of $300-800 monthly.',
    whyBusinessesNeedIt: 'Traditional funnels are leaky sieves. The assumption that "more traffic equals more sales" is fundamentally flawed. Our approach challenges this by teaching you to identify and eliminate conversion killers, creating funnels that actually work.'
  },
  'sales-assistant-app': {
    tonality: 'Value-Based',
    whatItDoes: 'Provides AI-powered sales assistance with script suggestions, objection handling, and deal analysis.',
    howItMakesMoney: 'License the app to sales teams for $50-150 per user monthly, or offer training services using it for $400-1200 per session.',
    whyBusinessesNeedIt: 'Sales conversations are your biggest revenue lever. This tool delivers measurable value by equipping your team with data-driven insights and responses, turning average salespeople into consistent closers.'
  },
  'storyboard': {
    tonality: 'Seth Godin',
    whatItDoes: 'Creates detailed storyboards for videos and presentations using AI to visualize concepts and narratives.',
    howItMakesMoney: 'Sell storyboard services for $300-1000 per project, helping local filmmakers, marketers, and educators plan compelling visual stories.',
    whyBusinessesNeedIt: 'In a sea of sameness, your story needs to be remarkable. This isn\'t just planning—it\'s the purple cow of content creation that makes your message unforgettable and shareable.'
  },
  'smart-presentations': {
    tonality: 'Cormac McCarthy',
    whatItDoes: 'Generates presentation slides with minimalist designs and compelling narratives drawn from sparse data inputs.',
    howItMakesMoney: 'Create professional presentations for $400-1200 each, targeting local consultants, trainers, and business leaders.',
    whyBusinessesNeedIt: 'Words fail. Images endure. This tool strips away noise, leaving only what matters. In the barren landscape of corporate slides, it carves meaning from chaos.'
  },
  'interactive-shopping': {
    tonality: 'Seth Godin',
    whatItDoes: 'Builds interactive shopping experiences with AI-generated product recommendations and virtual try-ons.',
    howItMakesMoney: 'Implement interactive features for e-commerce sites, charging $600-1800 per setup plus transaction fees, boosting local online retail sales.',
    whyBusinessesNeedIt: 'Shopping isn\'t a transaction—it\'s an experience. Be the remarkable store that customers talk about. This tool transforms browsers into buyers, creating loyalty in a world of endless choices.'
  },
  'rebrander-ai': {
    tonality: 'Jeff Bezos',
    whatItDoes: 'Rebrands businesses with AI analysis of market positioning and customer preferences to create scalable brand identities.',
    howItMakesMoney: 'Offer rebranding services for $1000-3000 per project, helping local businesses establish stronger market presence and customer loyalty.',
    whyBusinessesNeedIt: 'Your brand is your most valuable asset. We obsess over customers to build brands that scale. This tool ensures your rebrand isn\'t cosmetic—it\'s strategic, customer-centric growth that compounds over time.'
  },
  'business-brander': {
    tonality: 'Trusted Advisor',
    whatItDoes: 'Develops comprehensive brand strategies with logos, messaging, and positioning tailored to local markets.',
    howItMakesMoney: 'Provide branding packages for $800-2500, including logo design and brand guidelines for local startups and established businesses.',
    whyBusinessesNeedIt: 'Trust is earned through consistency. As your trusted advisor, we help you build a brand that resonates with your community, creating the foundation for sustainable business growth and customer loyalty.'
  },
  'voice-coach': {
    tonality: 'Chris Voss',
    whatItDoes: 'Provides personalized voice training with AI analysis of speech patterns and communication effectiveness.',
    howItMakesMoney: 'Offer voice coaching sessions for $200-600 each, targeting local speakers, salespeople, and leaders.',
    whyBusinessesNeedIt: 'Your voice is your negotiation tool. Let me show you how to use it. This isn\'t just training—it\'s tactical communication that gives you the edge in every conversation, building rapport and closing deals.'
  },
  'personalizer-recorder': {
    tonality: 'Pain Point Research',
    whatItDoes: 'Records and analyzes screen interactions to identify user pain points and optimize digital experiences.',
    howItMakesMoney: 'Conduct user experience audits for $500-1500 per project, helping local businesses improve their websites and apps.',
    whyBusinessesNeedIt: 'Users abandon carts because of friction you can\'t see. This tool uncovers the specific pain points causing lost revenue—slow load times, confusing navigation, checkout failures—and gives you actionable solutions to eliminate them.'
  },
  'thumbnail-generator': {
    tonality: 'Chris Voss',
    whatItDoes: 'Creates compelling video thumbnails with AI optimization for click-through rates and audience engagement.',
    howItMakesMoney: 'Design thumbnail packages for $100-400 per video, serving local content creators and marketers.',
    whyBusinessesNeedIt: 'Thumbnails are your first impression. What are you really communicating? This tool helps you craft visuals that mirror the value inside, using proven psychological triggers to boost clicks and build audience trust.'
  },
  'ai-signature': {
    tonality: 'Pain Point Research',
    whatItDoes: 'Generates professional email signatures with integrated branding and contact optimization.',
    howItMakesMoney: 'Create signature designs for $50-200 per user, offering bulk packages to local businesses for team branding.',
    whyBusinessesNeedIt: 'Generic signatures scream amateur. The pain of inconsistent branding costs you credibility with every email. This tool solves that by creating professional signatures that reinforce your brand and make networking effortless.'
  },
  'ai-skills-monetizer': {
    tonality: 'Chris Voss',
    whatItDoes: 'Identifies and packages personal skills for monetization through online courses and consulting.',
    howItMakesMoney: 'Help individuals turn skills into income streams, charging $300-1000 for skill assessment and monetization planning.',
    whyBusinessesNeedIt: 'You have skills worth money. The question is: how do you get paid for them? This tool helps you negotiate your value, package your expertise, and create income streams that work for you, not against you.'
  },
  'ai-image-tools': {
    tonality: 'Seth Godin',
    whatItDoes: 'Provides comprehensive image editing tools with AI enhancements for professional-quality results.',
    howItMakesMoney: 'Offer image editing services for $100-500 per project, targeting local photographers and marketers.',
    whyBusinessesNeedIt: 'In a visual world, mediocre images are invisible. Be remarkable. This tool transforms ordinary photos into extraordinary marketing assets that stop scrollers and start conversations.'
  },
  'ai-art': {
    tonality: 'Cormac McCarthy',
    whatItDoes: 'Creates original artwork from text descriptions using advanced AI algorithms.',
    howItMakesMoney: 'Sell custom artwork for $200-800 per piece, serving local galleries, designers, and businesses.',
    whyBusinessesNeedIt: 'Art endures. This tool births images from words. In the silence of creation, it finds beauty. Use it to adorn your world with visions no eye has seen.'
  },
  'bg-remover': {
    tonality: 'Seth Godin',
    whatItDoes: 'Automatically removes backgrounds from images with precision AI detection.',
    howItMakesMoney: 'Process bulk image edits for $50-200 per batch, helping local e-commerce businesses prepare product photos.',
    whyBusinessesNeedIt: 'Cluttered backgrounds distract from your message. Be the brand that stands out. This tool creates clean, professional images that let your products shine and your marketing sing.'
  },
  'ai-video-image': {
    tonality: 'Cormac McCarthy',
    whatItDoes: 'Combines video and image AI tools for comprehensive visual content creation and editing.',
    howItMakesMoney: 'Provide integrated visual services for $500-1500 per project, targeting local media producers and advertisers.',
    whyBusinessesNeedIt: 'Sight binds all. This tool weaves images into motion. In the vast emptiness of digital space, it creates presence. Stories told in light and time.'
  },
  'personalizer-video-image-transformer': {
    tonality: 'Seth Godin',
    whatItDoes: 'Transforms generic images and videos into personalized marketing content using AI face and object recognition.',
    howItMakesMoney: 'Create personalized content packages for $300-1000 per campaign, helping local businesses connect with individual customers.',
    whyBusinessesNeedIt: 'Generic content is forgettable. Be the brand they remember. This tool crafts personalized experiences that turn one-time buyers into lifelong fans, creating remarkable connections in a crowded market.'
  }
};

export const validateSalesCopy = (copy: SalesCopy): boolean => {
  return !!(copy.tonality && copy.whatItDoes && copy.howItMakesMoney && copy.whyBusinessesNeedIt);
};