import React from "react";
import { Video, Users, Image as ImageIcon, Sparkles, Palette, CircleUser as UserCircle, Package, Layers, FileText, Mic, Search, ArrowRight, ListFilter as Filter, Play, Star, PanelTop, Zap, Camera, Share, Megaphone, Database, Monitor, DollarSign, Ligature as FileSignature, LayoutTemplate, ShoppingBag, Store, UserCheck, Rocket, Settings, ChartBar as BarChart2, Briefcase } from "lucide-react";

// App data structure
interface App {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  image: string;
  popular?: boolean;
  new?: boolean;
  comingSoon?: boolean;
  price?: number;
  longDescription?: string;
  demoImage?: string;
  benefits?: string[];
  features?: {
    title: string;
    description: string;
    icon?: React.ReactNode;
  }[];
  steps?: {
    title: string;
    description: string;
  }[];
  useCases?: {
    title: string;
    description: string;
    points: string[];
  }[];
  testimonials?: {
    quote: string;
    name: string;
    role: string;
    avatar: string;
  }[];
  faqs?: {
    question: string;
    answer: string;
  }[];
  tags?: string[];
}

// All apps data
export const appsData: App[] = [
  {
    id: "video-creator",
    name: "AI Video Creator",
    description: "Create professional videos from keywords and prompts",
    category: "video",
    icon: React.createElement(Video),
    image:
      "/thumbnails/apps/video-creator.svg",
    popular: true,
  },
  {
    id: "promo-generator",
    name: "Promo Generator",
    description: "Generate promotional videos for your products and services",
    category: "video",
    icon: React.createElement(Video),
    image:
      "/thumbnails/apps/promo-generator.svg",
    popular: true,
  },
  {
    id: "landing-page",
    name: "Landing Page Creator",
    description: "Create full-blown landing pages in 60 seconds",
    category: "lead-gen",
    icon: React.createElement(Layers),
    image:
      "/thumbnails/apps/landing-page.svg",
    popular: true,
  },
  {
    id: "ai-image-tools",
    name: "AI Image Tools Collection",
    description: "Access our impressive collection of AI image creation tools",
    category: "ai-image",
    icon: React.createElement(ImageIcon),
    image:
      "/thumbnails/apps/ai-image-tools.svg",
    new: true,
  },
  {
    id: "rebrander-ai",
    name: "RE-BRANDER AI",
    description: "The ultimate AI re-branding system",
    category: "branding",
    icon: React.createElement(Palette),
    image:
      "/thumbnails/apps/rebrander-ai.svg",
    new: true,
  },
  {
    id: "business-brander",
    name: "Business Brander Enterprise",
    description: "Comprehensive branding solution for enterprises",
    category: "branding",
    icon: React.createElement(Palette),
    image:
      "/thumbnails/apps/business-brander.svg",
  },
  {
    id: "branding-analyzer",
    name: "Business Branding Analyzer",
    description: "Analyze and improve your brand presence",
    category: "branding",
    icon: React.createElement(Palette),
    image:
      "/thumbnails/apps/branding-analyzer.svg",
  },
  {
    id: "ai-branding",
    name: "AI Branding Accelerator",
    description: "Speed up your branding process with AI assistance",
    category: "branding",
    icon: React.createElement(Sparkles),
    image:
      "/thumbnails/apps/ai-branding.svg",
  },
  {
    id: "ai-sales",
    name: "AI Sales Maximizer",
    description: "Optimize your sales strategy with AI insights",
    category: "branding",
    icon: React.createElement(Sparkles),
    image:
      "/thumbnails/apps/ai-sales.svg",
  },
  {
    id: "voice-coach",
    name: "AI Voice Coach Pro",
    description: "Perfect your speaking skills with AI feedback",
    category: "personalizer",
    icon: React.createElement(Mic),
    image:
      "/thumbnails/apps/voice-coach.svg",
  },
  {
    id: "resume-amplifier",
    name: "AI Resume Amplifier",
    description: "Enhance your resume with AI optimization",
    category: "personalizer",
    icon: React.createElement(FileText),
    image:
      "/thumbnails/apps/resume-amplifier.svg",
  },
  {
    id: "storyboard",
    name: "Storyboard AI",
    description: "Create professional storyboards with AI assistance",
    category: "creative",
    icon: React.createElement(Layers),
    image:
      "/thumbnails/apps/storyboard.svg",
    popular: true,
  },
  {
    id: "sales-monetizer",
    name: "AI Sales Monetizer",
    description: "Convert leads into sales with AI strategies",
    category: "lead-gen",
    icon: React.createElement(Sparkles),
    image:
      "/thumbnails/apps/sales-monetizer.svg",
  },
  {
    id: "smart-presentations",
    name: "Smart Presentations",
    description: "Create engaging presentations with minimal effort",
    category: "creative",
    icon: React.createElement(Layers),
    image:
      "/thumbnails/apps/smart-presentations.svg",
    popular: true,
  },
  {
    id: "personalizer-recorder",
    name: "AI Screen Recorder",
    description: "Record and enhance screen captures automatically",
    category: "personalizer",
    icon: React.createElement(Video),
    image:
      "/thumbnails/apps/personalizer-recorder.svg",
  },
  {
    id: "personalizer-profile",
    name: "AI Profile Generator",
    description: "Create optimized profiles for any platform",
    category: "personalizer",
    icon: React.createElement(UserCircle),
    image:
      "/thumbnails/apps/personalizer-profile.svg",
  },
  {
    id: "thumbnail-generator",
    name: "AI Thumbnail Generator",
    description: "Create eye-catching thumbnails that drive clicks",
    category: "personalizer",
    icon: React.createElement(ImageIcon),
    image:
      "/thumbnails/apps/thumbnail-generator.svg",
    popular: true,
  },
  {
    id: "interactive-outros",
    name: "Interactive Video Outros",
    description: "Engage viewers at the end of your videos",
    category: "creative",
    icon: React.createElement(Video),
    image:
      "/thumbnails/apps/interactive-outros.svg",
  },
  {
    id: "social-pack",
    name: "Social Media Pack",
    description: "Everything you need for social media success",
    category: "creative",
    icon: React.createElement(Package),
    image:
      "/thumbnails/apps/social-pack.svg",
  },
  {
    id: "ai-art",
    name: "AI Art Generator",
    description: "Create stunning artwork with artificial intelligence",
    category: "ai-image",
    icon: React.createElement(Sparkles),
    image:
      "/thumbnails/apps/ai-art.svg",
    new: true,
  },
  {
    id: "bg-remover",
    name: "AI Background Remover",
    description: "Remove backgrounds with a single click",
    category: "ai-image",
    icon: React.createElement(ImageIcon),
    image:
      "/thumbnails/apps/bg-remover.svg",
    popular: true,
  },
  {
    id: "text-to-speech",
    name: "Text to Speech",
    description: "Convert text to natural-sounding speech",
    category: "video",
    icon: React.createElement(Mic),
    image:
      "/thumbnails/apps/voice-coach.svg",
  },
  {
    id: "niche-script",
    name: "AI Niche Script Creator",
    description: "Generate niche-specific scripts for your videos",
    category: "video",
    icon: React.createElement(FileText),
    image:
      "/thumbnails/apps/niche-script.svg",
  },
  // NEW APPS
  {
    id: "ai-referral-maximizer",
    name: "AI Referral Maximizer",
    description: "Maximize your referral program with AI optimization",
    category: "lead-gen",
    icon: React.createElement(Megaphone),
    image:
      "/thumbnails/apps/ai-referral-maximizer.svg",
    new: true,
  },
  {
    id: "smart-crm-closer",
    name: "Smart CRM Closer",
    description: "Close more deals with intelligent CRM automation",
    category: "lead-gen",
    icon: React.createElement(Database),
    image:
      "/thumbnails/apps/smart-crm-closer.svg",
    popular: true,
  },
  {
    id: "video-ai-editor",
    name: "Video AI Editor",
    description: "Advanced AI-powered video editing with smart automation",
    category: "video",
    icon: React.createElement(Video),
    image:
      "/thumbnails/apps/video-ai-editor.svg",
    new: true,
  },
  {
    id: "ai-video-image",
    name: "AI Video & Image",
    description: "Transform videos and images with AI enhancement",
    category: "ai-image",
    icon: React.createElement(ImageIcon),
    image:
      "/thumbnails/apps/ai-video-image.svg",
    popular: true,
  },
  {
    id: "ai-skills-monetizer",
    name: "AI Skills Monetizer",
    description: "Turn your skills into profitable online businesses",
    category: "personalizer",
    icon: React.createElement(DollarSign),
    image:
      "/thumbnails/apps/ai-skills-monetizer.svg",
    new: true,
  },
  {
    id: "ai-signature",
    name: "AI Signature",
    description: "Generate professional digital signatures with AI",
    category: "personalizer",
    icon: React.createElement(FileSignature),
    image:
      "/thumbnails/apps/ai-signature.svg",
    new: true,
  },
  {
    id: "ai-template-generator",
    name: "AI Template Generator",
    description: "Create custom templates for any purpose with AI",
    category: "creative",
    icon: React.createElement(LayoutTemplate),
    image:
      "/thumbnails/apps/ai-template-generator.svg",
    popular: true,
  },
  {
    id: "funnelcraft-ai",
    name: "FunnelCraft AI",
    description: "Build high-converting sales funnels with AI assistance",
    category: "lead-gen",
    icon: React.createElement(BarChart2),
    image:
      "/thumbnails/apps/funnelcraft-ai.svg",
    popular: true,
  },
  {
    id: "interactive-shopping",
    name: "Interactive Shopping",
    description: "Create engaging interactive shopping experiences",
    category: "creative",
    icon: React.createElement(ShoppingBag),
    image:
      "/thumbnails/apps/interactive-shopping.svg",
    new: true,
  },
  {
    id: "personalizer-video-image-transformer",
    name: "AI Video & Image Transformer",
    description: "Transform videos and images with advanced AI processing",
    category: "ai-image",
    icon: React.createElement(Sparkles),
    image:
      "/thumbnails/apps/ai-image-tools.svg",
    new: true,
  },
  {
    id: "personalizer-url-video-generation",
    name: "URL Video Generation Templates & Editor",
    description: "Generate videos from URLs with smart template matching",
    category: "video",
    icon: React.createElement(Video),
    image:
      "/thumbnails/apps/video-creator.svg",
    new: true,
  },
  {
    id: "sales-assistant-app",
    name: "Sales Assistant App",
    description: "Your complete AI-powered sales assistant",
    category: "lead-gen",
    icon: React.createElement(Briefcase),
    image:
      "/thumbnails/apps/sales-assistant-app.svg",
    popular: true,
  },
  {
    id: "personalizer-text-ai-editor",
    name: "Personalizer Text AI Editor",
    description: "Edit and personalize text content with AI assistance",
    category: "personalizer",
    icon: React.createElement(FileText),
    image:
      "/thumbnails/apps/niche-script.svg",
    new: true,
  },
  {
    id: "personalizer-advanced-text-video-editor",
    name: "Personalizer Advanced Text-Video AI Editor",
    description: "Advanced AI-powered text and video editing combined",
    category: "personalizer",
    icon: React.createElement(Video),
    image:
      "/thumbnails/apps/video-ai-editor.svg",
    popular: true,
  },
  {
    id: "personalizer-writing-toolkit",
    name: "Personalizer AI Writing Toolkit",
    description: "Complete toolkit for AI-powered personalized writing",
    category: "personalizer",
    icon: React.createElement(FileText),
    image:
      "/thumbnails/apps/personalizer-writing-toolkit.svg",
    new: true,
  },
];
