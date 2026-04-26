import React from "react";
import {
  Video,
  Users,
  Image as ImageIcon,
  Sparkles,
  Palette,
  CircleUser as UserCircle,
  Package,
  Layers,
  FileText,
  Mic,
  Search,
  ArrowRight,
  Filter,
  Play,
  Star,
  PanelTop,
  Zap,
  Camera,
  Share,
  Share2,
  TrendingUp,
  Target,
  BarChart2,
  Briefcase,
} from "lucide-react";

export const enhancedAppDetails: Record<string, any> = {
  "ai-referral-maximizer": {
    longDescription:
      "Transform your referral program into a revenue-generating powerhouse with AI-driven optimization. Our intelligent system analyzes referral patterns, identifies high-value advocates, and automates personalized outreach to maximize conversions.",
    benefits: [
      "Increase referral conversions by up to 300%",
      "Automate personalized referral communications",
      "Identify and reward top advocates automatically",
      "Track ROI with advanced analytics dashboard",
      "Integrate seamlessly with existing CRM systems",
      "A/B test referral messaging automatically",
    ],
    features: [
      {
        title: "AI-Powered Advocate Identification",
        description:
          "Machine learning algorithms identify your most influential customers and predict who is most likely to refer successfully.",
        icon: React.createElement(Target),
      },
      {
        title: "Automated Incentive Optimization",
        description:
          "Dynamically adjust rewards based on customer behavior and referral success rates to maximize ROI.",
        icon: React.createElement(TrendingUp),
      },
      {
        title: "Personalized Outreach Campaigns",
        description:
          "Generate custom referral messages for each advocate based on their communication preferences and relationship history.",
        icon: React.createElement(Users),
      },
      {
        title: "Real-Time Analytics Dashboard",
        description:
          "Monitor referral performance, track conversion rates, and measure program ROI with comprehensive analytics.",
        icon: React.createElement(BarChart2),
      },
      {
        title: "Multi-Channel Distribution",
        description:
          "Enable referrals across email, SMS, social media, and custom landing pages for maximum reach.",
        icon: React.createElement(Share2),
      },
      {
        title: "Fraud Detection System",
        description:
          "AI-powered fraud detection ensures program integrity by identifying suspicious referral patterns.",
        icon: React.createElement(Award),
      },
    ],
    steps: [
      {
        title: "Set Your Goals",
        description:
          "Define your referral program objectives, target metrics, and reward structure",
      },
      {
        title: "Import Customer Data",
        description:
          "Connect your CRM or upload customer lists to identify potential advocates",
      },
      {
        title: "Configure AI Rules",
        description:
          "Let AI optimize messaging, timing, and incentives based on your goals",
      },
      {
        title: "Launch & Monitor",
        description:
          "Activate your program and watch AI-driven optimization increase referrals",
      },
    ],
    useCases: [
      {
        title: "SaaS Companies",
        description:
          "Drive customer acquisition through automated referral campaigns",
        points: [
          "Reduce customer acquisition costs by 40-60%",
          "Automate advocate identification and outreach",
          "Track lifetime value of referred customers",
        ],
      },
      {
        title: "E-Commerce Brands",
        description:
          "Turn customers into brand ambassadors with intelligent incentives",
        points: [
          "Personalized referral offers based on purchase history",
          "Social media integration for viral growth",
          "Dynamic reward structures that maximize participation",
        ],
      },
      {
        title: "Service Businesses",
        description: "Scale word-of-mouth marketing with AI automation",
        points: [
          "Identify satisfied clients most likely to refer",
          "Automate thank-you and follow-up communications",
          "Track referral source attribution accurately",
        ],
      },
    ],
    testimonials: [
      {
        quote:
          "We increased our referral rate from 8% to 31% in just 3 months. The AI identifies exactly who to target and when. Our customer acquisition costs have dropped by 55%.",
        name: "Sarah Martinez",
        role: "VP of Growth, TechFlow Solutions",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
      {
        quote:
          "The automated advocate identification is incredible. We've discovered our most valuable referrers weren't who we expected. This tool paid for itself in the first month.",
        name: "Michael Chen",
        role: "CMO, CloudScale Inc.",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
    ],
    faqs: [
      {
        question: "How does the AI identify potential advocates?",
        answer:
          "Our AI analyzes multiple data points including purchase history, engagement patterns, customer satisfaction scores, social media activity, and communication responsiveness to predict which customers are most likely to make successful referrals.",
      },
      {
        question: "Can I customize the referral incentives?",
        answer:
          "Absolutely! You have full control over incentive structures. The AI can also test different reward levels and recommend optimal incentives based on your program performance data.",
      },
      {
        question: "How does it integrate with my existing systems?",
        answer:
          "We offer native integrations with major CRM platforms, marketing automation tools, and e-commerce platforms. We also provide a robust API for custom integrations.",
      },
      {
        question: "What kind of ROI can I expect?",
        answer:
          "Most customers see a 200-400% increase in qualified referrals within the first 3 months. The average customer acquisition cost reduction is 45-60%, with some customers achieving even higher results.",
      },
    ],
    tags: [
      "Lead Generation",
      "Marketing Automation",
      "AI-Powered",
      "Growth Hacking",
    ],
  },

  "smart-crm-closer": {
    longDescription:
      "Close deals faster with AI-powered CRM intelligence that predicts buying signals, automates follow-ups, and optimizes your sales pipeline. Never miss an opportunity with smart notifications and automated nurture sequences.",
    benefits: [
      "Close deals 42% faster on average",
      "Automatically prioritize hot leads",
      "AI-generated personalized follow-ups",
      "Predict deal closure probability",
      "Automate repetitive sales tasks",
      "Real-time coaching and recommendations",
    ],
    features: [
      {
        title: "AI Lead Scoring",
        description:
          "Machine learning models analyze engagement patterns and behavioral data to score and prioritize leads automatically.",
        icon: React.createElement(Target),
      },
      {
        title: "Smart Follow-Up Automation",
        description:
          "AI generates personalized follow-up emails and schedules optimal send times based on prospect behavior.",
        icon: React.createElement(Clock),
      },
      {
        title: "Deal Health Monitoring",
        description:
          "Real-time analysis of deal progress with predictive insights on which deals need attention.",
        icon: React.createElement(TrendingUp),
      },
      {
        title: "Sales Playbook Automation",
        description:
          "Automated execution of your sales playbooks with AI-powered recommendations at each stage.",
        icon: React.createElement(Layers),
      },
      {
        title: "Pipeline Intelligence",
        description:
          "Visualize your pipeline with AI predictions on close dates, deal values, and required actions.",
        icon: React.createElement(BarChart2),
      },
      {
        title: "Activity Recommendations",
        description:
          "Get AI-driven suggestions on the next best action for each prospect to move deals forward.",
        icon: React.createElement(Sparkles),
      },
    ],
    steps: [
      {
        title: "Connect Your CRM",
        description:
          "Seamlessly integrate with Salesforce, HubSpot, Pipedrive, or any major CRM platform",
      },
      {
        title: "Train the AI Model",
        description:
          "AI learns from your historical data to understand your sales patterns and success indicators",
      },
      {
        title: "Enable Automations",
        description:
          "Choose which tasks to automate: follow-ups, lead scoring, task creation, and more",
      },
      {
        title: "Start Closing Faster",
        description:
          "Let AI guide your sales process with smart recommendations and automated workflows",
      },
    ],
    useCases: [
      {
        title: "B2B Sales Teams",
        description:
          "Manage complex sales cycles with AI-powered deal intelligence",
        points: [
          "Prioritize accounts most likely to close",
          "Automate multi-touch nurture sequences",
          "Get alerts when prospects show buying signals",
        ],
      },
      {
        title: "Inside Sales Operations",
        description: "Scale your outreach without scaling your team",
        points: [
          "AI-powered lead qualification and routing",
          "Automated follow-up sequences for cold leads",
          "Real-time notifications for high-intent prospects",
        ],
      },
      {
        title: "Sales Managers",
        description: "Gain visibility and coach your team more effectively",
        points: [
          "Pipeline forecasting with AI predictions",
          "Identify at-risk deals before they slip",
          "Track team performance with smart analytics",
        ],
      },
    ],
    testimonials: [
      {
        quote:
          "Our sales cycle dropped from 90 days to 52 days. The AI knows exactly when to follow up and what to say. It's like having a sales expert coaching every rep.",
        name: "David Thompson",
        role: "VP of Sales, Enterprise Solutions Co.",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
      {
        quote:
          "We've increased our win rate by 38% since implementing Smart CRM Closer. The deal health monitoring alone has saved deals we would have otherwise lost.",
        name: "Jennifer Park",
        role: "Director of Revenue Operations, GrowthTech",
        avatar:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
    ],
    faqs: [
      {
        question: "Which CRM platforms do you integrate with?",
        answer:
          "We integrate with all major CRM platforms including Salesforce, HubSpot, Pipedrive, Microsoft Dynamics, Zoho CRM, and Copper. We also offer a REST API for custom integrations.",
      },
      {
        question: "How accurate is the AI lead scoring?",
        answer:
          "After the initial training period (typically 2-4 weeks), our AI achieves 85-92% accuracy in predicting which leads will convert. Accuracy continues to improve as the system learns from your specific sales patterns.",
      },
      {
        question: "Can I customize the automated messages?",
        answer:
          "Yes! While the AI generates personalized content, you can create custom templates, set tone and style preferences, and review messages before they're sent. You have complete control over your brand voice.",
      },
      {
        question: "What happens to my existing CRM data?",
        answer:
          "We read data from your CRM but never modify or delete it without your explicit permission. All AI-generated tasks and notes are clearly labeled and can be edited or removed at any time.",
      },
    ],
    tags: [
      "CRM",
      "Sales Automation",
      "AI-Powered",
      "Lead Management",
      "Pipeline Management",
    ],
  },

  "video-ai-editor": {
    longDescription:
      "Professional video editing powered by artificial intelligence. Automatically cut, trim, enhance, and polish your videos with advanced AI algorithms. Perfect for content creators, marketers, and businesses who need high-quality videos without the time investment.",
    benefits: [
      "Edit videos 10x faster than traditional methods",
      "AI-powered scene detection and cutting",
      "Automatic color correction and enhancement",
      "Smart audio leveling and noise reduction",
      "Intelligent B-roll suggestion and placement",
      "One-click export for all platforms",
    ],
    features: [
      {
        title: "Smart Scene Detection",
        description:
          "AI analyzes your footage and automatically identifies optimal cut points, eliminating filler content and awkward pauses.",
        icon: React.createElement(Video),
      },
      {
        title: "Automatic Color Grading",
        description:
          "Professional color correction applied instantly based on lighting conditions and scene context.",
        icon: React.createElement(Sparkles),
      },
      {
        title: "AI Audio Enhancement",
        description:
          "Automatically remove background noise, balance audio levels, and enhance voice clarity.",
        icon: React.createElement(Mic),
      },
      {
        title: "Intelligent B-Roll Matching",
        description:
          "AI suggests and places relevant B-roll footage based on your script or narration.",
        icon: React.createElement(Layers),
      },
      {
        title: "Smart Transitions",
        description:
          "Automatically apply professional transitions between scenes that match your video style.",
        icon: React.createElement(Zap),
      },
      {
        title: "Multi-Format Export",
        description:
          "Export optimized versions for YouTube, Instagram, TikTok, LinkedIn, and more with one click.",
        icon: React.createElement(Share2),
      },
    ],
    steps: [
      {
        title: "Upload Your Footage",
        description:
          "Drag and drop raw video files or import from cloud storage",
      },
      {
        title: "Choose Your Style",
        description:
          "Select the editing style and pace that matches your content goals",
      },
      {
        title: "Let AI Edit",
        description:
          "AI analyzes and edits your footage automatically, applying professional techniques",
      },
      {
        title: "Review & Export",
        description:
          "Fine-tune any details and export in multiple formats for all your platforms",
      },
    ],
    useCases: [
      {
        title: "YouTube Creators",
        description:
          "Produce professional videos without spending hours in post-production",
        points: [
          "Automatic jump cut removal",
          "Smart thumbnail generation",
          "Chapter marker suggestions based on content",
        ],
      },
      {
        title: "Marketing Teams",
        description: "Create polished promotional videos at scale",
        points: [
          "Batch process multiple videos simultaneously",
          "Brand template application across all content",
          "A/B test different edits automatically",
        ],
      },
      {
        title: "Podcasters",
        description: "Transform audio podcasts into engaging video content",
        points: [
          "AI-generated waveform animations",
          "Automatic guest name overlay placement",
          "Audiogram creation for social media clips",
        ],
      },
    ],
    testimonials: [
      {
        quote:
          "I went from spending 8 hours editing a video to 45 minutes. The AI handles all the tedious cutting and color work, and I just add my creative touches. Game changer for my channel.",
        name: "Marcus Rodriguez",
        role: "YouTube Creator, 850K Subscribers",
        avatar:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
      {
        quote:
          "Our marketing team now produces 5x more video content with the same resources. The quality is consistently professional, which was impossible when everything was manual.",
        name: "Amanda Foster",
        role: "Marketing Director, TechBrand Inc.",
        avatar:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
    ],
    faqs: [
      {
        question: "What video formats does it support?",
        answer:
          "We support all major video formats including MP4, MOV, AVI, MKV, WMV, and more. You can also import directly from smartphones, cameras, and screen recordings.",
      },
      {
        question: "Can I override the AI's editing decisions?",
        answer:
          "Absolutely! The AI provides a first draft, but you have full control to adjust cuts, change colors, modify audio, and fine-tune every aspect of your video.",
      },
      {
        question: "How long does AI processing take?",
        answer:
          "Processing time depends on video length and complexity, but most videos are edited in 2-5 minutes. A 10-minute video typically takes 3-4 minutes to process.",
      },
      {
        question: "Does it work with 4K footage?",
        answer:
          "Yes! We support resolutions from 720p up to 4K (and soon 8K). The AI processing time increases with resolution, but quality is maintained throughout.",
      },
    ],
    tags: ["Video Editing", "AI-Powered", "Content Creation", "Automation"],
  },


  "ai-template-generator": {
    longDescription:
      "Create custom templates for any purpose with AI assistance. From business documents to design templates, generate professional, on-brand templates in minutes. Perfect for agencies, businesses, and creators who need consistent, high-quality templates.",
    benefits: [
      "Generate templates 20x faster",
      "Maintain perfect brand consistency",
      "Create templates for any use case",
      "AI-powered design suggestions",
      "Export in multiple file formats",
      "Build reusable template libraries",
    ],
    features: [
      {
        title: "AI Template Design",
        description:
          "Describe what you need and AI generates professional template designs based on best practices and your brand guidelines.",
        icon: React.createElement(LayoutTemplate),
      },
      {
        title: "Brand Style Sync",
        description:
          "Automatically apply your brand colors, fonts, and design elements across all templates.",
        icon: React.createElement(Palette),
      },
      {
        title: "Multi-Purpose Templates",
        description:
          "Create templates for presentations, documents, social media, marketing materials, and more.",
        icon: React.createElement(Layers),
      },
      {
        title: "Smart Content Blocks",
        description:
          "Pre-designed content blocks that automatically adapt to your template structure.",
        icon: React.createElement(Package),
      },
      {
        title: "Template Library",
        description:
          "Save and organize your custom templates for easy reuse across projects.",
        icon: React.createElement(Database),
      },
      {
        title: "Collaboration Tools",
        description:
          "Share templates with your team and maintain version control automatically.",
        icon: React.createElement(Users),
      },
    ],
    steps: [
      {
        title: "Describe Your Need",
        description:
          "Tell the AI what type of template you need and its purpose",
      },
      {
        title: "Set Brand Guidelines",
        description:
          "Upload your brand assets or let AI extract them from existing materials",
      },
      {
        title: "Generate & Customize",
        description:
          "AI creates template options, you choose and customize the one you like",
      },
      {
        title: "Export & Reuse",
        description:
          "Download in your preferred format and save to your template library",
      },
    ],
    useCases: [
      {
        title: "Marketing Agencies",
        description: "Create client-specific templates at scale",
        points: [
          "Generate brand-compliant materials instantly",
          "Build template libraries for each client",
          "Maintain consistency across campaigns",
        ],
      },
      {
        title: "Content Creators",
        description: "Design templates for regular content production",
        points: [
          "Social media post templates",
          "YouTube thumbnail templates",
          "Newsletter and blog post layouts",
        ],
      },
      {
        title: "Corporate Teams",
        description: "Standardize business document creation",
        points: [
          "Proposal and presentation templates",
          "Report and documentation templates",
          "Internal communication templates",
        ],
      },
    ],
    testimonials: [
      {
        quote:
          "We create branded templates for 50+ clients. This tool cut our design time from hours to minutes while maintaining perfect brand consistency. Absolute game-changer.",
        name: "Emma Richardson",
        role: "Creative Director, Brand Studio",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
      {
        quote:
          "As a solo creator, I was spending too much time on design. Now I have a library of templates that I can customize in seconds. Tripled my content output.",
        name: "Alex Morrison",
        role: "Content Creator & Educator",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
    ],
    faqs: [
      {
        question: "What types of templates can I create?",
        answer:
          "You can create templates for presentations, documents, social media graphics, email newsletters, proposals, reports, marketing materials, and much more. If it's a repeatable design, you can template it.",
      },
      {
        question: "Can I edit templates after they're generated?",
        answer:
          "Yes! All templates are fully editable. You can modify colors, layouts, text, images, and any other element. Changes can be saved as new versions or variations.",
      },
      {
        question: "What file formats do you export?",
        answer:
          "We support exports to PDF, PNG, JPG, SVG, PPTX, DOCX, and HTML formats. You can also save templates in our proprietary format for future editing.",
      },
      {
        question: "How does the AI understand my brand?",
        answer:
          "You can upload brand guidelines, provide examples of existing materials, or input brand elements manually. The AI learns from these inputs to generate on-brand templates automatically.",
      },
    ],
    tags: ["Templates", "Design", "AI-Powered", "Branding", "Productivity"],
  },


  "interactive-shopping": {
    longDescription:
      "Transform static product catalogs into engaging, interactive shopping experiences. Create shoppable videos, interactive product showcases, and immersive brand experiences that drive higher engagement and conversion rates.",
    benefits: [
      "Increase conversion rates by up to 300%",
      "Create shoppable video content",
      "Interactive product demonstrations",
      "Personalized shopping experiences",
      "Seamless checkout integration",
      "Real-time engagement analytics",
    ],
    features: [
      {
        title: "Shoppable Video Creator",
        description:
          "Add clickable product tags to videos, allowing customers to purchase without leaving the content.",
        icon: React.createElement(Video),
      },
      {
        title: "Interactive Product Tours",
        description:
          "Create 360-degree product views and interactive demonstrations that showcase features.",
        icon: React.createElement(Zap),
      },
      {
        title: "AI Product Recommendations",
        description:
          "Smart recommendations based on browsing behavior and shopping patterns.",
        icon: React.createElement(Sparkles),
      },
      {
        title: "Virtual Try-On",
        description:
          "AR-powered try-on features for fashion, accessories, and home decor products.",
        icon: React.createElement(Camera),
      },
      {
        title: "Live Shopping Events",
        description:
          "Host interactive live shopping sessions with real-time product showcases.",
        icon: React.createElement(Users),
      },
      {
        title: "Seamless Checkout",
        description:
          "One-click checkout directly from interactive experiences.",
        icon: React.createElement(ShoppingBag),
      },
    ],
    steps: [
      {
        title: "Upload Product Data",
        description:
          "Connect your e-commerce platform or upload product catalog",
      },
      {
        title: "Create Interactive Content",
        description: "Build shoppable videos, product tours, or AR experiences",
      },
      {
        title: "Add Shopping Features",
        description:
          "Tag products, set up recommendations, and configure checkout",
      },
      {
        title: "Launch & Analyze",
        description:
          "Publish your interactive shopping experience and track performance",
      },
    ],
    useCases: [
      {
        title: "Fashion & Apparel",
        description:
          "Create immersive shopping experiences for clothing and accessories",
        points: [
          "Shoppable lookbook videos",
          "Virtual try-on for accessories",
          "Style guide interactive experiences",
        ],
      },
      {
        title: "Beauty & Cosmetics",
        description: "Showcase products with interactive tutorials",
        points: [
          "Shoppable makeup tutorials",
          "Before/after interactive comparisons",
          "Personalized product recommendations",
        ],
      },
      {
        title: "Home & Lifestyle",
        description: "Help customers visualize products in their space",
        points: [
          "Room design interactive tours",
          "AR furniture placement",
          "Shoppable home decor videos",
        ],
      },
    ],
    testimonials: [
      {
        quote:
          "Interactive video increased our conversion rate by 287%. Customers love being able to shop directly from our content without interrupting their experience.",
        name: "Sophia Martinez",
        role: "E-Commerce Director, Fashion Brand",
        avatar:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
      {
        quote:
          "The AR try-on feature reduced our return rate by 45%. Customers know exactly what they're getting before they buy. ROI was immediate.",
        name: "Daniel Kim",
        role: "Founder, Online Eyewear Boutique",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
    ],
    faqs: [
      {
        question: "Which e-commerce platforms do you integrate with?",
        answer:
          "We integrate with Shopify, WooCommerce, BigCommerce, Magento, and most major e-commerce platforms. We also provide a REST API for custom integrations.",
      },
      {
        question: "Do customers need to create an account?",
        answer:
          "No! We support guest checkout. However, you can offer account creation for returning customers to enhance their experience.",
      },
      {
        question: "Can I track which products get the most engagement?",
        answer:
          "Yes! Our analytics dashboard shows detailed engagement metrics including views, clicks, interactions, and conversions for each product in your interactive content.",
      },
      {
        question: "Does the AR try-on work on all devices?",
        answer:
          "AR features work on most modern smartphones and tablets with camera access. We automatically detect device capabilities and provide the best experience available.",
      },
    ],
    tags: [
      "E-Commerce",
      "Interactive Content",
      "AR",
      "Shopping Experience",
      "Conversion Optimization",
    ],
  },
  "ai-personalized-content": {
    longDescription: "Create personalized marketing content that feels custom-built for every prospect. AI Personalized Content Hub helps business owners, agencies, and marketers turn ordinary content into highly targeted personalized assets. Instead of sending generic messages, images, or campaigns, users can create content that speaks directly to the individual, business, niche, or audience they want to reach. This app is designed to help users create personalized images, personalized video-style messaging, custom outreach content, sales assets, profile-based marketing copy, and campaign ideas that feel more relevant and engaging. Whether someone is reaching out to local businesses, following up with leads, creating client campaigns, or building a high-converting sales experience, AI Personalized Content Hub gives them a faster way to create content that grabs attention and makes prospects feel like the message was made specifically for them.",
    benefits: [
      "Create highly targeted personalized content",
      "Turn generic messages into custom assets",
      "Generate personalized images and videos",
      "Build custom outreach and sales content",
      "Reach individual prospects effectively",
      "Increase engagement with relevant messaging",
    ],
    features: [
      {
        title: "Personalized Content Creation",
        description: "Generate content that speaks directly to individual prospects, businesses, and audiences.",
        icon: React.createElement(Sparkles),
      },
      {
        title: "Multi-Format Output",
        description: "Create personalized images, videos, messaging, and campaign assets.",
        icon: React.createElement(ImageIcon),
      },
      {
        title: "Profile-Based Marketing",
        description: "Generate copy and content based on prospect profiles and business data.",
        icon: React.createElement(CircleUser),
      },
    ],
    useCases: [
      {
        title: "Agency Campaigns",
        description: "Create personalized marketing campaigns for clients.",
        points: ["Custom outreach content", "Targeted messaging", "Business-specific assets"],
      },
      {
        title: "Lead Generation",
        description: "Follow up with leads using personalized content.",
        points: ["Prospect-specific messaging", "Relevant outreach", "Higher conversion rates"],
      },
    ],
    testimonials: [
      {
        quote: "This tool completely changed how we approach personalized marketing. Our response rates increased by 300%.",
        name: "Sarah Johnson",
        role: "Marketing Director",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
    ],
    faqs: [
      {
        question: "What types of content can I personalize?",
        answer: "You can personalize images, videos, email copy, social media posts, sales messages, and marketing campaigns.",
      },
    ],
    tags: ["personalization", "marketing", "content", "outreach", "sales"],
  },

  "funnelcraft-ai": {
    longDescription: "Build smarter funnels faster with AI-powered funnel strategy, structure, and copy. FunnelCraft AI helps users turn ideas, offers, products, and services into organized sales funnels. Instead of trying to figure out every page, section, headline, offer angle, and call to action manually, users can use AI to map out the entire funnel journey from first impression to conversion. This app helps users create funnel concepts, opt-in pages, lead magnets, sales pages, offer stacks, upsell ideas, thank-you pages, email follow-ups, and conversion-focused messaging. It gives entrepreneurs and agencies a faster way to build funnels that are not just attractive, but strategically designed to guide visitors toward taking action.",
    benefits: [
      "Build complete sales funnels with AI assistance",
      "Strategic funnel structure and copy",
      "From idea to conversion in one platform",
      "Pre-built funnel templates",
      "Conversion-optimized messaging",
      "Faster funnel deployment",
    ],
    features: [
      {
        title: "AI Funnel Strategy",
        description: "Get strategic guidance on funnel structure, offers, and messaging.",
        icon: React.createElement(BarChart2),
      },
      {
        title: "Page Generation",
        description: "Create opt-in pages, sales pages, and thank-you pages automatically.",
        icon: React.createElement(Layers),
      },
      {
        title: "Offer Stacking",
        description: "Design upsell and downsell sequences that maximize revenue.",
        icon: React.createElement(TrendingUp),
      },
    ],
    useCases: [
      {
        title: "Product Launches",
        description: "Build complete funnels for new product launches.",
        points: ["Lead magnets", "Sales pages", "Upsell sequences", "Email follow-ups"],
      },
      {
        title: "Service Businesses",
        description: "Create funnels for consulting and service offers.",
        points: ["Lead capture", "Sales presentations", "Client onboarding", "Follow-up sequences"],
      },
    ],
    testimonials: [
      {
        quote: "FunnelCraft AI saved us months of work. We launched our course funnel in days instead of months.",
        name: "Mike Chen",
        role: "Course Creator",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
    ],
    faqs: [
      {
        question: "Do I need technical skills to use this?",
        answer: "No technical skills required. The AI handles the strategy and structure while you customize the content.",
      },
    ],
    tags: ["funnels", "sales", "strategy", "conversion", "marketing"],
  },

  "ai-skills-monetizer": {
    longDescription: "Turn your knowledge, experience, and skills into income-generating offers. AI Skills Monetizer helps users discover how to turn what they already know into something they can sell. Many people have valuable skills, experience, stories, and knowledge, but they struggle to package those abilities into a clear offer. This app helps solve that problem. Users can identify their strongest skills, uncover profitable service ideas, create offer positioning, build packages, define target audiences, and generate messaging that makes their skills easier to sell. It can help someone move from 'I know how to do this' to 'Here is a service, product, or offer I can monetize.'",
    benefits: [
      "Turn skills into profitable offers",
      "Package expertise for maximum value",
      "Create clear service positioning",
      "Build complete offer packages",
      "Generate compelling marketing copy",
      "Increase perceived value of services",
    ],
    features: [
      {
        title: "Skills Assessment",
        description: "Identify your strongest skills and most valuable expertise.",
        icon: React.createElement(Award),
      },
      {
        title: "Offer Creation",
        description: "Generate profitable service ideas and package structures.",
        icon: React.createElement(Package),
      },
      {
        title: "Pricing Strategy",
        description: "Determine optimal pricing based on value and market demand.",
        icon: React.createElement(DollarSign),
      },
    ],
    useCases: [
      {
        title: "Freelancers",
        description: "Package freelance skills into premium services.",
        points: ["Service packages", "Pricing strategies", "Client positioning"],
      },
      {
        title: "Consultants",
        description: "Transform expertise into consulting offers.",
        points: ["Offer creation", "Client acquisition", "Value positioning"],
      },
    ],
    testimonials: [
      {
        quote: "This tool helped me turn my 10 years of experience into a $10K/month consulting business.",
        name: "Jessica Martinez",
        role: "Business Consultant",
        avatar: "https://images.unsplash.com/photo-1554151228-14d9def656e4?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
    ],
    faqs: [
      {
        question: "What if I don't know what my skills are worth?",
        answer: "The AI analyzes market data and helps you price your services competitively while maximizing your income.",
      },
    ],
    tags: ["monetization", "skills", "offers", "freelancing", "consulting"],
  },

  "ai-skills-resume": {
    longDescription: "Perfect your resume and professional skills with AI-powered optimization. AI Skills & Resume helps users enhance their professional presentation and skill development. Instead of generic resume advice, users get AI-powered analysis of their background, personalized recommendations for skill development, and professionally crafted resumes that highlight their unique value proposition.",
    benefits: [
      "AI-optimized resume creation",
      "Personalized skill development plans",
      "Professional positioning advice",
      "ATS-friendly resume formatting",
      "Career advancement strategies",
      "Competitive edge in job market",
    ],
    features: [
      {
        title: "Resume Optimization",
        description: "AI analyzes and optimizes your resume for maximum impact.",
        icon: React.createElement(FileText),
      },
      {
        title: "Skills Assessment",
        description: "Identify skill gaps and development opportunities.",
        icon: React.createElement(Target),
      },
      {
        title: "Career Coaching",
        description: "Get personalized advice for career advancement.",
        icon: React.createElement(Users),
      },
    ],
    useCases: [
      {
        title: "Job Seekers",
        description: "Stand out in competitive job markets.",
        points: ["Resume optimization", "Skills highlighting", "Interview preparation"],
      },
      {
        title: "Career Changers",
        description: "Transition into new career paths.",
        points: ["Skill gap analysis", "Career path planning", "Professional positioning"],
      },
    ],
    testimonials: [
      {
        quote: "Got my dream job after using this to optimize my resume. The AI suggestions were spot-on.",
        name: "David Park",
        role: "Software Engineer",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
    ],
    faqs: [
      {
        question: "Does this work for all industries?",
        answer: "Yes, the AI adapts its recommendations based on your industry and target roles.",
      },
    ],
    tags: ["resume", "skills", "career", "job-search", "professional-development"],
  },

  "sales-page-builder": {
    longDescription: "Create high-converting sales pages without staring at a blank screen. Sales Page Builder helps users create persuasive sales pages for products, services, courses, software, coaching programs, and agency offers. Instead of struggling with headlines, sections, sales copy, benefit bullets, testimonials, bonuses, guarantees, and calls to action, users can generate a structured sales page with AI assistance. This app is built to help users organize their offer into a complete landing page that explains the problem, presents the solution, builds desire, removes objections, and encourages visitors to buy, sign up, register, or book a call.",
    benefits: [
      "High-converting sales page templates",
      "AI-powered copy generation",
      "Complete page structure guidance",
      "Conversion-optimized layouts",
      "No design skills required",
      "Fast page deployment",
    ],
    features: [
      {
        title: "Sales Page Templates",
        description: "Pre-built, conversion-optimized page structures.",
        icon: React.createElement(Layers),
      },
      {
        title: "AI Copy Generation",
        description: "Generate headlines, benefits, and calls-to-action automatically.",
        icon: React.createElement(Sparkles),
      },
      {
        title: "Conversion Elements",
        description: "Add testimonials, guarantees, bonuses, and urgency elements.",
        icon: React.createElement(Target),
      },
    ],
    useCases: [
      {
        title: "Product Sales",
        description: "Create compelling product sales pages.",
        points: ["Product benefits", "Social proof", "Purchase urgency", "Trust signals"],
      },
      {
        title: "Service Offers",
        description: "Build pages for consulting and service businesses.",
        points: ["Service benefits", "Client results", "Booking systems", "Lead capture"],
      },
    ],
    testimonials: [
      {
        quote: "Built a sales page that converted at 12%. This tool paid for itself in the first month.",
        name: "Alex Thompson",
        role: "Product Creator",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
    ],
    faqs: [
      {
        question: "Can I customize the generated pages?",
        answer: "Yes, you get full control over all text, images, colors, and layout elements.",
      },
    ],
    tags: ["sales-pages", "landing-pages", "conversion", "copywriting", "design"],
  },

  "sales-assistant-pro": {
    longDescription: "Get AI-powered help with sales conversations, objections, follow-ups, and closing strategies. Sales Assistant Pro gives users a smarter way to handle sales conversations. Instead of guessing what to say to a prospect, how to respond to objections, or how to follow up after a conversation, users can use AI to generate better sales guidance and messaging. The app helps with sales frameworks, prospect qualification, objection handling, follow-up messages, discovery questions, sales call preparation, closing angles, and lead communication. It acts like a digital sales coach that helps users think through the sales process and communicate with more confidence.",
    benefits: [
      "AI-powered sales conversation guidance",
      "Objection handling strategies",
      "Personalized follow-up messaging",
      "Sales framework recommendations",
      "Confidence in sales interactions",
      "Higher conversion rates",
    ],
    features: [
      {
        title: "Sales Frameworks",
        description: "Access proven sales methodologies and conversation structures.",
        icon: React.createElement(BarChart2),
      },
      {
        title: "Objection Handling",
        description: "Get AI responses to common sales objections and concerns.",
        icon: React.createElement(Target),
      },
      {
        title: "Follow-up Automation",
        description: "Generate personalized follow-up sequences and messaging.",
        icon: React.createElement(Mail),
      },
    ],
    useCases: [
      {
        title: "Sales Calls",
        description: "Prepare for and conduct effective sales conversations.",
        points: ["Call preparation", "Discovery questions", "Objection responses", "Closing techniques"],
      },
      {
        title: "Lead Follow-up",
        description: "Maintain momentum with prospects after initial contact.",
        points: ["Personalized messaging", "Value delivery", "Trust building", "Next steps"],
      },
    ],
    testimonials: [
      {
        quote: "This is like having a sales coach in my pocket. My close rate went from 15% to 35%.",
        name: "Rachel Kim",
        role: "Sales Director",
        avatar: "https://images.unsplash.com/photo-1554151228-14d9def656e4?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
    ],
    faqs: [
      {
        question: "Is this for beginners or experienced salespeople?",
        answer: "It helps both. Beginners get structure and confidence, experienced sellers get optimization and new approaches.",
      },
    ],
    tags: ["sales", "conversations", "objections", "follow-up", "closing"],
  },

  "ai-personalization-studio": {
    longDescription: "Build personalized outreach and marketing campaigns at scale. AI Personalization Studio gives users a creative workspace for building personalized marketing and sales assets. Instead of creating one generic message for everyone, users can generate content that adapts to different prospects, audiences, industries, pain points, and campaign goals. This app can help create personalized intros, outreach messages, email copy, sales scripts, profile-based content, video ideas, campaign angles, and custom marketing assets. It is designed for users who want to make their communication feel more human, relevant, and targeted.",
    benefits: [
      "Scale personalized marketing campaigns",
      "Human-like communication at scale",
      "Multi-channel personalization",
      "Audience-specific messaging",
      "Creative campaign workspace",
      "Higher engagement rates",
    ],
    features: [
      {
        title: "Campaign Personalization",
        description: "Create campaigns that adapt to different audience segments.",
        icon: React.createElement(Megaphone),
      },
      {
        title: "Multi-Channel Content",
        description: "Generate personalized content for email, social, video, and more.",
        icon: React.createElement(Layers),
      },
      {
        title: "Audience Analysis",
        description: "Understand and target specific audience segments effectively.",
        icon: React.createElement(Users),
      },
    ],
    useCases: [
      {
        title: "Outbound Marketing",
        description: "Create personalized cold outreach campaigns.",
        points: ["Personalized intros", "Industry-specific messaging", "Value-driven content"],
      },
      {
        title: "Email Marketing",
        description: "Build segmented, personalized email campaigns.",
        points: ["Dynamic content", "Personalized subject lines", "Segmented messaging"],
      },
    ],
    testimonials: [
      {
        quote: "Our response rates increased 400% after switching to personalized campaigns from this tool.",
        name: "Marcus Johnson",
        role: "Marketing VP",
        avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
    ],
    faqs: [
      {
        question: "How does this scale for large campaigns?",
        answer: "The AI handles personalization at scale, creating unique content for thousands of prospects automatically.",
      },
    ],
    tags: ["personalization", "campaigns", "outreach", "marketing", "scale"],
  },

  "ai-personalizer": {
    longDescription: "Transform basic prospect details into personalized messages, offers, and sales content. AI Personalizer is designed to help users create personalized content quickly from simple information. A user can enter details about a prospect, business, niche, product, or audience, and the app helps turn that information into custom messaging that feels more specific and relevant. This can be used for cold outreach, client follow-up, personalized video scripts, email introductions, sales messages, LinkedIn outreach, direct messages, and local business campaigns. Instead of sending the same message to everyone, users can create communication that feels tailored to the person or business they want to reach.",
    benefits: [
      "Quick personalization from basic details",
      "Custom messaging for every prospect",
      "Relevant communication at scale",
      "Higher response rates",
      "Professional personalization",
      "Time-saving automation",
    ],
    features: [
      {
        title: "Detail-Based Personalization",
        description: "Transform basic prospect info into personalized messaging.",
        icon: React.createElement(Target),
      },
      {
        title: "Multi-Format Output",
        description: "Generate emails, messages, scripts, and campaign content.",
        icon: React.createElement(FileText),
      },
      {
        title: "Local Business Focus",
        description: "Specialized for local business and prospect targeting.",
        icon: React.createElement(Users),
      },
    ],
    useCases: [
      {
        title: "Cold Outreach",
        description: "Create personalized cold emails and messages.",
        points: ["Prospect research", "Custom intros", "Value propositions"],
      },
      {
        title: "Client Follow-up",
        description: "Send personalized follow-up communication.",
        points: ["Client-specific content", "Relationship building", "Next steps"],
      },
    ],
    testimonials: [
      {
        quote: "Turned our generic outreach into personalized conversations. Response rate went from 2% to 18%.",
        name: "Tom Wilson",
        role: "Business Development",
        avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
    ],
    faqs: [
      {
        question: "What kind of details do I need to input?",
        answer: "Basic information like company name, industry, role, location, or specific pain points work best.",
      },
    ],
    tags: ["personalization", "outreach", "prospects", "messaging", "sales"],
  },

  "ai-video-transformer": {
    longDescription: "Turn one video into multiple powerful marketing assets. AI Video Transformer helps users repurpose, improve, and reimagine video content with AI. Instead of letting one video sit in one format, users can transform it into new versions for different platforms, audiences, and campaigns. The app can be positioned as a tool for turning existing videos into short-form clips, social posts, promotional assets, video concepts, captions, alternate scripts, hooks, summaries, and campaign-ready content. It helps creators and agencies get more value from every video they create.",
    benefits: [
      "Maximize video content ROI",
      "Multi-platform repurposing",
      "AI-powered content transformation",
      "Platform-specific optimization",
      "Time-saving automation",
      "Increased content reach",
    ],
    features: [
      {
        title: "Video Repurposing",
        description: "Transform long-form videos into short-form content automatically.",
        icon: React.createElement(Video),
      },
      {
        title: "Multi-Platform Optimization",
        description: "Create platform-specific versions for YouTube, TikTok, Instagram, etc.",
        icon: React.createElement(Share2),
      },
      {
        title: "Content Enhancement",
        description: "Improve videos with AI-powered editing, captions, and effects.",
        icon: React.createElement(Sparkles),
      },
    ],
    useCases: [
      {
        title: "Content Creators",
        description: "Repurpose webinar content for social media.",
        points: ["Short clips", "Social posts", "Platform optimization", "Engagement hooks"],
      },
      {
        title: "Marketing Agencies",
        description: "Create campaign assets from client videos.",
        points: ["Branded content", "Multi-format output", "Campaign adaptation", "Audience targeting"],
      },
    ],
    testimonials: [
      {
        quote: "One webinar turned into 50+ pieces of content. This tool revolutionized our content strategy.",
        name: "Lisa Chen",
        role: "Content Director",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
    ],
    faqs: [
      {
        question: "What video formats are supported?",
        answer: "Supports MP4, MOV, AVI, and most common video formats. Can process videos up to 2GB.",
      },
    ],
    tags: ["video", "repurposing", "content", "marketing", "social-media"],
  },

  "ai-screen-recorder": {
    longDescription: "Record tutorials, demos, walkthroughs, and training videos with AI-powered content support. AI Screen Recorder helps users capture their screen and turn that recording into useful business content. It is perfect for product demos, software walkthroughs, training videos, onboarding lessons, course content, support tutorials, and client presentations. The power of this app goes beyond basic recording. With AI positioning, it can help users turn screen recordings into summaries, captions, scripts, descriptions, follow-up content, documentation, and marketing assets.",
    benefits: [
      "Professional screen recording",
      "AI-powered content enhancement",
      "Automatic content generation",
      "Training video creation",
      "Product demo capabilities",
      "Content repurposing",
    ],
    features: [
      {
        title: "Smart Recording",
        description: "Record screen with AI-powered editing and enhancement features.",
        icon: React.createElement(Camera),
      },
      {
        title: "Content Generation",
        description: "Automatically generate summaries, captions, and descriptions from recordings.",
        icon: React.createElement(FileText),
      },
      {
        title: "Tutorial Creation",
        description: "Create step-by-step tutorials and training content.",
        icon: React.createElement(Book),
      },
    ],
    useCases: [
      {
        title: "Software Training",
        description: "Create training videos for software and processes.",
        points: ["Step-by-step guides", "Process documentation", "Onboarding content"],
      },
      {
        title: "Product Demos",
        description: "Record and enhance product demonstrations.",
        points: ["Feature walkthroughs", "Use case examples", "Client presentations"],
      },
    ],
    testimonials: [
      {
        quote: "Our training videos went from basic recordings to professional content. Support tickets decreased by 40%.",
        name: "James Rodriguez",
        role: "Customer Success Manager",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
    ],
    faqs: [
      {
        question: "Does it record audio and webcam?",
        answer: "Yes, it records screen, audio, webcam, and system audio simultaneously for complete tutorials.",
      },
    ],
    tags: ["screen-recording", "tutorials", "training", "demos", "content"],
  },

  "ai-signature": {
    longDescription: "Turn every email into a branded marketing opportunity. AI Signature helps users create professional, modern, and conversion-focused email signatures. Instead of using a plain name and phone number at the bottom of an email, users can create branded signatures that promote their business, offers, booking links, social profiles, videos, and calls to action. This app is ideal for entrepreneurs, agencies, consultants, sales teams, and business owners who want their everyday emails to work harder. A well-designed email signature can build trust, increase clicks, promote offers, and make every message look more professional.",
    benefits: [
      "Professional email branding",
      "Marketing through every email",
      "Conversion-focused signatures",
      "Trust and credibility building",
      "Lead generation from signatures",
      "Professional communication",
    ],
    features: [
      {
        title: "Signature Design",
        description: "Create beautiful, branded email signatures with AI assistance.",
        icon: React.createElement(FileSignature),
      },
      {
        title: "Marketing Integration",
        description: "Include offers, CTAs, and promotional elements in signatures.",
        icon: React.createElement(Megaphone),
      },
      {
        title: "Social Proof",
        description: "Add testimonials, badges, and credibility indicators.",
        icon: React.createElement(Award),
      },
    ],
    useCases: [
      {
        title: "Business Owners",
        description: "Build credibility with every email sent.",
        points: ["Professional branding", "Lead generation", "Trust building"],
      },
      {
        title: "Sales Teams",
        description: "Include booking links and offers in signatures.",
        points: ["Appointment booking", "Lead capture", "Sales promotion"],
      },
    ],
    testimonials: [
      {
        quote: "My email signature now generates more leads than my website. This tool is incredible.",
        name: "Sarah Mitchell",
        role: "Real Estate Agent",
        avatar: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
    ],
    faqs: [
      {
        question: "Can I include links and images?",
        answer: "Yes, you can include website links, booking links, social media links, and professional headshots.",
      },
    ],
    tags: ["email", "signatures", "branding", "marketing", "professional"],
  },

  "ai-thumbnail-generator": {
    longDescription: "Create scroll-stopping thumbnails that get more clicks. AI Thumbnail Generator helps users create attention-grabbing thumbnail ideas and visuals for videos, webinars, social content, courses, ads, and promotional campaigns. Instead of guessing what will make someone stop scrolling, users can generate thumbnail concepts built around curiosity, emotion, clarity, and visual impact. The app can help create thumbnail headlines, design ideas, image prompts, layout concepts, facial expression ideas, color direction, and multiple creative variations for different platforms.",
    benefits: [
      "Higher click-through rates",
      "Attention-grabbing visuals",
      "Platform-optimized designs",
      "A/B testing capabilities",
      "Creative thumbnail variations",
      "Professional presentation",
    ],
    features: [
      {
        title: "Thumbnail Concepts",
        description: "Generate attention-grabbing thumbnail ideas and designs.",
        icon: React.createElement(ImageIcon),
      },
      {
        title: "Platform Optimization",
        description: "Create thumbnails optimized for YouTube, TikTok, Instagram, etc.",
        icon: React.createElement(Target),
      },
      {
        title: "A/B Testing",
        description: "Generate multiple variations to test performance.",
        icon: React.createElement(BarChart2),
      },
    ],
    useCases: [
      {
        title: "YouTube Creators",
        description: "Create thumbnails that stop scrollers.",
        points: ["Click-worthy designs", "Text overlays", "Face expressions", "Color psychology"],
      },
      {
        title: "Course Creators",
        description: "Design compelling course preview thumbnails.",
        points: ["Professional appearance", "Value communication", "Trust signals"],
      },
    ],
    testimonials: [
      {
        quote: "My video views increased 300% after using this for thumbnails. The AI understands what works.",
        name: "Carlos Mendoza",
        role: "YouTube Creator",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
    ],
    faqs: [
      {
        question: "What image styles does it create?",
        answer: "It generates modern, professional thumbnails with text overlays, color schemes, and visual elements optimized for engagement.",
      },
    ],
    tags: ["thumbnails", "video", "design", "clicks", "marketing"],
  },

  "profile-gen": {
    longDescription: "Create polished professional profiles, bios, and positioning statements in minutes. Profile Gen helps users turn basic personal or business information into strong, professional profile copy. Whether someone needs a LinkedIn bio, creator profile, founder bio, speaker bio, agency profile, consultant description, or short introduction, this app helps generate clear and persuasive positioning. The app is useful for people who struggle to explain what they do in a way that sounds professional, confident, and valuable. It can create short bios, long-form profiles, social media descriptions, authority positioning, and niche-specific personal branding copy.",
    benefits: [
      "Professional profile creation",
      "Authority positioning",
      "Personal branding assistance",
      "Multiple platform optimization",
      "Confidence in self-presentation",
      "Career advancement support",
    ],
    features: [
      {
        title: "Bio Generation",
        description: "Create compelling bios for LinkedIn, websites, and social media.",
        icon: React.createElement(CircleUser),
      },
      {
        title: "Positioning Strategy",
        description: "Develop clear value propositions and professional positioning.",
        icon: React.createElement(Target),
      },
      {
        title: "Platform Optimization",
        description: "Tailor profiles for different platforms and audiences.",
        icon: React.createElement(Share2),
      },
    ],
    useCases: [
      {
        title: "Job Seekers",
        description: "Create standout LinkedIn profiles and resumes.",
        points: ["Professional bios", "Career positioning", "Personal branding"],
      },
      {
        title: "Business Owners",
        description: "Develop founder bios and company profiles.",
        points: ["Leadership positioning", "Authority building", "Professional credibility"],
      },
    ],
    testimonials: [
      {
        quote: "This tool helped me rewrite my LinkedIn profile and land my dream job. The positioning was perfect.",
        name: "Emma Thompson",
        role: "Marketing Executive",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
    ],
    faqs: [
      {
        question: "How long are the generated bios?",
        answer: "You can generate short bios (50-100 words) for LinkedIn, or longer profiles (200-500 words) for websites and speaking engagements.",
      },
    ],
    tags: ["profiles", "bios", "personal-branding", "professional", "positioning"],
  },

  "ai-video-editor": {
    longDescription: "Edit, improve, and repurpose videos faster with AI assistance. AI Video Editor helps users turn raw footage into more polished video content. It is designed for creators, marketers, agencies, course builders, and business owners who need to edit videos without getting overwhelmed by complicated editing software. The app can support workflows such as trimming clips, organizing scenes, generating edits, preparing social-ready videos, creating captions, improving video flow, and transforming raw content into finished marketing assets.",
    benefits: [
      "Fast video editing without complexity",
      "AI-powered editing assistance",
      "Professional-quality results",
      "Multiple output formats",
      "Social media optimization",
      "Caption generation",
    ],
    features: [
      {
        title: "Smart Editing",
        description: "AI-powered video editing with intelligent cut detection and scene organization.",
        icon: React.createElement(Scissors),
      },
      {
        title: "Caption Generation",
        description: "Automatically generate accurate captions for accessibility and SEO.",
        icon: React.createElement(FileText),
      },
      {
        title: "Format Optimization",
        description: "Prepare videos for different platforms and aspect ratios.",
        icon: React.createElement(Video),
      },
    ],
    useCases: [
      {
        title: "Content Creators",
        description: "Edit raw footage into polished content quickly.",
        points: ["Clip trimming", "Scene organization", "Social formatting", "Caption addition"],
      },
      {
        title: "Marketing Agencies",
        description: "Create professional video content for clients.",
        points: ["Brand consistency", "Quick turnaround", "Professional quality", "Multi-platform output"],
      },
    ],
    testimonials: [
      {
        quote: "I went from 4-hour editing sessions to 30 minutes. This tool changed everything for my YouTube channel.",
        name: "Michael Torres",
        role: "Content Creator",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
    ],
    faqs: [
      {
        question: "What video formats are supported?",
        answer: "Supports MP4, MOV, AVI, and can export to multiple formats optimized for different platforms.",
      },
    ],
    tags: ["video-editing", "content-creation", "captions", "social-media", "marketing"],
  },

  "ai-referral-maximizer-pro": {
    longDescription: "Turn happy customers into a repeatable referral engine. AI Referral Maximizer Pro helps businesses generate more referrals from the customers, partners, contacts, and advocates they already have. Instead of waiting for word-of-mouth to happen randomly, this app helps users create a structured referral strategy powered by AI. The app can help generate referral campaigns, outreach messages, customer follow-ups, partner referral scripts, incentive ideas, referral request emails, and campaign sequences designed to encourage more introductions and recommendations.",
    benefits: [
      "Structured referral system",
      "AI-powered campaign creation",
      "Higher referral conversion rates",
      "Automated follow-up sequences",
      "Partner and customer engagement",
      "Repeatable referral engine",
    ],
    features: [
      {
        title: "Referral Campaigns",
        description: "Create and manage comprehensive referral marketing campaigns.",
        icon: React.createElement(Megaphone),
      },
      {
        title: "AI Messaging",
        description: "Generate personalized referral request messages and follow-ups.",
        icon: React.createElement(Mail),
      },
      {
        title: "Incentive Optimization",
        description: "Design referral incentives that maximize participation and results.",
        icon: React.createElement(DollarSign),
      },
    ],
    useCases: [
      {
        title: "Service Businesses",
        description: "Generate referrals from satisfied clients.",
        points: ["Client follow-ups", "Referral requests", "Incentive programs", "Tracking systems"],
      },
      {
        title: "B2B Companies",
        description: "Leverage partner networks for referrals.",
        points: ["Partner outreach", "Joint campaigns", "Referral agreements", "Performance tracking"],
      },
    ],
    testimonials: [
      {
        quote: "Our referrals increased 250% after implementing the AI-generated campaign. Best investment we made.",
        name: "Jennifer Walsh",
        role: "Business Development Director",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
    ],
    faqs: [
      {
        question: "How do I track referral performance?",
        answer: "The system includes built-in tracking, attribution, and analytics to measure referral source and conversion.",
      },
    ],
    tags: ["referrals", "marketing", "customers", "growth", "automation"],
  },

  "ai-sales-maximizer": {
    longDescription: "Find more revenue opportunities inside your sales pipeline. AI Sales Maximizer helps users improve sales performance by analyzing opportunities, improving sales messaging, and identifying ways to increase conversions. Instead of simply tracking contacts and deals, this app helps users think strategically about how to move prospects closer to buying. The app can help with deal analysis, pipeline improvement, objection strategy, follow-up planning, sales forecasting, conversion optimization, and revenue-focused recommendations. For business owners, sales teams, agencies, and SmartCRM users, AI Sales Maximizer acts like a sales intelligence assistant built to help increase close rates and revenue.",
    benefits: [
      "AI-powered sales intelligence",
      "Pipeline optimization",
      "Higher close rates",
      "Revenue growth strategies",
      "Deal analysis and insights",
      "Sales forecasting accuracy",
    ],
    features: [
      {
        title: "Pipeline Analysis",
        description: "AI analyzes your sales pipeline to identify opportunities and bottlenecks.",
        icon: React.createElement(BarChart2),
      },
      {
        title: "Deal Strategy",
        description: "Get strategic recommendations for moving deals forward.",
        icon: React.createElement(Target),
      },
      {
        title: "Sales Forecasting",
        description: "Predict deal outcomes and revenue with AI-powered analytics.",
        icon: React.createElement(TrendingUp),
      },
    ],
    useCases: [
      {
        title: "Sales Teams",
        description: "Optimize team performance and close rates.",
        points: ["Deal strategy", "Objection handling", "Follow-up optimization", "Revenue forecasting"],
      },
      {
        title: "Business Owners",
        description: "Improve sales processes and revenue generation.",
        points: ["Pipeline analysis", "Sales intelligence", "Conversion optimization", "Growth strategies"],
      },
    ],
    testimonials: [
      {
        quote: "This tool identified $500K in stuck deals. After implementing the recommendations, we closed 80% of them.",
        name: "Robert Chang",
        role: "VP of Sales",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
    ],
    faqs: [
      {
        question: "Does this integrate with CRM systems?",
        answer: "Yes, it works seamlessly with SmartCRM and can integrate with other popular CRM platforms.",
      },
    ],
    tags: ["sales", "pipeline", "revenue", "analytics", "optimization"],
  },

  "contentai": {
    longDescription: "Plan, create, and organize social media content with AI. ContentAI helps users create a consistent content marketing plan without the daily stress of figuring out what to post. It is designed as an AI-powered social media calendar that helps users generate ideas, captions, campaigns, themes, and promotional content. Instead of randomly posting whenever inspiration hits, users can plan their content in advance, create structured campaigns, and organize posts around launches, offers, education, authority-building, and engagement.",
    benefits: [
      "Consistent content planning",
      "AI-powered content generation",
      "Social media calendar management",
      "Engagement optimization",
      "Campaign organization",
      "Time-saving automation",
    ],
    features: [
      {
        title: "Content Calendar",
        description: "Plan and organize social media content with AI assistance.",
        icon: React.createElement(Calendar),
      },
      {
        title: "Caption Generation",
        description: "Create engaging captions and copy for social media posts.",
        icon: React.createElement(FileText),
      },
      {
        title: "Campaign Planning",
        description: "Build structured content campaigns around specific goals.",
        icon: React.createElement(Megaphone),
      },
    ],
    useCases: [
      {
        title: "Social Media Managers",
        description: "Plan and execute comprehensive social strategies.",
        points: ["Content planning", "Calendar management", "Campaign execution", "Engagement tracking"],
      },
      {
        title: "Business Owners",
        description: "Maintain consistent social media presence.",
        points: ["Regular posting", "Content variety", "Audience engagement", "Brand consistency"],
      },
    ],
    testimonials: [
      {
        quote: "Went from posting randomly to a 300% increase in engagement. This tool made social media manageable.",
        name: "Sophie Laurent",
        role: "Social Media Director",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
    ],
    faqs: [
      {
        question: "Does it work for multiple social platforms?",
        answer: "Yes, it generates platform-specific content for Instagram, Facebook, LinkedIn, Twitter, and TikTok.",
      },
    ],
    tags: ["social-media", "content", "planning", "marketing", "automation"],
  },

  "product-research-ai": {
    longDescription: "Research product ideas, competitors, markets, and offers faster with AI. Product Research AI helps entrepreneurs, marketers, agencies, and product creators turn raw ideas into clearer business opportunities. Instead of guessing whether a product is worth building or how it should be positioned, users can use AI to research the market, understand customer problems, analyze competitors, and shape a stronger offer. The app can help users explore product ideas, identify target customers, compare competitors, discover pain points, generate feature ideas, create positioning angles, and organize research into a more useful product strategy.",
    benefits: [
      "Faster product validation",
      "Market research automation",
      "Competitor analysis",
      "Customer insights",
      "Product positioning",
      "Risk reduction",
    ],
    features: [
      {
        title: "Market Research",
        description: "Analyze market size, trends, and opportunities automatically.",
        icon: React.createElement(BarChart2),
      },
      {
        title: "Competitor Analysis",
        description: "Research competitors, positioning, and market gaps.",
        icon: React.createElement(Target),
      },
      {
        title: "Customer Research",
        description: "Understand customer pain points and buying behavior.",
        icon: React.createElement(Users),
      },
    ],
    useCases: [
      {
        title: "Product Founders",
        description: "Validate product ideas before building.",
        points: ["Market validation", "Customer research", "Competitor analysis", "Positioning strategy"],
      },
      {
        title: "Marketing Agencies",
        description: "Research client product opportunities.",
        points: ["Market analysis", "Competitive intelligence", "Customer insights", "Strategy development"],
      },
    ],
    testimonials: [
      {
        quote: "Saved us 6 months of research. We knew exactly what to build and how to position it before writing a single line of code.",
        name: "Amanda Foster",
        role: "Product Manager",
        avatar: "https://images.unsplash.com/photo-1554151228-14d9def656e4?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      },
    ],
    faqs: [
      {
        question: "What kind of products can I research?",
        answer: "Any product or service - SaaS, physical products, courses, consulting services, apps, and digital products.",
      },
    ],
    tags: ["research", "products", "market-analysis", "competitors", "validation"],
  },
};

// Helper function to merge enhanced data with basic app data
export function getEnhancedAppData(appId: string, basicData: any) {
  const enhanced = enhancedAppDetails[appId];
  if (!enhanced) {
    return basicData;
  }

  return {
    ...basicData,
    ...enhanced,
  };
}
