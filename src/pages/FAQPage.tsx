import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  Search,
  X,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  MessageSquare,
  HelpCircle,
  Mail,
  Video,
  Sparkles,
  Clock,
  Users,
  DollarSign,
  Laptop,
  Shield,
  Globe,
  Zap,
  LayoutTemplate,
  FileText,
  Database,
  Play,
  PanelTop,
} from "lucide-react";
import MagicSparkles from "../components/MagicSparkles";

// Define FAQ categories
const categories = [
  {
    id: "getting-started",
    name: "Getting Started",
    icon: <Play className="h-5 w-5" />,
  },
  {
    id: "accounts",
    name: "Accounts & Billing",
    icon: <DollarSign className="h-5 w-5" />,
  },
  {
    id: "features",
    name: "Features & Capabilities",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    id: "technical",
    name: "Technical Questions",
    icon: <Laptop className="h-5 w-5" />,
  },
  {
    id: "collaboration",
    name: "Collaboration",
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: "security",
    name: "Privacy & Security",
    icon: <Shield className="h-5 w-5" />,
  },
  { id: "ai", name: "AI Features", icon: <Zap className="h-5 w-5" /> },
  {
    id: "publishing",
    name: "Exporting & Publishing",
    icon: <PanelTop className="h-5 w-5" />,
  },
  {
    id: "templates",
    name: "Templates & Content",
    icon: <LayoutTemplate className="h-5 w-5" />,
  },
  {
    id: "troubleshooting",
    name: "Troubleshooting",
    icon: <HelpCircle className="h-5 w-5" />,
  },
];

