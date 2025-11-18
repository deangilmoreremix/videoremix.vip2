import React from 'react';
import { Video, Users, Image as ImageIcon, Sparkles, Palette, CircleUser as UserCircle, Package, Layers, FileText, Mic, Megaphone, Database, DollarSign, Ligature as FileSignature, LayoutTemplate, ShoppingBag, Briefcase, Clock, Award, Zap, Share2, TrendingUp, Target, BarChart2, Camera } from 'lucide-react';

export const enhancedAppDetails: Record<string, any> = {
  'ai-referral-maximizer': {
    longDescription: 'Transform your referral program into a revenue-generating powerhouse with AI-driven optimization. Our intelligent system analyzes referral patterns, identifies high-value advocates, and automates personalized outreach to maximize conversions.',
    benefits: [
      'Increase referral conversions by up to 300%',
      'Automate personalized referral communications',
      'Identify and reward top advocates automatically',
      'Track ROI with advanced analytics dashboard',
      'Integrate seamlessly with existing CRM systems',
      'A/B test referral messaging automatically'
    ],
    features: [
      {
        title: 'AI-Powered Advocate Identification',
        description: 'Machine learning algorithms identify your most influential customers and predict who is most likely to refer successfully.',
        icon: React.createElement(Target)
      },
      {
        title: 'Automated Incentive Optimization',
        description: 'Dynamically adjust rewards based on customer behavior and referral success rates to maximize ROI.',
        icon: React.createElement(TrendingUp)
      },
      {
        title: 'Personalized Outreach Campaigns',
        description: 'Generate custom referral messages for each advocate based on their communication preferences and relationship history.',
        icon: React.createElement(Users)
      },
      {
        title: 'Real-Time Analytics Dashboard',
        description: 'Monitor referral performance, track conversion rates, and measure program ROI with comprehensive analytics.',
        icon: React.createElement(BarChart2)
      },
      {
        title: 'Multi-Channel Distribution',
        description: 'Enable referrals across email, SMS, social media, and custom landing pages for maximum reach.',
        icon: React.createElement(Share2)
      },
      {
        title: 'Fraud Detection System',
        description: 'AI-powered fraud detection ensures program integrity by identifying suspicious referral patterns.',
        icon: React.createElement(Award)
      }
    ],
    steps: [
      {
        title: 'Set Your Goals',
        description: 'Define your referral program objectives, target metrics, and reward structure'
      },
      {
        title: 'Import Customer Data',
        description: 'Connect your CRM or upload customer lists to identify potential advocates'
      },
      {
        title: 'Configure AI Rules',
        description: 'Let AI optimize messaging, timing, and incentives based on your goals'
      },
      {
        title: 'Launch & Monitor',
        description: 'Activate your program and watch AI-driven optimization increase referrals'
      }
    ],
    useCases: [
      {
        title: 'SaaS Companies',
        description: 'Drive customer acquisition through automated referral campaigns',
        points: [
          'Reduce customer acquisition costs by 40-60%',
          'Automate advocate identification and outreach',
          'Track lifetime value of referred customers'
        ]
      },
      {
        title: 'E-Commerce Brands',
        description: 'Turn customers into brand ambassadors with intelligent incentives',
        points: [
          'Personalized referral offers based on purchase history',
          'Social media integration for viral growth',
          'Dynamic reward structures that maximize participation'
        ]
      },
      {
        title: 'Service Businesses',
        description: 'Scale word-of-mouth marketing with AI automation',
        points: [
          'Identify satisfied clients most likely to refer',
          'Automate thank-you and follow-up communications',
          'Track referral source attribution accurately'
        ]
      }
    ],
    testimonials: [
      {
        quote: "We increased our referral rate from 8% to 31% in just 3 months. The AI identifies exactly who to target and when. Our customer acquisition costs have dropped by 55%.",
        name: "Sarah Martinez",
        role: "VP of Growth, TechFlow Solutions",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      },
      {
        quote: "The automated advocate identification is incredible. We've discovered our most valuable referrers weren't who we expected. This tool paid for itself in the first month.",
        name: "Michael Chen",
        role: "CMO, CloudScale Inc.",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      }
    ],
    faqs: [
      {
        question: "How does the AI identify potential advocates?",
        answer: "Our AI analyzes multiple data points including purchase history, engagement patterns, customer satisfaction scores, social media activity, and communication responsiveness to predict which customers are most likely to make successful referrals."
      },
      {
        question: "Can I customize the referral incentives?",
        answer: "Absolutely! You have full control over incentive structures. The AI can also test different reward levels and recommend optimal incentives based on your program performance data."
      },
      {
        question: "How does it integrate with my existing systems?",
        answer: "We offer native integrations with major CRM platforms, marketing automation tools, and e-commerce platforms. We also provide a robust API for custom integrations."
      },
      {
        question: "What kind of ROI can I expect?",
        answer: "Most customers see a 200-400% increase in qualified referrals within the first 3 months. The average customer acquisition cost reduction is 45-60%, with some customers achieving even higher results."
      }
    ],
    tags: ['Lead Generation', 'Marketing Automation', 'AI-Powered', 'Growth Hacking']
  },

  'smart-crm-closer': {
    longDescription: 'Close deals faster with AI-powered CRM intelligence that predicts buying signals, automates follow-ups, and optimizes your sales pipeline. Never miss an opportunity with smart notifications and automated nurture sequences.',
    benefits: [
      'Close deals 42% faster on average',
      'Automatically prioritize hot leads',
      'AI-generated personalized follow-ups',
      'Predict deal closure probability',
      'Automate repetitive sales tasks',
      'Real-time coaching and recommendations'
    ],
    features: [
      {
        title: 'AI Lead Scoring',
        description: 'Machine learning models analyze engagement patterns and behavioral data to score and prioritize leads automatically.',
        icon: React.createElement(Target)
      },
      {
        title: 'Smart Follow-Up Automation',
        description: 'AI generates personalized follow-up emails and schedules optimal send times based on prospect behavior.',
        icon: React.createElement(Clock)
      },
      {
        title: 'Deal Health Monitoring',
        description: 'Real-time analysis of deal progress with predictive insights on which deals need attention.',
        icon: React.createElement(TrendingUp)
      },
      {
        title: 'Sales Playbook Automation',
        description: 'Automated execution of your sales playbooks with AI-powered recommendations at each stage.',
        icon: React.createElement(Layers)
      },
      {
        title: 'Pipeline Intelligence',
        description: 'Visualize your pipeline with AI predictions on close dates, deal values, and required actions.',
        icon: React.createElement(BarChart2)
      },
      {
        title: 'Activity Recommendations',
        description: 'Get AI-driven suggestions on the next best action for each prospect to move deals forward.',
        icon: React.createElement(Sparkles)
      }
    ],
    steps: [
      {
        title: 'Connect Your CRM',
        description: 'Seamlessly integrate with Salesforce, HubSpot, Pipedrive, or any major CRM platform'
      },
      {
        title: 'Train the AI Model',
        description: 'AI learns from your historical data to understand your sales patterns and success indicators'
      },
      {
        title: 'Enable Automations',
        description: 'Choose which tasks to automate: follow-ups, lead scoring, task creation, and more'
      },
      {
        title: 'Start Closing Faster',
        description: 'Let AI guide your sales process with smart recommendations and automated workflows'
      }
    ],
    useCases: [
      {
        title: 'B2B Sales Teams',
        description: 'Manage complex sales cycles with AI-powered deal intelligence',
        points: [
          'Prioritize accounts most likely to close',
          'Automate multi-touch nurture sequences',
          'Get alerts when prospects show buying signals'
        ]
      },
      {
        title: 'Inside Sales Operations',
        description: 'Scale your outreach without scaling your team',
        points: [
          'AI-powered lead qualification and routing',
          'Automated follow-up sequences for cold leads',
          'Real-time notifications for high-intent prospects'
        ]
      },
      {
        title: 'Sales Managers',
        description: 'Gain visibility and coach your team more effectively',
        points: [
          'Pipeline forecasting with AI predictions',
          'Identify at-risk deals before they slip',
          'Track team performance with smart analytics'
        ]
      }
    ],
    testimonials: [
      {
        quote: "Our sales cycle dropped from 90 days to 52 days. The AI knows exactly when to follow up and what to say. It's like having a sales expert coaching every rep.",
        name: "David Thompson",
        role: "VP of Sales, Enterprise Solutions Co.",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      },
      {
        quote: "We've increased our win rate by 38% since implementing Smart CRM Closer. The deal health monitoring alone has saved deals we would have otherwise lost.",
        name: "Jennifer Park",
        role: "Director of Revenue Operations, GrowthTech",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      }
    ],
    faqs: [
      {
        question: "Which CRM platforms do you integrate with?",
        answer: "We integrate with all major CRM platforms including Salesforce, HubSpot, Pipedrive, Microsoft Dynamics, Zoho CRM, and Copper. We also offer a REST API for custom integrations."
      },
      {
        question: "How accurate is the AI lead scoring?",
        answer: "After the initial training period (typically 2-4 weeks), our AI achieves 85-92% accuracy in predicting which leads will convert. Accuracy continues to improve as the system learns from your specific sales patterns."
      },
      {
        question: "Can I customize the automated messages?",
        answer: "Yes! While the AI generates personalized content, you can create custom templates, set tone and style preferences, and review messages before they're sent. You have complete control over your brand voice."
      },
      {
        question: "What happens to my existing CRM data?",
        answer: "We read data from your CRM but never modify or delete it without your explicit permission. All AI-generated tasks and notes are clearly labeled and can be edited or removed at any time."
      }
    ],
    tags: ['CRM', 'Sales Automation', 'AI-Powered', 'Lead Management', 'Pipeline Management']
  },

  'video-ai-editor': {
    longDescription: 'Professional video editing powered by artificial intelligence. Automatically cut, trim, enhance, and polish your videos with advanced AI algorithms. Perfect for content creators, marketers, and businesses who need high-quality videos without the time investment.',
    benefits: [
      'Edit videos 10x faster than traditional methods',
      'AI-powered scene detection and cutting',
      'Automatic color correction and enhancement',
      'Smart audio leveling and noise reduction',
      'Intelligent B-roll suggestion and placement',
      'One-click export for all platforms'
    ],
    features: [
      {
        title: 'Smart Scene Detection',
        description: 'AI analyzes your footage and automatically identifies optimal cut points, eliminating filler content and awkward pauses.',
        icon: React.createElement(Video)
      },
      {
        title: 'Automatic Color Grading',
        description: 'Professional color correction applied instantly based on lighting conditions and scene context.',
        icon: React.createElement(Sparkles)
      },
      {
        title: 'AI Audio Enhancement',
        description: 'Automatically remove background noise, balance audio levels, and enhance voice clarity.',
        icon: React.createElement(Mic)
      },
      {
        title: 'Intelligent B-Roll Matching',
        description: 'AI suggests and places relevant B-roll footage based on your script or narration.',
        icon: React.createElement(Layers)
      },
      {
        title: 'Smart Transitions',
        description: 'Automatically apply professional transitions between scenes that match your video style.',
        icon: React.createElement(Zap)
      },
      {
        title: 'Multi-Format Export',
        description: 'Export optimized versions for YouTube, Instagram, TikTok, LinkedIn, and more with one click.',
        icon: React.createElement(Share2)
      }
    ],
    steps: [
      {
        title: 'Upload Your Footage',
        description: 'Drag and drop raw video files or import from cloud storage'
      },
      {
        title: 'Choose Your Style',
        description: 'Select the editing style and pace that matches your content goals'
      },
      {
        title: 'Let AI Edit',
        description: 'AI analyzes and edits your footage automatically, applying professional techniques'
      },
      {
        title: 'Review & Export',
        description: 'Fine-tune any details and export in multiple formats for all your platforms'
      }
    ],
    useCases: [
      {
        title: 'YouTube Creators',
        description: 'Produce professional videos without spending hours in post-production',
        points: [
          'Automatic jump cut removal',
          'Smart thumbnail generation',
          'Chapter marker suggestions based on content'
        ]
      },
      {
        title: 'Marketing Teams',
        description: 'Create polished promotional videos at scale',
        points: [
          'Batch process multiple videos simultaneously',
          'Brand template application across all content',
          'A/B test different edits automatically'
        ]
      },
      {
        title: 'Podcasters',
        description: 'Transform audio podcasts into engaging video content',
        points: [
          'AI-generated waveform animations',
          'Automatic guest name overlay placement',
          'Audiogram creation for social media clips'
        ]
      }
    ],
    testimonials: [
      {
        quote: "I went from spending 8 hours editing a video to 45 minutes. The AI handles all the tedious cutting and color work, and I just add my creative touches. Game changer for my channel.",
        name: "Marcus Rodriguez",
        role: "YouTube Creator, 850K Subscribers",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      },
      {
        quote: "Our marketing team now produces 5x more video content with the same resources. The quality is consistently professional, which was impossible when everything was manual.",
        name: "Amanda Foster",
        role: "Marketing Director, TechBrand Inc.",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      }
    ],
    faqs: [
      {
        question: "What video formats does it support?",
        answer: "We support all major video formats including MP4, MOV, AVI, MKV, WMV, and more. You can also import directly from smartphones, cameras, and screen recordings."
      },
      {
        question: "Can I override the AI's editing decisions?",
        answer: "Absolutely! The AI provides a first draft, but you have full control to adjust cuts, change colors, modify audio, and fine-tune every aspect of your video."
      },
      {
        question: "How long does AI processing take?",
        answer: "Processing time depends on video length and complexity, but most videos are edited in 2-5 minutes. A 10-minute video typically takes 3-4 minutes to process."
      },
      {
        question: "Does it work with 4K footage?",
        answer: "Yes! We support resolutions from 720p up to 4K (and soon 8K). The AI processing time increases with resolution, but quality is maintained throughout."
      }
    ],
    tags: ['Video Editing', 'AI-Powered', 'Content Creation', 'Automation']
  },

  'ai-skills-monetizer': {
    longDescription: 'Transform your expertise into a profitable online business with AI-powered tools that help you create, package, and sell your skills. From course creation to consulting services, monetize what you know with intelligent automation.',
    benefits: [
      'Launch your online business in days, not months',
      'AI-generated course outlines and content',
      'Automated pricing optimization',
      'Smart marketing campaign creation',
      'Built-in payment and scheduling systems',
      'Analytics to track revenue and growth'
    ],
    features: [
      {
        title: 'AI Course Builder',
        description: 'Input your expertise area and AI generates a complete course outline with lessons, activities, and assessments.',
        icon: React.createElement(Layers)
      },
      {
        title: 'Smart Pricing Engine',
        description: 'AI analyzes market data and competitor pricing to recommend optimal rates for your services.',
        icon: React.createElement(DollarSign)
      },
      {
        title: 'Content Creation Assistant',
        description: 'Generate lesson scripts, worksheets, and marketing materials with AI-powered content creation tools.',
        icon: React.createElement(FileText)
      },
      {
        title: 'Automated Marketing',
        description: 'AI creates email sequences, social media content, and ad copy tailored to your target audience.',
        icon: React.createElement(Megaphone)
      },
      {
        title: 'Sales Funnel Builder',
        description: 'Pre-built funnel templates optimized by AI for maximum conversion rates.',
        icon: React.createElement(TrendingUp)
      },
      {
        title: 'Client Management',
        description: 'Integrated scheduling, payment processing, and client communication tools.',
        icon: React.createElement(Users)
      }
    ],
    steps: [
      {
        title: 'Define Your Expertise',
        description: 'Tell the AI about your skills, experience, and who you want to help'
      },
      {
        title: 'Create Your Offer',
        description: 'AI helps structure your knowledge into courses, coaching, or consulting packages'
      },
      {
        title: 'Set Up Marketing',
        description: 'Generate landing pages, email campaigns, and promotional materials automatically'
      },
      {
        title: 'Launch & Grow',
        description: 'Start accepting clients and let AI optimize pricing and marketing based on performance'
      }
    ],
    useCases: [
      {
        title: 'Coaches & Consultants',
        description: 'Package your expertise into scalable offers',
        points: [
          'Create group coaching programs',
          'Automate client onboarding',
          'Generate personalized coaching materials'
        ]
      },
      {
        title: 'Subject Matter Experts',
        description: 'Turn your knowledge into passive income',
        points: [
          'Build self-paced online courses',
          'Create downloadable resources and templates',
          'Offer premium community memberships'
        ]
      },
      {
        title: 'Freelancers',
        description: 'Transition from hourly work to scalable products',
        points: [
          'Package services into retainer offerings',
          'Create training materials for clients',
          'Build a library of reusable resources'
        ]
      }
    ],
    testimonials: [
      {
        quote: "I built and launched my first course in 5 days. The AI helped me organize my messy knowledge into a structured program. Made $12K in the first month!",
        name: "Jessica Williams",
        role: "Marketing Coach & Consultant",
        avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      },
      {
        quote: "As a freelancer, I always struggled with productizing my services. This tool helped me create three different coaching packages, and I've tripled my income.",
        name: "Robert Chang",
        role: "Web Development Consultant",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      }
    ],
    faqs: [
      {
        question: "Do I need technical skills to create a course?",
        answer: "No! Our platform is designed for non-technical users. The AI handles the complex parts of course creation, and you focus on sharing your knowledge."
      },
      {
        question: "How does the pricing optimization work?",
        answer: "The AI analyzes similar offerings in your niche, considers your experience level, and tests different price points to find the optimal rate that maximizes both conversions and revenue."
      },
      {
        question: "Can I use my own payment processor?",
        answer: "Yes! While we offer integrated payment processing through Stripe, you can also connect PayPal, or use our checkout links with your preferred payment system."
      },
      {
        question: "What if I don't have a large audience yet?",
        answer: "The tool includes AI-powered marketing systems that help you build an audience through content creation, social media automation, and targeted advertising campaigns."
      }
    ],
    tags: ['Monetization', 'Course Creation', 'AI-Powered', 'Business Building', 'Coaching']
  },

  'ai-template-generator': {
    longDescription: 'Create custom templates for any purpose with AI assistance. From business documents to design templates, generate professional, on-brand templates in minutes. Perfect for agencies, businesses, and creators who need consistent, high-quality templates.',
    benefits: [
      'Generate templates 20x faster',
      'Maintain perfect brand consistency',
      'Create templates for any use case',
      'AI-powered design suggestions',
      'Export in multiple file formats',
      'Build reusable template libraries'
    ],
    features: [
      {
        title: 'AI Template Design',
        description: 'Describe what you need and AI generates professional template designs based on best practices and your brand guidelines.',
        icon: React.createElement(LayoutTemplate)
      },
      {
        title: 'Brand Style Sync',
        description: 'Automatically apply your brand colors, fonts, and design elements across all templates.',
        icon: React.createElement(Palette)
      },
      {
        title: 'Multi-Purpose Templates',
        description: 'Create templates for presentations, documents, social media, marketing materials, and more.',
        icon: React.createElement(Layers)
      },
      {
        title: 'Smart Content Blocks',
        description: 'Pre-designed content blocks that automatically adapt to your template structure.',
        icon: React.createElement(Package)
      },
      {
        title: 'Template Library',
        description: 'Save and organize your custom templates for easy reuse across projects.',
        icon: React.createElement(Database)
      },
      {
        title: 'Collaboration Tools',
        description: 'Share templates with your team and maintain version control automatically.',
        icon: React.createElement(Users)
      }
    ],
    steps: [
      {
        title: 'Describe Your Need',
        description: 'Tell the AI what type of template you need and its purpose'
      },
      {
        title: 'Set Brand Guidelines',
        description: 'Upload your brand assets or let AI extract them from existing materials'
      },
      {
        title: 'Generate & Customize',
        description: 'AI creates template options, you choose and customize the one you like'
      },
      {
        title: 'Export & Reuse',
        description: 'Download in your preferred format and save to your template library'
      }
    ],
    useCases: [
      {
        title: 'Marketing Agencies',
        description: 'Create client-specific templates at scale',
        points: [
          'Generate brand-compliant materials instantly',
          'Build template libraries for each client',
          'Maintain consistency across campaigns'
        ]
      },
      {
        title: 'Content Creators',
        description: 'Design templates for regular content production',
        points: [
          'Social media post templates',
          'YouTube thumbnail templates',
          'Newsletter and blog post layouts'
        ]
      },
      {
        title: 'Corporate Teams',
        description: 'Standardize business document creation',
        points: [
          'Proposal and presentation templates',
          'Report and documentation templates',
          'Internal communication templates'
        ]
      }
    ],
    testimonials: [
      {
        quote: "We create branded templates for 50+ clients. This tool cut our design time from hours to minutes while maintaining perfect brand consistency. Absolute game-changer.",
        name: "Emma Richardson",
        role: "Creative Director, Brand Studio",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      },
      {
        quote: "As a solo creator, I was spending too much time on design. Now I have a library of templates that I can customize in seconds. Tripled my content output.",
        name: "Alex Morrison",
        role: "Content Creator & Educator",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      }
    ],
    faqs: [
      {
        question: "What types of templates can I create?",
        answer: "You can create templates for presentations, documents, social media graphics, email newsletters, proposals, reports, marketing materials, and much more. If it's a repeatable design, you can template it."
      },
      {
        question: "Can I edit templates after they're generated?",
        answer: "Yes! All templates are fully editable. You can modify colors, layouts, text, images, and any other element. Changes can be saved as new versions or variations."
      },
      {
        question: "What file formats do you export?",
        answer: "We support exports to PDF, PNG, JPG, SVG, PPTX, DOCX, and HTML formats. You can also save templates in our proprietary format for future editing."
      },
      {
        question: "How does the AI understand my brand?",
        answer: "You can upload brand guidelines, provide examples of existing materials, or input brand elements manually. The AI learns from these inputs to generate on-brand templates automatically."
      }
    ],
    tags: ['Templates', 'Design', 'AI-Powered', 'Branding', 'Productivity']
  },

  'funnelcraft-ai': {
    longDescription: 'Build high-converting sales funnels with AI-powered optimization. From landing pages to checkout flows, create complete customer journeys that maximize conversions. Perfect for marketers, entrepreneurs, and businesses scaling their online sales.',
    benefits: [
      'Launch funnels 10x faster',
      'AI-optimized conversion rates',
      'Built-in A/B testing automation',
      'Smart traffic routing',
      'Integrated payment processing',
      'Real-time performance analytics'
    ],
    features: [
      {
        title: 'AI Funnel Architect',
        description: 'Input your offer and target audience, AI generates optimized funnel structures based on industry best practices.',
        icon: React.createElement(BarChart2)
      },
      {
        title: 'Smart Page Builder',
        description: 'Drag-and-drop builder with AI-recommended layouts and copy for maximum conversion.',
        icon: React.createElement(Layers)
      },
      {
        title: 'Automated A/B Testing',
        description: 'AI continuously tests variations and automatically allocates traffic to winning versions.',
        icon: React.createElement(TrendingUp)
      },
      {
        title: 'Conversion Optimization',
        description: 'Real-time AI suggestions to improve funnel performance based on user behavior.',
        icon: React.createElement(Target)
      },
      {
        title: 'Email Sequences',
        description: 'Automated email follow-ups with AI-generated content that nurtures leads.',
        icon: React.createElement(Megaphone)
      },
      {
        title: 'Analytics Dashboard',
        description: 'Track every metric that matters with AI-powered insights and recommendations.',
        icon: React.createElement(BarChart2)
      }
    ],
    steps: [
      {
        title: 'Define Your Offer',
        description: 'Input product details, pricing, and target audience information'
      },
      {
        title: 'Choose Funnel Type',
        description: 'Select from templates: lead magnet, webinar, product launch, or custom'
      },
      {
        title: 'AI Builds Pages',
        description: 'AI generates landing pages, thank you pages, and follow-up sequences'
      },
      {
        title: 'Launch & Optimize',
        description: 'Go live and let AI continuously improve conversion rates'
      }
    ],
    useCases: [
      {
        title: 'Digital Product Sellers',
        description: 'Sell courses, ebooks, and software with optimized funnels',
        points: [
          'Automated cart abandonment recovery',
          'Upsell and cross-sell sequences',
          'Time-limited offer automation'
        ]
      },
      {
        title: 'Service Providers',
        description: 'Generate qualified leads for high-ticket services',
        points: [
          'Application funnel with qualification questions',
          'Calendar integration for booking calls',
          'Automated follow-up sequences'
        ]
      },
      {
        title: 'E-Commerce Brands',
        description: 'Drive product sales with data-driven funnels',
        points: [
          'Product page optimization',
          'Bundle and subscription offers',
          'Post-purchase upsell flows'
        ]
      }
    ],
    testimonials: [
      {
        quote: "Our conversion rate jumped from 2.3% to 8.7% after rebuilding our funnel with FunnelCraft AI. The automated testing found winners we never would have discovered.",
        name: "Patrick Sullivan",
        role: "Founder, Digital Course Academy",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      },
      {
        quote: "Built and launched a complete sales funnel in 2 days. Made our first sale within hours of going live. The AI's copy suggestions were better than what our copywriter produced.",
        name: "Lisa Chen",
        role: "CEO, SaaS Startup",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      }
    ],
    faqs: [
      {
        question: "Do I need coding skills to build funnels?",
        answer: "No! The platform is completely no-code. The visual builder is intuitive, and AI handles the technical optimization automatically."
      },
      {
        question: "Can I use my own domain?",
        answer: "Yes! You can connect custom domains to your funnels. We provide SSL certificates and handle all technical setup."
      },
      {
        question: "How does the A/B testing work?",
        answer: "AI automatically creates variations of your pages and tests elements like headlines, images, CTAs, and layouts. It dynamically adjusts traffic to the best performers and implements winners automatically."
      },
      {
        question: "What payment processors do you support?",
        answer: "We integrate with Stripe, PayPal, and most major payment processors. You can also use our integrated checkout or connect your existing payment system."
      }
    ],
    tags: ['Sales Funnels', 'Conversion Optimization', 'AI-Powered', 'Marketing Automation']
  },

  'interactive-shopping': {
    longDescription: 'Transform static product catalogs into engaging, interactive shopping experiences. Create shoppable videos, interactive product showcases, and immersive brand experiences that drive higher engagement and conversion rates.',
    benefits: [
      'Increase conversion rates by up to 300%',
      'Create shoppable video content',
      'Interactive product demonstrations',
      'Personalized shopping experiences',
      'Seamless checkout integration',
      'Real-time engagement analytics'
    ],
    features: [
      {
        title: 'Shoppable Video Creator',
        description: 'Add clickable product tags to videos, allowing customers to purchase without leaving the content.',
        icon: React.createElement(Video)
      },
      {
        title: 'Interactive Product Tours',
        description: 'Create 360-degree product views and interactive demonstrations that showcase features.',
        icon: React.createElement(Zap)
      },
      {
        title: 'AI Product Recommendations',
        description: 'Smart recommendations based on browsing behavior and shopping patterns.',
        icon: React.createElement(Sparkles)
      },
      {
        title: 'Virtual Try-On',
        description: 'AR-powered try-on features for fashion, accessories, and home decor products.',
        icon: React.createElement(Camera)
      },
      {
        title: 'Live Shopping Events',
        description: 'Host interactive live shopping sessions with real-time product showcases.',
        icon: React.createElement(Users)
      },
      {
        title: 'Seamless Checkout',
        description: 'One-click checkout directly from interactive experiences.',
        icon: React.createElement(ShoppingBag)
      }
    ],
    steps: [
      {
        title: 'Upload Product Data',
        description: 'Connect your e-commerce platform or upload product catalog'
      },
      {
        title: 'Create Interactive Content',
        description: 'Build shoppable videos, product tours, or AR experiences'
      },
      {
        title: 'Add Shopping Features',
        description: 'Tag products, set up recommendations, and configure checkout'
      },
      {
        title: 'Launch & Analyze',
        description: 'Publish your interactive shopping experience and track performance'
      }
    ],
    useCases: [
      {
        title: 'Fashion & Apparel',
        description: 'Create immersive shopping experiences for clothing and accessories',
        points: [
          'Shoppable lookbook videos',
          'Virtual try-on for accessories',
          'Style guide interactive experiences'
        ]
      },
      {
        title: 'Beauty & Cosmetics',
        description: 'Showcase products with interactive tutorials',
        points: [
          'Shoppable makeup tutorials',
          'Before/after interactive comparisons',
          'Personalized product recommendations'
        ]
      },
      {
        title: 'Home & Lifestyle',
        description: 'Help customers visualize products in their space',
        points: [
          'Room design interactive tours',
          'AR furniture placement',
          'Shoppable home decor videos'
        ]
      }
    ],
    testimonials: [
      {
        quote: "Interactive video increased our conversion rate by 287%. Customers love being able to shop directly from our content without interrupting their experience.",
        name: "Sophia Martinez",
        role: "E-Commerce Director, Fashion Brand",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      },
      {
        quote: "The AR try-on feature reduced our return rate by 45%. Customers know exactly what they're getting before they buy. ROI was immediate.",
        name: "Daniel Kim",
        role: "Founder, Online Eyewear Boutique",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
      }
    ],
    faqs: [
      {
        question: "Which e-commerce platforms do you integrate with?",
        answer: "We integrate with Shopify, WooCommerce, BigCommerce, Magento, and most major e-commerce platforms. We also provide a REST API for custom integrations."
      },
      {
        question: "Do customers need to create an account?",
        answer: "No! We support guest checkout. However, you can offer account creation for returning customers to enhance their experience."
      },
      {
        question: "Can I track which products get the most engagement?",
        answer: "Yes! Our analytics dashboard shows detailed engagement metrics including views, clicks, interactions, and conversions for each product in your interactive content."
      },
      {
        question: "Does the AR try-on work on all devices?",
        answer: "AR features work on most modern smartphones and tablets with camera access. We automatically detect device capabilities and provide the best experience available."
      }
    ],
    tags: ['E-Commerce', 'Interactive Content', 'AR', 'Shopping Experience', 'Conversion Optimization']
  }
};

// Helper function to merge enhanced data with basic app data
export function getEnhancedAppData(appId: string, basicData: any) {
  const enhanced = enhancedAppDetails[appId];
  if (!enhanced) {
    return basicData;
  }

  return {
    ...basicData,
    ...enhanced
  };
}
