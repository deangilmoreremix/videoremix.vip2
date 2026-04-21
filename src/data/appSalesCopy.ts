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
  },
  'ai-headshot-studio': {
    tonality: 'Steve Jobs',
    whatItDoes: 'Transforms ordinary selfies into professional studio-quality headshots without cameras or lighting equipment.',
    howItMakesMoney: 'Charge $50-200 per headshot package to local professionals like real estate agents, consultants, and small business owners.',
    whyBusinessesNeedIt: 'In a visual world where first impressions matter, this changes everything. Your image is your brand. Make it revolutionary. Stop settling for amateur photos. Command respect with headshots that demand attention.'
  },
  'nano-banana-studio': {
    tonality: 'Seth Godin',
    whatItDoes: 'Creates miniature banana-themed visual content for social media and marketing campaigns using AI generation.',
    howItMakesMoney: 'Sell themed content packages for $100-400 per campaign, helping local businesses create viral, shareable content.',
    whyBusinessesNeedIt: 'In a world of boring posts, be the banana that stands out. Remarkable content doesn\'t have to be serious. This tool creates the kind of playful, memorable visuals that spread because they\'re worth sharing.'
  },
  'seedance-v2-studio': {
    tonality: 'Cormac McCarthy',
    whatItDoes: 'Generates dance-inspired visual sequences from seed phrases using advanced AI choreography algorithms.',
    howItMakesMoney: 'Offer creative visual services for $300-1000 per project, targeting local event planners, performers, and marketers.',
    whyBusinessesNeedIt: 'Movement is life. This tool births rhythm from stillness. In the quiet spaces between frames, it finds motion. Use it to awaken audiences with visuals that dance across screens.'
  },
  'easyveo': {
    tonality: 'Hemingway',
    whatItDoes: 'Simplifies video creation with intuitive AI tools for non-technical users.',
    howItMakesMoney: 'Charge $200-600 per video for local businesses needing quick promotional content.',
    whyBusinessesNeedIt: 'Videos sell. This makes them easy. No skills needed. Businesses create. Customers buy.'
  },
  'aiclip': {
    tonality: 'Challenger Sale',
    whatItDoes: 'Automatically clips and optimizes video content for maximum engagement using AI analysis of viewer behavior.',
    howItMakesMoney: 'Provide video optimization services for $400-1200 per project, helping local marketers improve content performance.',
    whyBusinessesNeedIt: 'Long videos lose audiences. The assumption that "more content equals better engagement" is wrong. Our insight-driven approach challenges this by teaching you to create clips that viewers actually watch, converting passive browsers into active fans.'
  },
  'pet-product-studio': {
    tonality: 'Value-Based',
    whatItDoes: 'Designs and markets pet products with AI-driven trend analysis and customer insights.',
    howItMakesMoney: 'Offer product development services for $800-2500 per project, helping local pet businesses create and launch new offerings.',
    whyBusinessesNeedIt: 'Pet owners spend billions annually. This tool delivers quantifiable value by identifying market gaps and creating products that capture premium pricing, ensuring your business maximizes revenue from the growing pet economy.'
  },
  'resale-photo-enhancer': {
    tonality: 'Alex Hormozi',
    whatItDoes: 'Enhances product photos for resale platforms with AI-powered lighting, background, and detail improvements.',
    howItMakesMoney: 'Process photo batches for $20-50 per item, offering bulk packages to local resellers and e-commerce businesses.',
    whyBusinessesNeedIt: 'Poor photos kill sales. This stacks value by making your listings look professional without expensive shoots. Spend $50 on enhancement, earn $500 more per item. The math is stupid simple—upgrade your photos or lose money.'
  },
  'ai-recruiter': {
    tonality: 'Trusted Advisor',
    whatItDoes: 'Uses AI to match candidates with job openings and streamline the hiring process for small businesses.',
    howItMakesMoney: 'Provide recruitment services for $500-1500 per hire, helping local businesses find qualified employees efficiently.',
    whyBusinessesNeedIt: 'Hiring the right people builds your business foundation. As your trusted advisor, we leverage AI to ensure you find candidates who not only have the skills but also fit your company culture, creating teams that drive long-term success.'
  },
  'talk-to-pdf': {
    tonality: 'Socratic Selling',
    whatItDoes: 'Enables conversational interaction with PDF documents using AI to extract and discuss information.',
    howItMakesMoney: 'Offer document analysis services for $200-600 per project, helping local consultants and researchers process information.',
    whyBusinessesNeedIt: 'What if your documents could answer questions? What insights are you missing because you can\'t query your PDFs? This tool helps you discover the hidden knowledge in your files—how would that change your decision-making?'
  },
  'blogger-cms': {
    tonality: 'David Ogilvy',
    whatItDoes: 'Provides a content management system optimized for bloggers with AI-powered SEO and engagement features.',
    howItMakesMoney: 'Offer blogging platform setup for $400-1200 per site, plus monthly hosting fees of $50-150, targeting local content creators.',
    whyBusinessesNeedIt: 'Research shows that businesses with active blogs generate 67% more leads. Our benefit-focused CMS ensures your content ranks higher, attracts more readers, and converts them into customers through proven SEO strategies.'
  },
  'amazon-product-studio': {
    tonality: 'Warren Buffett',
    whatItDoes: 'Creates optimized product listings for Amazon with AI-generated descriptions, images, and pricing strategies.',
    howItMakesMoney: 'Provide listing optimization services for $300-1000 per product, helping local sellers maximize Amazon sales.',
    whyBusinessesNeedIt: 'Amazon is a marathon, not a sprint. We help you build listings that stand the test of time, focusing on the fundamentals of great products, clear descriptions, and fair pricing that creates lasting customer loyalty and steady sales growth.'
  },
  'ai-business-card': {
    tonality: 'Naval Ravikant',
    whatItDoes: 'Generates minimalist, impactful business cards using AI design principles and first principles thinking.',
    howItMakesMoney: 'Design business card packages for $50-150 per set, offering bulk orders to local professionals.',
    whyBusinessesNeedIt: 'A business card is information compressed. Strip away everything non-essential. What remains is pure signal. This tool creates cards that communicate your value at a glance, built on the foundation of what truly matters.'
  },
  'mailwise': {
    tonality: 'Chris Voss',
    whatItDoes: 'Optimizes email marketing campaigns with AI analysis of recipient behavior and tactical communication strategies.',
    howItMakesMoney: 'Manage email campaigns for $400-1200 per month, helping local businesses improve open rates and conversions.',
    whyBusinessesNeedIt: 'Your emails are negotiations. What are you really asking for? This tool uses tactical empathy to craft messages that resonate, labeling the pain points your customers feel and offering solutions they can\'t refuse.'
  },
  'my-podcast': {
    tonality: 'Pain Point Research',
    whatItDoes: 'Creates and manages podcast content with AI-driven topic research and audience analysis.',
    howItMakesMoney: 'Offer podcast production services for $500-1500 per episode, helping local experts build authority and attract clients.',
    whyBusinessesNeedIt: 'Listeners tune out boring content. The real pain is not reaching your ideal audience because your topics don\'t address their deepest concerns. This tool uncovers the root causes of listener disengagement, creating shows that solve real problems and build loyal followings.'
  },
  'ezscribe': {
    tonality: 'MEDDIC',
    whatItDoes: 'Transcribes audio and video content with AI accuracy, providing editable text for various business applications.',
    howItMakesMoney: 'Provide transcription services for $100-300 per hour, serving local podcasters, lawyers, and content creators.',
    whyBusinessesNeedIt: 'Metrics show 80% of video content is consumed silently. Economic buyers need searchable, quotable text. Decision criteria include accuracy over 95% and fast turnaround. This solution meets all qualification frameworks for professional transcription needs.'
  },
  'ai-knowledge-base': {
    tonality: 'Executive Briefing',
    whatItDoes: 'Builds comprehensive knowledge bases from documents and data using AI organization and retrieval systems.',
    howItMakesMoney: 'Implement knowledge management systems for $1000-3000 per setup, helping local businesses organize and access critical information.',
    whyBusinessesNeedIt: 'In today\'s information economy, knowledge is your competitive advantage. This strategic solution provides top-down organization of your intellectual assets, enabling faster decision-making and scalable growth across all business functions.'
  },
  'ai-outbound': {
    tonality: 'Competitive Displacement',
    whatItDoes: 'Automates outbound sales prospecting with AI-driven lead generation and personalized outreach sequences.',
    howItMakesMoney: 'Offer lead generation and outreach services for $600-1800 per campaign, helping local businesses acquire new customers.',
    whyBusinessesNeedIt: 'Manual prospecting is inefficient. While traditional CRMs promise organization, they deliver frustration. Our surgical approach respectfully unseats outdated methods, providing the wedge that switches your sales process to automated success with higher conversion rates.'
  },
  'branding-analyzer': {
    tonality: 'Executive Briefing',
    whatItDoes: 'Analyzes brand presence and provides strategic recommendations for improvement across all marketing channels.',
    howItMakesMoney: 'Offer brand audit services for $800-2500 per analysis, helping local businesses strengthen their market position.',
    whyBusinessesNeedIt: 'Brand decisions impact every customer interaction. C-suite leaders need data-driven insights to make strategic choices that drive long-term growth and competitive advantage in their local markets.'
  },
  'ai-branding': {
    tonality: 'Warren Buffett',
    whatItDoes: 'Creates comprehensive AI-driven branding strategies and assets for consistent visual identity.',
    howItMakesMoney: 'Provide branding packages for $1200-4000 per business, helping local companies establish professional brand presence.',
    whyBusinessesNeedIt: 'Your brand is your promise to customers. A strong brand builds trust and commands premium pricing. We help you create a brand that lasts generations, focusing on fundamentals that drive real business value.'
  },
  'ai-sales': {
    tonality: 'Alex Hormozi',
    whatItDoes: 'Maximizes sales performance through AI-driven lead scoring, follow-up automation, and conversion optimization.',
    howItMakesMoney: 'Offer sales optimization services for $900-2700 per month, helping local businesses close more deals.',
    whyBusinessesNeedIt: 'Stop leaving money on the table. The offer is so good, saying no feels stupid. We make your sales process irresistible to prospects while maximizing your profit margins.'
  },
  'resume-amplifier': {
    tonality: 'Hemingway',
    whatItDoes: 'Enhances resumes with AI-powered keyword optimization and achievement highlighting for better job search results.',
    howItMakesMoney: 'Offer resume optimization services for $150-400 per resume, helping job seekers land better positions.',
    whyBusinessesNeedIt: 'One idea per line. Show, don\'t tell. Your resume competes in a crowded market. We eliminate unnecessary words and highlight achievements that matter to employers.'
  },
  'personalizer-profile': {
    tonality: 'Naval Ravikant',
    whatItDoes: 'Creates optimized personal profiles and bios for professional platforms using AI-driven content generation.',
    howItMakesMoney: 'Provide personal branding services for $300-900 per profile, helping professionals establish stronger online presence.',
    whyBusinessesNeedIt: 'Your personal brand is leverage. When you compound your reputation over time, you create opportunities that scale. We help you craft a personal narrative that attracts the right opportunities.'
  },
  'interactive-outros': {
    tonality: 'Seth Godin',
    whatItDoes: 'Creates engaging video endings with interactive elements and call-to-action optimization for higher engagement.',
    howItMakesMoney: 'Offer video outro creation for $250-750 per video, helping content creators increase subscriber engagement.',
    whyBusinessesNeedIt: 'Remarkable videos get shared. Invisible videos get ignored. Your outro is the last impression viewers remember. We make it remarkable, creating interactive experiences that drive action.'
  },
  'social-pack': {
    tonality: 'David Ogilvy',
    whatItDoes: 'Provides complete social media content creation and scheduling tools with AI-driven optimization.',
    howItMakesMoney: 'Offer social media management packages for $500-1500 per month, helping local businesses grow their online presence.',
    whyBusinessesNeedIt: 'Headlines determine whether people read your content. Research-backed social media strategies drive engagement. We create compelling content that converts followers into customers.'
  },
  'ai-template-generator': {
    tonality: 'Cormac McCarthy',
    whatItDoes: 'Generates custom templates for various business purposes using AI-driven design and content creation.',
    howItMakesMoney: 'Sell template packages for $100-300 each, providing businesses with professional materials instantly.',
    whyBusinessesNeedIt: 'Templates are destiny made visible. They structure chaos into order. We create templates that become the foundation of your business communications, enduring like the landscape itself.'
  },
  'personalizer-text-ai-editor': {
    tonality: 'Chris Voss',
    whatItDoes: 'Advanced text editing with personalization AI that adapts content to specific audiences and contexts.',
    howItMakesMoney: 'Offer content personalization services for $400-1200 per project, helping businesses create more effective communications.',
    whyBusinessesNeedIt: 'It\'s not about what you say, it\'s about what they hear. We mirror your audience\'s language and calibrate your message for maximum impact, creating conversations that lead to results.'
  },
  'personalizer-advanced-text-video-editor': {
    tonality: 'MEDDIC',
    whatItDoes: 'Combines advanced text and video editing capabilities with AI-driven content optimization and personalization.',
    howItMakesMoney: 'Provide comprehensive content creation services for $800-2400 per project, serving businesses with multi-format content needs.',
    whyBusinessesNeedIt: 'Metrics drive decisions. Economic buyer analysis ensures the right content reaches the right audience. Decision criteria evaluation maximizes content effectiveness across all channels.'
  },
  'personalizer-writing-toolkit': {
    tonality: 'Trusted Advisor',
    whatItDoes: 'Comprehensive AI-powered writing toolkit for content creation, editing, and optimization across all formats.',
    howItMakesMoney: 'Offer writing and content services for $600-1800 per month, providing businesses with consistent, high-quality content.',
    whyBusinessesNeedIt: 'Trust is earned through reliability and credibility. We build long-term partnerships by delivering consistent value, becoming the advisor businesses turn to for all their content needs.'
  }
};

export const validateSalesCopy = (copy: SalesCopy): boolean => {
  return !!(copy.tonality && copy.whatItDoes && copy.howItMakesMoney && copy.whyBusinessesNeedIt);
};