// Comprehensive FAQ data with categories
const faqData = [
  // Getting Started
  {
    question: "What is VideoRemix.vip?",
    answer:
      "VideoRemix.vip is an AI-powered marketing personalization platform designed to help marketers and businesses create personalized marketing content that drives results. Our platform combines artificial intelligence with intuitive design to eliminate the technical barriers of traditional marketing content creation, enabling you to create personalized content, images, and campaigns in minutes instead of hours.",
    category: "getting-started",
  },
  {
    question: "How does VideoRemix.vip work?",
    answer:
      "VideoRemix.vip provides 37+ AI-powered marketing tools that help you create personalized content for different audience segments. Choose from tools like AI Video Creator, Landing Page Creator, Smart CRM Closer, and more. Our platform analyzes your target audience, automatically personalizes marketing messages based on buyer journey stages, and delivers content that resonates with each segment. You can create personalized marketing campaigns in minutes instead of days.",
    category: "getting-started",
  },
  {
    question: "Do I need any technical skills to use VideoRemix.vip?",
    answer:
      "Not at all! VideoRemix.vip is designed for solopreneurs, marketers, and business owners with no technical background. Our intuitive interface and AI-powered personalization features make it easy for anyone to create professional marketing content, segment audiences, and launch personalized campaigns without technical skills or marketing expertise.",
    category: "getting-started",
  },
  {
    question: "How long does it take to learn VideoRemix.vip?",
    answer:
      "Most users can launch their first personalized marketing campaign within 15 minutes of signing up. Our platform is designed to be intuitive with a minimal learning curve. Access to 37+ specialized marketing tools means you can start with simple tools and expand to more advanced personalization features as your business grows. We also provide interactive tutorials, tooltips, and a comprehensive help center to guide you through the process.",
    category: "getting-started",
  },
  {
    question:
      "What types of marketing content can I create with VideoRemix.vip?",
    answer:
      "You can create personalized videos, landing pages, promotional content, email campaigns, social media posts, lead generation funnels, CRM sequences, branding materials, interactive shopping experiences, and much more. With 37+ tools across Video, AI Image, Lead Generation, Branding, and Creative categories, you can create virtually any type of personalized marketing content. Our platform covers dozens of use cases for solopreneurs, agencies, and businesses scaling their marketing operations.",
    category: "getting-started",
  },
  {
    question: "Is there a free trial or free plan available?",
    answer:
      "Yes! We offer a Free plan that gives you access to basic personalization features with 5 video exports per month, 2 audience segments, and limited access to our tools. For full access to all 37+ marketing tools, unlimited audience segmentation, and advanced personalization features, we offer paid plans starting at $29/month. You can upgrade or downgrade at any time based on your business needs.",
    category: "getting-started",
  },

  // Accounts & Billing
  {
    question: "How much does VideoRemix.vip cost?",
    answer:
      "VideoRemix.vip offers several pricing tiers to fit different needs. We have a Free plan with basic features, a Pro plan starting at $29/month, and a Business plan at $79/month. We also offer custom Enterprise solutions. Annual subscriptions receive a 20% discount. Check our pricing page for the most current pricing and feature details.",
    category: "accounts",
  },
  {
    question: "Can I change my subscription plan later?",
    answer:
      "Yes, you can upgrade, downgrade, or cancel your subscription at any time from your account dashboard. Upgrades take effect immediately, while downgrades and cancellations take effect at the end of your current billing cycle.",
    category: "accounts",
  },
  {
    question: "Do you offer any discounts?",
    answer:
      "Yes, we offer a 20% discount on all annual subscriptions. We also have special pricing for educational institutions, non-profit organizations, and qualified students. Contact our sales team for more information about these specialized discounts.",
    category: "accounts",
  },
  {
    question:
      "What happens to my content and campaigns if I cancel my subscription?",
    answer:
      "If you cancel your subscription, you'll have 30 days to download your projects, marketing content, and campaign data. After that period, they will be removed from our servers. We recommend exporting your important content, audience segments, and campaign analytics before canceling. If you downgrade to our Free plan, you'll maintain access to a limited number of your most recent projects and basic tool access.",
    category: "accounts",
  },
  {
    question: "How does the 14-day money-back guarantee work?",
    answer:
      "If you're not completely satisfied with VideoRemix.vip within 14 days of your initial purchase, contact our support team for a full refund. No questions asked. This guarantee applies to first-time purchases only and does not apply to renewals or subscription changes.",
    category: "accounts",
  },
  {
    question: "Do you offer team or enterprise pricing?",
    answer:
      "Yes! Our Business plan supports teams of up to 10 members with collaboration features. For larger teams or enterprise needs, please contact our sales team for custom pricing and features tailored to your organization's specific requirements.",
    category: "accounts",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, American Express, Discover), PayPal, and Apple Pay. For Enterprise plans, we can also arrange invoicing and purchase orders. All payments are processed securely through our payment partners.",
    category: "accounts",
  },

  // Features & Capabilities
  {
    question: "What content formats and tools does VideoRemix.vip support?",
    answer:
      "VideoRemix.vip supports all major video formats (MP4, MOV, AVI, WMV, MKV, WebM), images (JPG, PNG, SVG), audio files (MP3, WAV, AAC), and various marketing content types. Beyond video, you can create landing pages, email campaigns, social media content, branded materials, and interactive experiences. With 37+ specialized tools, you can work with virtually any marketing content format needed for your campaigns.",
    category: "features",
  },
  {
    question: "Are there limits on content creation and personalization?",
    answer:
      "Free accounts can create up to 5 personalized video exports per month, segment audiences into 2 groups, and have 3 active projects. Pro accounts ($29/month) get unlimited video exports, unlimited audience segments, 50 active projects, and full access to all personalization tools. Business accounts ($79/month) have no restrictions and include advanced features like white-label exports, API access, and 10 team members. For video length specifically, Free plans support up to 10-minute uploads and 5-minute exports, Pro plans support up to 1-hour uploads and 30-minute exports, and Business accounts have no length restrictions.",
    category: "features",
  },
  {
    question: "Can I use my own branding and assets?",
    answer:
      "Absolutely! Pro and Business users can upload their logo, fonts, and color schemes to create a comprehensive brand kit that can be applied to any content across all 37+ tools. This ensures all your marketing materials—videos, landing pages, emails, social posts, and more—maintain consistent branding across campaigns and channels. You can also create multiple brand kits for different clients if you're running an agency.",
    category: "features",
  },
  {
    question: "What resolution and quality can I export videos in?",
    answer:
      "Free plans can export in 720p HD. Pro plans support up to 4K resolution (2160p). All plans offer various quality settings to optimize for file size versus visual quality. We also automatically optimize format and compression settings for different platforms like YouTube, Instagram, etc.",
    category: "features",
  },
  {
    question:
      "Can I customize the personalization for different audience segments?",
    answer:
      "Yes! VideoRemix.vip's core strength is personalization. You can create unlimited audience segments based on demographics, buyer journey stages, interests, or any criteria you define. The platform then automatically personalizes messaging, visuals, calls-to-action, and content for each segment. Pro and Business users can save personalization templates and apply them across multiple campaigns, ensuring consistent but tailored messaging for each audience group.",
    category: "features",
  },
  {
    question: "Is there a limit to how many marketing campaigns I can run?",
    answer:
      "Free accounts can have up to 3 active projects simultaneously and 2 audience segments. Pro accounts get 50 active projects with unlimited audience segments, perfect for solopreneurs and small agencies. Business accounts have unlimited projects, unlimited segments, and can manage multiple client accounts. Completed campaigns can be archived to free up your active project slots while maintaining access to analytics and performance data.",
    category: "features",
  },
  {
    question:
      "What tools are available for creating personalized marketing content?",
    answer:
      "VideoRemix.vip provides 37+ specialized marketing tools organized into categories: Video Apps (AI Video Creator, Promo Generator, Video Editor, Text-to-Speech), AI Image Apps (Art Generator, Background Remover), Lead Generation (Landing Page Creator, Smart CRM Closer, FunnelCraft AI), Branding (RE-BRANDER AI, Business Branding tools), Personalizer (Voice Coach, Resume Amplifier, Profile Generator), and Creative (Storyboard AI, Smart Presentations, Interactive Shopping). Each tool includes AI-powered personalization features and royalty-free assets including music, images, and video footage.",
    category: "features",
  },

  // Technical Questions
  {
    question: "What browsers does VideoRemix.vip support?",
    answer:
      "VideoRemix.vip works on all modern browsers including Chrome, Firefox, Safari, and Edge. For optimal performance, we recommend using the latest version of Chrome or Firefox. Our platform is primarily cloud-based, so you don't need a powerful computer to create professional videos.",
    category: "technical",
  },
  {
    question: "Do you have mobile apps available?",
    answer:
      "Yes, we offer mobile apps for iOS and Android that allow you to view, share, and make basic edits to your projects on the go. Full editing capabilities are available through our web application, which is also mobile-responsive for tablet users.",
    category: "technical",
  },
  {
    question: "What are the minimum system requirements?",
    answer:
      "Since VideoRemix.vip is cloud-based, the system requirements are minimal. You need a computer with a modern web browser and a stable internet connection (at least 5 Mbps download speed). For video uploading, a faster connection is recommended. 4GB of RAM and any modern processor should be sufficient.",
    category: "technical",
  },
  {
    question:
      "Is VideoRemix.vip compatible with my existing video editing software?",
    answer:
      "VideoRemix.vip can import project files from some popular video editing platforms. We currently support importing from Adobe Premiere (XML), Final Cut Pro (XML), and DaVinci Resolve (EDL). We can also import media assets from these platforms, even if the project structure itself isn't imported.",
    category: "technical",
  },
  {
    question: "Do I need an internet connection to use VideoRemix.vip?",
    answer:
      "Yes, VideoRemix.vip is a cloud-based platform that requires an internet connection to access and use. This allows us to leverage powerful cloud computing resources for AI processing and rendering, without taxing your local machine. Pro and Business plans include a limited offline mode that allows you to make basic edits without connectivity and sync changes when you're back online.",
    category: "technical",
  },
  {
    question: "How do you handle large file uploads?",
    answer:
      "Our platform is optimized for handling large video files. We use a chunked upload system that can resume if your connection is interrupted. For very large files (over 2GB), we recommend using our desktop uploader tool which provides enhanced stability and progress tracking for large uploads.",
    category: "technical",
  },

  // Collaboration
  {
    question: "Can multiple people work on the same video project?",
    answer:
      "Yes, our Pro and Business plans include collaboration features. Multiple team members can work on the same project simultaneously, leave comments, and track changes. Business plans offer additional team management features like role-based permissions and approval workflows.",
    category: "collaboration",
  },
  {
    question: "How do I share my projects with team members?",
    answer:
      "In your project dashboard, simply click the 'Share' button and enter the email addresses of team members you want to collaborate with. You can set permission levels (viewer, editor, admin) for each collaborator. They'll receive an email invitation to join the project.",
    category: "collaboration",
  },
  {
    question: "Can I control what team members can do in my projects?",
    answer:
      "Absolutely. Business plans offer granular permission controls. You can set team members as Viewers (can only view and comment), Editors (can make changes but not delete or export), or Admins (full control including export and deletion). You can also lock specific elements of a video to prevent changes.",
    category: "collaboration",
  },
  {
    question: "Is there a version history for collaborative projects?",
    answer:
      "Yes, all projects maintain a complete version history. You can view previous versions, see who made which changes, and restore any past version if needed. This ensures you never lose work and can always track the evolution of your projects, even with multiple collaborators.",
    category: "collaboration",
  },
  {
    question: "How does the approval workflow feature work?",
    answer:
      "Business plans include customizable approval workflows. You can designate specific team members as approvers and set up sequential approval chains (e.g., first design team approval, then marketing, then client). Each approver receives notifications when it's their turn to review, and the project maintains a complete approval audit trail.",
    category: "collaboration",
  },

  // Privacy & Security
  {
    question: "How secure is my content on VideoRemix.vip?",
    answer:
      "We take security extremely seriously. All content is encrypted both in transit and at rest using bank-grade encryption. Our infrastructure is hosted on secure cloud providers with SOC 2 Type II compliance. We implement strict access controls, regular security audits, and follow security best practices across our entire platform.",
    category: "security",
  },
  {
    question: "Who owns the videos I create with VideoRemix.vip?",
    answer:
      "You retain full ownership of all content you create with VideoRemix.vip. We do not claim any rights to your videos or the assets you upload. You're free to use your videos for any purpose aligned with our terms of service.",
    category: "security",
  },
  {
    question: "Do you share my data with third parties?",
    answer:
      "We never sell your personal data or content to third parties. We do work with select service providers (like cloud storage and payment processors) who need limited access to provide the services you use. All such providers are bound by strict confidentiality agreements and data protection requirements. See our privacy policy for complete details.",
    category: "security",
  },
  {
    question: "Can I use VideoRemix.vip in compliance with GDPR/CCPA/HIPAA?",
    answer:
      "Yes. VideoRemix.vip is compliant with GDPR and CCPA requirements. For HIPAA compliance, our Business Associate Agreement (BAA) is available for Enterprise customers. We provide the tools and documentation needed to use our platform in a compliant manner, though ultimate compliance responsibility remains with your organization.",
    category: "security",
  },
  {
    question: "How long do you retain my data and content?",
    answer:
      "Active account content is stored indefinitely while your account remains active. If you delete specific content, it's removed from our active systems immediately and from backups within 30 days. If you cancel your account, you have a 30-day window to download your content before it's permanently deleted.",
    category: "security",
  },
  {
    question: "Can I request my data to be deleted?",
    answer:
      "Yes, you can request deletion of your account and associated data at any time through your account settings or by contacting our support team. Upon request, we will delete your personal information and content in accordance with applicable laws and our data retention policy.",
    category: "security",
  },

  // AI Features
  {
    question: "How does AI-powered marketing personalization work?",
    answer:
      "Our AI analyzes your target audience data, buyer journey stages, and campaign goals to automatically personalize marketing content for each segment. It understands context, sentiment, demographics, and behavior patterns to create customized messaging, visuals, and calls-to-action that resonate with each audience group. The AI considers factors like purchase intent, engagement history, and preferences to optimize conversion rates. You maintain full control and can fine-tune the AI's personalization recommendations with our intuitive tools.",
    category: "ai",
  },
  {
    question: "How accurate are the automatic captions?",
    answer:
      "Our AI-generated captions typically achieve 95-98% accuracy for clear audio in English. We also support automatic captioning in 20+ other languages with varying degrees of accuracy. All auto-generated captions are easily editable in our caption editor if you need to make corrections.",
    category: "ai",
  },
  {
    question: "Does the AI choose music for my videos?",
    answer:
      "Yes, our AI can analyze your video content and suggest appropriate music tracks from our library based on the mood, pacing, and subject matter. It can even automatically time music transitions to match your video's natural breaking points.",
    category: "ai",
  },
  {
    question: "How does the AI know where to make cuts in my footage?",
    answer:
      "Our AI analyzes your video using computer vision and audio processing to identify natural breaking points, changes in scenes, pauses in speech, and visual composition. It applies professional editing principles to determine the optimal cut points for engaging, well-paced videos.",
    category: "ai",
  },
  {
    question: "Can the AI generate voiceovers?",
    answer:
      "Yes, our text-to-speech technology can generate natural-sounding voiceovers in 30+ languages and accents. Simply type your script, select a voice, and our AI will create a professional voiceover. Pro and Business users can adjust pacing, emphasis, and pronunciation for perfect results.",
    category: "ai",
  },
  {
    question: "How does the content repurposing AI work?",
    answer:
      "Our content repurposing AI analyzes your marketing content to identify the most engaging segments and automatically creates personalized variations for different audience segments and platforms. It adapts messaging for different buyer journey stages, creates platform-specific formats (TikTok, Instagram Reels, YouTube Shorts, LinkedIn), and personalizes calls-to-action based on segment characteristics. One piece of content can be transformed into dozens of personalized variations targeting specific demographics, interests, or behavioral patterns.",
    category: "ai",
  },
  {
    question: "Will the AI replace my marketing team?",
    answer:
      "VideoRemix.vip is designed to augment your marketing efforts and scale your operations, not replace your team. Many solopreneurs use our platform to execute campaigns that would typically require a full marketing department. Agencies use our tools to handle routine personalization tasks, allowing their strategists to focus on higher-value creative direction and client relationships. The AI handles technical personalization, audience segmentation, and content adaptation while you provide strategic direction and maintain creative control.",
    category: "ai",
  },

  // Exporting & Publishing
  {
    question: "How do I export my videos?",
    answer:
      "Exporting videos is simple. Once you've finished editing, click the 'Export' button in the top right corner. You can choose from various quality settings (SD to 4K), file formats, and even directly publish to social media platforms.",
    category: "publishing",
  },
  {
    question: "What export formats are available?",
    answer:
      "VideoRemix.vip supports exporting to all major video formats including MP4, MOV, and WebM. You can select various quality presets optimized for different uses (web, social media, professional) or customize settings like bitrate, frame rate, and compression.",
    category: "publishing",
  },
  {
    question: "Can I export videos for specific social platforms?",
    answer:
      "Yes! We offer one-click optimization for all major social platforms including YouTube, Instagram, TikTok, Facebook, Twitter, and LinkedIn. This automatically adjusts aspect ratio, format, compression, and other settings to match each platform's requirements and best practices.",
    category: "publishing",
  },
  {
    question: "Can I publish directly to social media?",
    answer:
      "Yes, Pro and Business plans allow direct publishing to YouTube, Facebook, Instagram, Twitter, TikTok, and LinkedIn. After connecting your social accounts in the dashboard, you can publish videos directly without downloading and re-uploading them.",
    category: "publishing",
  },
  {
    question: "How long does exporting take?",
    answer:
      "Export times depend on video length, resolution, and current system load. Most videos are ready in seconds to a few minutes. Our cloud-based rendering means you don't have to keep your browser open during processing—you'll receive an email notification when your export is complete.",
    category: "publishing",
  },
  {
    question: "Are there any limitations on exports?",
    answer:
      "Free accounts can export up to 5 videos per month at 720p resolution with a watermark. Pro accounts have unlimited exports up to 4K resolution without watermarks. Business accounts additionally get priority rendering for faster exports during peak times.",
    category: "publishing",
  },
  {
    question: "Can I schedule posts to social media?",
    answer:
      "Yes, Business plans include social media scheduling features. You can create a publishing calendar, schedule posts for optimal times, and manage your content distribution across multiple platforms from a single dashboard.",
    category: "publishing",
  },

  // Templates & Content
  {
    question: "How many templates are available?",
    answer:
      "VideoRemix.vip offers 500+ professionally designed templates across dozens of categories including social media, marketing, education, real estate, e-commerce, and more. We add new templates weekly based on current trends and user requests.",
    category: "templates",
  },
  {
    question: "Can I create my own templates?",
    answer:
      "Yes, Pro and Business users can save any project as a custom template for future use. This is especially useful for creating consistent branded videos or establishing a template library for your team or organization.",
    category: "templates",
  },
  {
    question:
      "Can I use stock footage and music from VideoRemix.vip in my videos?",
    answer:
      "Yes, VideoRemix.vip includes access to a vast library of royalty-free stock footage, images, and music that you can use in your videos. All stock content is licensed for commercial use, so you can safely use it in both personal and business projects without attribution.",
    category: "templates",
  },
  {
    question: "Are there industry-specific templates available?",
    answer:
      "Absolutely! We offer specialized templates for real estate, e-commerce, education, fitness, restaurants, technology, non-profits, finance, healthcare, and many other industries. Each template is designed with industry-specific best practices in mind.",
    category: "templates",
  },
  {
    question: "Can templates be customized to match my brand?",
    answer:
      "Yes, all templates are fully customizable. You can change colors, fonts, layouts, transitions, timing, and replace any media elements with your own. Pro and Business users can also save brand kits to quickly apply consistent branding to any template.",
    category: "templates",
  },
  {
    question: "How often are new templates added?",
    answer:
      "We add 15-20 new templates each month, focusing on current design trends, seasonal themes, and specific user requests. Pro and Business users get early access to all new templates.",
    category: "templates",
  },

  // Troubleshooting
  {
    question: "My video is processing for a long time. What should I do?",
    answer:
      "Most videos process within minutes, but larger files or complex projects can take longer. If processing exceeds 30 minutes, try refreshing the page or contact support. For faster processing, consider breaking very long videos into smaller segments or reducing resolution during initial edits.",
    category: "troubleshooting",
  },
  {
    question: "Why does my exported video look pixelated?",
    answer:
      "Pixelation usually results from exporting at a lower resolution than optimal or from heavily compressed source footage. Try exporting at a higher quality setting, or if using the free plan, upgrade to access higher resolution exports. If your source footage is low quality, our AI enhancement feature (Pro plan) can help improve visual clarity.",
    category: "troubleshooting",
  },
  {
    question:
      "The video playback is stuttering in the editor. How can I fix this?",
    answer:
      "Editor playback performance depends on your internet connection and computer specs. Try enabling the 'Performance Mode' in settings, which uses lower resolution previews while editing. Clearing your browser cache, closing other tabs, and using Chrome or Firefox can also improve performance.",
    category: "troubleshooting",
  },
  {
    question: "Why are my uploads failing?",
    answer:
      "Upload issues are usually related to file size, format, or internet connectivity. Make sure your file is in a supported format, check your internet connection stability, and try breaking very large files into smaller segments. If problems persist, try our desktop uploader tool which has better handling for large files and unstable connections.",
    category: "troubleshooting",
  },
  {
    question: "I forgot my password. How do I reset it?",
    answer:
      "Click the 'Forgot Password' link on the login page, enter your email address, and follow the instructions sent to your email. Be sure to check your spam folder if you don't see the reset email. Password reset links expire after 24 hours for security reasons.",
    category: "troubleshooting",
  },
  {
    question: "My problem isn't listed here. How do I get help?",
    answer:
      "Our support team is ready to help! For technical issues, please visit our Help Center for detailed guides or contact support directly through the chat icon in the bottom right corner of the app. You can also email support@videoremix.vip with details about your issue. Pro and Business users receive priority support with faster response times.",
    category: "troubleshooting",
  },

  // Marketing & Personalization (NEW)
  {
    question: "What makes VideoRemix.vip different from other marketing tools?",
    answer:
      "VideoRemix.vip is a comprehensive marketing personalization platform with 37+ AI-powered tools, not just a single-purpose marketing tool. While most platforms focus on one aspect (like email or video), we provide integrated tools for videos, landing pages, CRM, branding, and more—all with built-in audience segmentation and personalization. Our AI automatically adapts your marketing content for different audience segments and buyer journey stages, helping you achieve 3x higher engagement and conversion rates compared to generic marketing approaches.",
    category: "getting-started",
  },
  {
    question: "How does audience segmentation work?",
    answer:
      "Our platform allows you to create unlimited audience segments based on demographics, behavior, interests, buyer journey stage, or any custom criteria you define. The AI then analyzes each segment's characteristics and automatically personalizes content, messaging, and calls-to-action for optimal engagement. You can manually create segments or let our AI suggest segmentation based on your campaign data. Free plans support 2 segments, Pro plans offer unlimited segments, and Business plans include AI-powered automatic segmentation.",
    category: "features",
  },
  {
    question:
      "Can I use VideoRemix.vip for my agency or to serve multiple clients?",
    answer:
      "Absolutely! VideoRemix.vip is perfect for agencies and freelancers. Business plans support up to 10 team members and allow you to manage multiple client accounts with separate branding, campaigns, and analytics. You can create custom brand kits for each client, white-label your exports, and use our tools to deliver personalized marketing at scale. Many agencies use our platform to offer services like personalized video marketing, landing page creation, CRM automation, and comprehensive branding that would typically require multiple specialized tools.",
    category: "getting-started",
  },
  {
    question: "What are the 37+ tools available in VideoRemix.vip?",
    answer:
      "Our platform includes: Video Apps (AI Video Creator, Promo Generator, Video Editor, Text-to-Speech, Niche Script Creator), AI Image Apps (Art Generator, Background Remover, Image Transformer), Lead Generation (Landing Page Creator, AI Referral Maximizer, Smart CRM Closer, FunnelCraft AI, Sales Assistant), Branding (RE-BRANDER AI, Business Brander, Branding Analyzer, Branding Accelerator), Personalizer (Voice Coach, Resume Amplifier, Screen Recorder, Profile Generator, Thumbnail Generator, Skills Monetizer), and Creative (Storyboard AI, Smart Presentations, Interactive Shopping, Social Media Pack, Template Generator). Each tool integrates with our personalization engine to help you create targeted content for different audience segments.",
    category: "features",
  },
  {
    question: "How can VideoRemix.vip help me scale my solopreneur business?",
    answer:
      "VideoRemix.vip empowers solopreneurs to execute marketing campaigns that typically require an entire team. With our 37+ tools, you can create personalized videos, build landing pages, automate CRM sequences, design branded materials, and launch multi-channel campaigns—all from one platform. Our AI handles the technical complexity of personalization, allowing you to compete with larger competitors by delivering targeted, professional marketing content. Many solopreneurs use our platform to transition from freelancing to running scalable agencies, or to land high-earning positions with tech companies by demonstrating advanced marketing capabilities.",
    category: "getting-started",
  },
  {
    question:
      "Can I track the performance of my personalized marketing campaigns?",
    answer:
      "Yes! Pro and Business plans include comprehensive analytics that track engagement, conversion rates, and ROI for each audience segment. You can see which personalized variations perform best, which segments convert highest, and how your campaigns perform across different channels. Business plans offer advanced analytics with custom reporting, A/B testing results, and attribution tracking to help you continuously optimize your personalization strategy.",
    category: "features",
  },
  {
    question: "Does VideoRemix.vip integrate with other marketing tools?",
    answer:
      "Yes! Business plans include API access that allows integration with popular CRM systems, email marketing platforms, analytics tools, and social media schedulers. Our platform can also export data in standard formats compatible with most marketing tools. We're continuously expanding our integration ecosystem based on user needs. Common integrations include connecting our Lead Generation tools with your CRM, syncing audience segments with email platforms, and automating campaign workflows across multiple channels.",
    category: "technical",
  },
  {
    question:
      "What's the difference between generic marketing and personalized marketing?",
    answer:
      "Generic marketing sends the same message to everyone, resulting in low engagement (73% of prospects skip generic content within seconds) and poor conversion rates (typically 3-6%). Personalized marketing tailors content, messaging, and offers to specific audience segments based on their characteristics, needs, and position in the buyer journey. This approach achieves 3x higher engagement, 5x longer watch times, and conversion rates up to 19%—more than 3x better than generic approaches. VideoRemix.vip makes personalized marketing accessible to businesses of all sizes through AI-powered automation.",
    category: "getting-started",
  },
  {
    question: "Can I create landing pages and funnels, not just videos?",
    answer:
      "Yes! VideoRemix.vip offers comprehensive marketing tools beyond video creation. Our Landing Page Creator builds full-featured landing pages in 60 seconds, FunnelCraft AI creates complete sales funnels, Smart CRM Closer automates customer relationship sequences, and Interactive Shopping creates engaging e-commerce experiences. All tools include personalization features that adapt content for different audience segments. You can create entire marketing campaigns—from landing pages to email sequences to videos—all within one platform.",
    category: "features",
  },
  {
    question:
      "How do I get started with personalized marketing if I'm new to it?",
    answer:
      "Start with our Free plan to explore the platform. Begin by creating 2-3 basic audience segments (for example: new prospects, engaged leads, and ready-to-buy customers). Choose one of our easier tools like the Landing Page Creator or AI Video Creator to create your first personalized content variations. Our AI will guide you through the personalization process, suggesting what to customize for each segment. Most users see measurable improvements in engagement within their first week. As you get comfortable, expand to more tools and segments. Our Help Center includes step-by-step tutorials specifically for beginners to personalized marketing.",
    category: "getting-started",
  },
];

