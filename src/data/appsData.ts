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
  Megaphone,
  Database,
  Monitor,
  DollarSign,
  Ligature as FileSignature,
  LayoutTemplate,
  ShoppingBag,
  Store,
  UserCheck,
  Rocket,
  Settings,
  BarChart2,
  Briefcase,
} from "lucide-react";
import { updateAppThumbnails } from "../utils/thumbnailMapper";
import { SalesCopy, appSalesCopy } from './appSalesCopy';

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
  salesCopy?: SalesCopy;
}

// All apps data
const rawAppsData: App[] = [
  {
    id: "video-creator",
    name: "AI Video Creator",
    description: "Create professional videos from keywords and prompts",
    category: "video",
    icon: React.createElement(Video),
    image:
      "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/video-creator-ai-thumbnail-1776625726577.png",
    popular: true,
    salesCopy: appSalesCopy['video-creator'],
  },
  {
    id: "promo-generator",
    name: "Promo Generator",
    description: "Generate promotional videos for your products and services",
    category: "video",
    icon: React.createElement(Video),
    image:
      "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/promo-generator-ai-thumbnail-1776625727189.png",
    popular: true,
    salesCopy: appSalesCopy['promo-generator'],
  },
  {
    id: "landing-page",
    name: "Landing Page Creator",
    description: "Create full-blown landing pages in 60 seconds",
    category: "lead-gen",
    icon: React.createElement(Layers),
    image:
      "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/landing-page-ai-thumbnail-1776625729992.png",
    popular: true,
    salesCopy: appSalesCopy['landing-page'],
  },
  {
    id: "ai-image-tools",
    name: "AI Image Tools Collection",
    description: "Access our impressive collection of AI image creation tools",
    category: "ai-image",
    icon: React.createElement(ImageIcon),
    image:
      "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-image-tools-ai-thumbnail-1776625760448.png",
    new: true,
    salesCopy: appSalesCopy['ai-image-tools'],
  },
  {
    id: "rebrander-ai",
    name: "RE-BRANDER AI",
    description: "The ultimate AI re-branding system",
    category: "branding",
    icon: React.createElement(Palette),
    image:
      "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/rebrander-ai-ai-thumbnail-1776625764714.png",
    new: true,
    salesCopy: appSalesCopy['rebrander-ai'],
  },
  {
    id: "business-brander",
    name: "Business Brander Enterprise",
    description: "Comprehensive branding solution for enterprises",
    category: "branding",
    icon: React.createElement(Palette),
    image:
      "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    salesCopy: appSalesCopy['business-brander'],
  },
  {
    id: "branding-analyzer",
    name: "Business Branding Analyzer",
    description: "Analyze and improve your brand presence",
    category: "branding",
    icon: React.createElement(Palette),
    image:
      "https://images.unsplash.com/photo-1559028012-481c04fa702d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    salesCopy: appSalesCopy['branding-analyzer'],
  },
  {
    id: "ai-branding",
    name: "AI Branding Accelerator",
    description: "Speed up your branding process with AI assistance",
    category: "branding",
    icon: React.createElement(Sparkles),
    image:
      "https://images.unsplash.com/photo-1493612276216-ee3925520721?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    salesCopy: appSalesCopy['ai-branding'],
  },
  {
    id: "ai-sales",
    name: "AI Sales Maximizer",
    description: "Optimize your sales strategy with AI insights",
    category: "branding",
    icon: React.createElement(Sparkles),
    image:
      "https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    salesCopy: appSalesCopy['ai-sales'],
  },
  {
    id: "voice-coach",
    name: "AI Voice Coach Pro",
    description: "Perfect your speaking skills with AI feedback",
    category: "personalizer",
    icon: React.createElement(Mic),
    image:
      "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/voice-coach-ai-thumbnail-1776625763165.png",
    salesCopy: appSalesCopy['voice-coach'],
  },
  {
    id: "resume-amplifier",
    name: "AI Resume Amplifier",
    description: "Enhance your resume with AI optimization",
    category: "personalizer",
    icon: React.createElement(FileText),
    image:
      "https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    salesCopy: appSalesCopy['resume-amplifier'],
  },
  {
    id: "storyboard",
    name: "Storyboard AI",
    description: "Create professional storyboards with AI assistance",
    category: "creative",
    icon: React.createElement(Layers),
    image:
      "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/storyboard-ai-thumbnail-1776625955310.png",
    popular: true,
    salesCopy: appSalesCopy['storyboard'],
  },
  {
    id: "sales-monetizer",
    name: "AI Sales Monetizer",
    description: "Convert leads into sales with AI strategies",
    category: "lead-gen",
    icon: React.createElement(Sparkles),
    image:
      "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/sales-monetizer-ai-thumbnail-1776625959763.png",
    salesCopy: appSalesCopy['sales-monetizer'],
  },
  {
    id: "smart-presentations",
    name: "Smart Presentations",
    description: "Create engaging presentations with minimal effort",
    category: "creative",
    icon: React.createElement(Layers),
    image:
      "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/smart-presentations-ai-thumbnail-1776625954908.png",
    popular: true,
    salesCopy: appSalesCopy['smart-presentations'],
  },
  {
    id: "personalizer-recorder",
    name: "AI Screen Recorder",
    description: "Record and enhance screen captures automatically",
    category: "personalizer",
    icon: React.createElement(Video),
    image:
      "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/personalizer-recorder-ai-thumbnail-1776625995139.png",
    salesCopy: appSalesCopy['personalizer-recorder'],
  },
  {
    id: "personalizer-profile",
    name: "AI Profile Generator",
    description: "Create optimized profiles for any platform",
    category: "personalizer",
    icon: React.createElement(UserCircle),
    image:
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    salesCopy: appSalesCopy['personalizer-profile'],
  },
  {
    id: "thumbnail-generator",
    name: "AI Thumbnail Generator",
    description: "Create eye-catching thumbnails that drive clicks",
    category: "personalizer",
    icon: React.createElement(ImageIcon),
    image:
      "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/thumbnail-generator-ai-thumbnail-1776625994953.png",
    popular: true,
    salesCopy: appSalesCopy['thumbnail-generator'],
  },
  {
    id: "interactive-outros",
    name: "Interactive Video Outros",
    description: "Engage viewers at the end of your videos",
    category: "creative",
    icon: React.createElement(Video),
    image:
      "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/interactive-outros-ai-thumbnail-1776625994817.png",
    salesCopy: appSalesCopy['interactive-outros'],
  },
  {
    id: "social-pack",
    name: "Social Media Pack",
    description: "Everything you need for social media success",
    category: "creative",
    icon: React.createElement(Package),
    image:
      "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/social-pack-ai-thumbnail-1776626028165.png",
    salesCopy: appSalesCopy['social-pack'],
  },
  {
    id: "ai-art",
    name: "AI Art Generator",
    description: "Create stunning artwork with artificial intelligence",
    category: "ai-image",
    icon: React.createElement(Sparkles),
    image:
      "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-art-ai-thumbnail-1776626027553.png",
    new: true,
    salesCopy: appSalesCopy['ai-art'],
  },
  {
    id: "bg-remover",
    name: "AI Background Remover",
    description: "Remove backgrounds with a single click",
    category: "ai-image",
    icon: React.createElement(ImageIcon),
    image:
      "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/bg-remover-ai-thumbnail-1776626027625.png",
    popular: true,
    salesCopy: appSalesCopy['bg-remover'],
  },
  {
    id: "text-to-speech",
    name: "Text to Speech",
    description: "Convert text to natural-sounding speech",
    category: "video",
    icon: React.createElement(Mic),
    image:
      "https://images.unsplash.com/photo-1598550476439-6847785fcea6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    salesCopy: appSalesCopy['text-to-speech'],
  },
  {
    id: "niche-script",
    name: "AI Niche Script Creator",
    description: "Generate niche-specific scripts for your videos",
    category: "video",
    icon: React.createElement(FileText),
    image:
      "https://images.unsplash.com/photo-1455390528084-8b85e4bcd271?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    salesCopy: appSalesCopy['niche-script'],
  },
  // NEW APPS
  {
    id: "ai-referral-maximizer",
    name: "AI Referral Maximizer",
    description: "Maximize your referral program with AI optimization",
    category: "lead-gen",
    icon: React.createElement(Megaphone),
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    new: true,
    salesCopy: appSalesCopy['ai-referral-maximizer'],
  },
  {
    id: "smart-crm-closer",
    name: "Smart CRM Closer",
    description: "Close more deals with intelligent CRM automation",
    category: "lead-gen",
    icon: React.createElement(Database),
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    popular: true,
    salesCopy: appSalesCopy['smart-crm-closer'],
  },
  {
    id: "video-ai-editor",
    name: "Video AI Editor",
    description: "Advanced AI-powered video editing with smart automation",
    category: "video",
    icon: React.createElement(Video),
    image:
      "https://images.unsplash.com/photo-1626785774573-4b799315345d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    new: true,
    salesCopy: appSalesCopy['video-ai-editor'],
  },
  {
    id: "ai-video-image",
    name: "AI Video & Image",
    description: "Transform videos and images with AI enhancement",
    category: "ai-image",
    icon: React.createElement(ImageIcon),
    image:
      "https://images.unsplash.com/photo-1579403124614-197f69d8187b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    popular: true,
    salesCopy: appSalesCopy['ai-video-image'],
  },
  {
    id: "ai-skills-monetizer",
    name: "AI Skills Monetizer",
    description: "Turn your skills into profitable online businesses",
    category: "personalizer",
    icon: React.createElement(DollarSign),
    image:
      "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    new: true,
    salesCopy: appSalesCopy['ai-skills-monetizer'],
  },
  {
    id: "ai-signature",
    name: "AI Signature",
    description: "Generate professional digital signatures with AI",
    category: "personalizer",
    icon: React.createElement(FileSignature),
    image:
      "https://images.unsplash.com/photo-1586380980850-5bb0c0329b2e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    new: true,
    salesCopy: appSalesCopy['ai-signature'],
  },
  {
    id: "ai-template-generator",
    name: "AI Template Generator",
    description: "Create custom templates for any purpose with AI",
    category: "creative",
    icon: React.createElement(LayoutTemplate),
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    popular: true,
    salesCopy: appSalesCopy['ai-template-generator'],
  },
  {
    id: "funnelcraft-ai",
    name: "FunnelCraft AI",
    description: "Build high-converting sales funnels with AI assistance",
    category: "lead-gen",
    icon: React.createElement(BarChart2),
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    popular: true,
    salesCopy: appSalesCopy['funnelcraft-ai'],
  },
  {
    id: "interactive-shopping",
    name: "Interactive Shopping",
    description: "Create engaging interactive shopping experiences",
    category: "creative",
    icon: React.createElement(ShoppingBag),
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    new: true,
    salesCopy: appSalesCopy['interactive-shopping'],
  },
  {
    id: "personalizer-video-image-transformer",
    name: "AI Video & Image Transformer",
    description: "Transform videos and images with advanced AI processing",
    category: "ai-image",
    icon: React.createElement(Sparkles),
    image:
      "https://images.unsplash.com/photo-1579546929662-711aa81148cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    new: true,
    salesCopy: appSalesCopy['personalizer-video-image-transformer'],
  },
  {
    id: "personalizer-url-video-generation",
    name: "URL Video Generation Templates & Editor",
    description: "Generate videos from URLs with smart template matching",
    category: "video",
    icon: React.createElement(Video),
    image:
      "https://images.unsplash.com/photo-1626785774573-4b799315345d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    new: true,
    salesCopy: appSalesCopy['personalizer-url-video-generation'],
  },
  {
    id: "sales-assistant-app",
    name: "Sales Assistant App",
    description: "Your complete AI-powered sales assistant",
    category: "lead-gen",
    icon: React.createElement(Briefcase),
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    popular: true,
    salesCopy: appSalesCopy['sales-assistant-app'],
  },
  {
    id: "personalizer-text-ai-editor",
    name: "Personalizer Text AI Editor",
    description: "Edit and personalize text content with AI assistance",
    category: "personalizer",
    icon: React.createElement(FileText),
    image:
      "https://images.unsplash.com/photo-1455390528084-8b85e4bcd271?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    new: true,
    salesCopy: appSalesCopy['personalizer-text-ai-editor'],
  },
  {
    id: "personalizer-advanced-text-video-editor",
    name: "Personalizer Advanced Text-Video AI Editor",
    description: "Advanced AI-powered text and video editing combined",
    category: "personalizer",
    icon: React.createElement(Video),
    image:
      "https://images.unsplash.com/photo-1626785774573-4b799315345d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    popular: true,
    salesCopy: appSalesCopy['personalizer-advanced-text-video-editor'],
  },
  {
    id: "personalizer-writing-toolkit",
    name: "Personalizer AI Writing Toolkit",
    description: "Complete toolkit for AI-powered personalized writing",
    category: "personalizer",
    icon: React.createElement(FileText),
    image:
      "https://images.unsplash.com/photo-1517842645767-c639042777db?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    new: true,
    salesCopy: appSalesCopy['personalizer-writing-toolkit'],
  },
];

// Export apps data with AI-generated thumbnails where available
export const appsData: App[] = updateAppThumbnails(rawAppsData);