// Frequently searched questions
const popularSearches = [
  "Marketing personalization features",
  "37 tools available",
  "Audience segmentation",
  "Agency and client management",
  "Solopreneur scaling",
  "Pricing and plans",
];

const FAQPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("getting-started");
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);
  const [filteredFaqs, setFilteredFaqs] = useState(
    faqData.filter((faq) => faq.category === "getting-started"),
  );
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Effect for handling search and category filtering
  useEffect(() => {
    if (searchQuery.trim() === "") {
      // If no search query, filter by active category
      setFilteredFaqs(
        activeCategory === "all"
          ? faqData
          : faqData.filter((faq) => faq.category === activeCategory),
      );
    } else {
      // If there's a search query, filter by both search and category
      const lowercaseQuery = searchQuery.toLowerCase();
      setFilteredFaqs(
        faqData.filter((faq) => {
          const matchesSearch =
            faq.question.toLowerCase().includes(lowercaseQuery) ||
            faq.answer.toLowerCase().includes(lowercaseQuery);
          const matchesCategory =
            activeCategory === "all" || faq.category === activeCategory;

          return matchesSearch && matchesCategory;
        }),
      );
    }
  }, [searchQuery, activeCategory]);

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    setOpenQuestion(null);
  };

  // Handle question toggle
  const toggleQuestion = (index: number) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setOpenQuestion(null);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Handle search popular question
  const handlePopularSearch = (query: string) => {
    setSearchQuery(query);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <>
      <Helmet>
        <title>Frequently Asked Questions | VideoRemix.vip</title>
        <meta
          name="description"
          content="Find answers to your questions about VideoRemix.vip's AI-powered marketing personalization platform. Learn about our 37+ tools, audience segmentation, pricing, and how to scale your business with personalized marketing."
        />
      </Helmet>

      <main className="pt-32 pb-20">
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/10 rounded-full blur-[100px] -z-10"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-600/10 rounded-full blur-[100px] -z-10"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <MagicSparkles minSparkles={5} maxSparkles={8}>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                    Frequently Asked Questions
                  </h1>
                </MagicSparkles>

                <p className="text-xl text-gray-300 mb-8">
                  Find answers to common questions about our marketing
                  personalization platform, tools, pricing, and how to scale
                  your business.
                </p>
              </motion.div>

              {/* Search input */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="max-w-2xl mx-auto relative mb-12"
              >
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    ref={searchInputRef}
                    className="bg-gray-800/80 backdrop-blur-sm w-full pl-12 pr-14 py-4 rounded-xl border border-gray-700 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Search for answers..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                  {searchQuery && (
                    <button
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white"
                      onClick={clearSearch}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </motion.div>

              {/* Popular searches */}
              {!searchQuery && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="mb-8"
                >
                  <p className="text-gray-400 mb-3">Popular searches:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {popularSearches.map((query, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePopularSearch(query)}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-full text-sm transition-colors border border-gray-700"
                      >
                        {query}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Category sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-gray-800/70 backdrop-blur-md rounded-xl p-6 border border-gray-700 sticky top-28">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                    <HelpCircle className="mr-2 h-5 w-5" />
                    FAQ Categories
                  </h2>

                  <nav className="space-y-1">
                    <button
                      onClick={() => handleCategoryChange("all")}
                      className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors ${
                        activeCategory === "all"
                          ? "bg-primary-600 text-white"
                          : "text-gray-300 hover:bg-gray-700/50"
                      }`}
                    >
                      <Sparkles className="h-5 w-5 mr-3 flex-shrink-0" />
                      <span>All Questions</span>
                      {activeCategory === "all" && (
                        <ChevronRight className="h-5 w-5 ml-auto" />
                      )}
                    </button>

                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryChange(category.id)}
                        className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors ${
                          activeCategory === category.id
                            ? "bg-primary-600 text-white"
                            : "text-gray-300 hover:bg-gray-700/50"
                        }`}
                      >
                        {React.cloneElement(category.icon, {
                          className: "h-5 w-5 mr-3 flex-shrink-0",
                        })}
                        <span>{category.name}</span>
                        {activeCategory === category.id && (
                          <ChevronRight className="h-5 w-5 ml-auto" />
                        )}
                      </button>
                    ))}
                  </nav>

                  {/* Contact support */}
                  <div className="mt-8 p-4 border border-gray-700 rounded-lg bg-gray-800/50">
                    <h3 className="font-semibold text-white mb-2">
                      Can't find your answer?
                    </h3>
                    <p className="text-gray-300 text-sm mb-4">
                      Our support team is here to help with any questions you
                      might have.
                    </p>
                    <a
                      href="/contact"
                      className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg text-sm"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Contact Support
                    </a>
                  </div>
                </div>
              </div>

              {/* FAQ listings */}
              <div className="lg:col-span-2">
                {searchQuery && (
                  <div className="mb-6 text-white">
                    <p className="text-lg">
                      <span className="text-gray-400">
                        Search results for:{" "}
                      </span>
                      <span className="font-medium">"{searchQuery}"</span>
                    </p>
                    <p className="text-sm text-gray-400">
                      {filteredFaqs.length}{" "}
                      {filteredFaqs.length === 1 ? "result" : "results"} found
                    </p>
                  </div>
                )}

                {!searchQuery && activeCategory !== "all" && (
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {categories.find((c) => c.id === activeCategory)?.name}
                    </h2>
                    <p className="text-gray-300">
                      {activeCategory === "getting-started" &&
                        "Everything you need to know to get started with personalized marketing on VideoRemix.vip."}
                      {activeCategory === "accounts" &&
                        "Information about accounts, subscriptions, billing, and payments."}
                      {activeCategory === "features" &&
                        "Learn about our 37+ marketing tools, audience segmentation, and personalization capabilities."}
                      {activeCategory === "technical" &&
                        "Technical specifications, integrations, and platform requirements."}
                      {activeCategory === "collaboration" &&
                        "How to work with team members, manage clients, and scale your agency."}
                      {activeCategory === "security" &&
                        "Details about our privacy practices and security measures."}
                      {activeCategory === "ai" &&
                        "Learn how our AI-powered personalization features work to boost your marketing results."}
                      {activeCategory === "publishing" &&
                        "Information about exporting, scheduling, and distributing your marketing content."}
                      {activeCategory === "templates" &&
                        "All about our templates, tools, and content library."}
                      {activeCategory === "troubleshooting" &&
                        "Solutions to common issues and technical problems."}
                    </p>
                  </div>
                )}

                {filteredFaqs.length > 0 ? (
                  <div className="space-y-4">
                    <AnimatePresence initial={false}>
                      {filteredFaqs.map((faq, index) => (
                        <motion.div
                          key={`${faq.question}-${index}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{
                            opacity: 0,
                            height: 0,
                            marginTop: 0,
                            marginBottom: 0,
                          }}
                          transition={{ duration: 0.3, delay: index * 0.03 }}
                          className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-sm"
                        >
                          <button
                            className="flex justify-between items-center w-full p-5 text-left"
                            onClick={() => toggleQuestion(index)}
                            aria-expanded={openQuestion === index}
                          >
                            <h3 className="text-lg font-medium text-white pr-10 break-words">
                              {faq.question}
                            </h3>
                            <div
                              className={`flex-shrink-0 ml-4 p-1 rounded-full transition-colors duration-200 ${
                                openQuestion === index
                                  ? "bg-primary-500/20 text-primary-400"
                                  : "bg-gray-700 text-gray-400"
                              }`}
                            >
                              <ChevronDown
                                className={`h-5 w-5 transition-transform duration-200 ${
                                  openQuestion === index
                                    ? "transform rotate-180"
                                    : ""
                                }`}
                              />
                            </div>
                          </button>

                          <AnimatePresence>
                            {openQuestion === index && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <div className="px-5 pb-5 border-t border-gray-700 pt-4">
                                  <p className="text-gray-300 whitespace-pre-line break-words">
                                    {faq.answer}
                                  </p>

                                  {/* Category badge */}
                                  <div className="mt-4 pt-4 border-t border-gray-700/50 flex justify-between items-center">
                                    <span className="inline-flex items-center bg-gray-700/50 px-3 py-1 rounded-full text-xs text-gray-300">
                                      {
                                        categories.find(
                                          (c) => c.id === faq.category,
                                        )?.icon
                                      }
                                      <span className="ml-1">
                                        {categories.find(
                                          (c) => c.id === faq.category,
                                        )?.name || faq.category}
                                      </span>
                                    </span>

                                    {/* Helpful buttons */}
                                    <div className="flex space-x-2">
                                      <button className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded-lg transition-colors hover:bg-gray-700/50">
                                        Was this helpful?
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16 bg-gray-800/50 rounded-xl border border-gray-700"
                  >
                    <div className="inline-block mb-4">
                      <Search className="h-12 w-12 text-gray-500 mx-auto" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No results found
                    </h3>
                    <p className="text-gray-400 mb-6">
                      We couldn't find any FAQs matching your search.
                    </p>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={clearSearch}
                        className="text-primary-400 hover:text-primary-300 font-medium"
                      >
                        Clear search
                      </button>
                      <a
                        href="/contact"
                        className="text-primary-400 hover:text-primary-300 font-medium"
                      >
                        Contact support
                      </a>
                    </div>
                  </motion.div>
                )}

                {/* Contact section at the bottom */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7 }}
                  className="mt-16 bg-gradient-to-br from-primary-900/30 to-primary-700/30 rounded-xl p-8 border border-primary-500/30"
                >
                  <div className="flex flex-col md:flex-row items-center">
                    <div className="mb-6 md:mb-0 md:mr-8">
                      <div className="bg-primary-500/20 p-4 rounded-full">
                        <HelpCircle className="h-8 w-8 text-primary-400" />
                      </div>
                    </div>

                    <div className="text-center md:text-left mb-6 md:mb-0 md:flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">
                        Still have questions?
                      </h3>
                      <p className="text-gray-300">
                        Our support team is here to help you with any questions
                        or issues.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <motion.a
                        href="/contact"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center"
                      >
                        <MessageSquare className="mr-2 h-5 w-5" />
                        Contact Support
                      </motion.a>

                      <motion.a
                        href="mailto:support@videoremix.vip"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center border border-gray-700"
                      >
                        <Mail className="mr-2 h-5 w-5" />
                        Email Us
                      </motion.a>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Additional self-help resources */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="mt-16 max-w-6xl mx-auto"
            >
              <h2 className="text-2xl font-bold text-white text-center mb-8">
                Additional Resources
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: "Video Tutorials",
                    description:
                      "Watch step-by-step video guides on using VideoRemix.vip's features",
                    icon: <Video className="h-8 w-8 text-primary-400" />,
                    link: "/tutorials",
                  },
                  {
                    title: "Help Center",
                    description:
                      "Browse our comprehensive knowledge base articles and guides",
                    icon: <FileText className="h-8 w-8 text-primary-400" />,
                    link: "/help-center",
                  },
                  {
                    title: "Community Forum",
                    description:
                      "Connect with other users to share tips and get inspiration",
                    icon: <Users className="h-8 w-8 text-primary-400" />,
                    link: "/community",
                  },
                ].map((resource, index) => (
                  <motion.a
                    key={index}
                    href={resource.link}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-primary-500/30 transition-colors flex flex-col h-full"
                  >
                    <div className="bg-primary-900/30 p-3 rounded-lg inline-block mb-4">
                      {resource.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {resource.title}
                    </h3>
                    <p className="text-gray-300 mb-6">{resource.description}</p>
                    <div className="mt-auto">
                      <span className="text-primary-400 font-medium flex items-center">
                        Explore
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </span>
                    </div>
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Product features highlight */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mt-20 text-center"
            >
              <MagicSparkles minSparkles={3} maxSparkles={6}>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Ready to Experience VideoRemix.vip?
                </h2>
              </MagicSparkles>

              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Create personalized marketing campaigns with our AI-powered
                platform and 37+ specialized tools.
              </p>

              <motion.a
                href="/get-started"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold px-8 py-4 rounded-lg shadow-lg shadow-primary-600/20"
              >
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </motion.a>

              <p className="mt-4 text-gray-400">
                No credit card required. Start with our Free plan or upgrade
                anytime.
              </p>

              {/* Key features */}
              <div className="mt-12 flex flex-wrap justify-center gap-4">
                {[
                  {
                    icon: <Zap className="h-4 w-4" />,
                    text: "AI-powered personalization",
                  },
                  {
                    icon: <Clock className="h-4 w-4" />,
                    text: "Create campaigns in minutes",
                  },
                  {
                    icon: <Video className="h-4 w-4" />,
                    text: "37+ marketing tools",
                  },
                  {
                    icon: <Database className="h-4 w-4" />,
                    text: "Audience segmentation",
                  },
                  {
                    icon: <Users className="h-4 w-4" />,
                    text: "Agency & team features",
                  },
                  {
                    icon: <Globe className="h-4 w-4" />,
                    text: "Multi-channel campaigns",
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="bg-gray-800 px-4 py-2 rounded-full border border-gray-700 flex items-center"
                  >
                    <div className="text-primary-400 mr-2 flex-shrink-0">
                      {feature.icon}
                    </div>
                    <span className="text-sm text-gray-300">
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
};

export default FAQPage;
