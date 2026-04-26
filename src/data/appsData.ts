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
  Wand2,
  Scissors,
  Edit,
  Heart,
  MessageSquare,
  ShoppingCart,
  CreditCard,
  Mail,
  Radio,
  Send,
  Plane,
  Wrench,
  Droplets as Drop,
  Car,
  Truck,
  Home,
  Shield,
  Utensils,

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
  // Video & Content Creation Apps (3)
  {
    id: "ai-personalizedcontent",
    name: "AI Personalized Content",
    description: "Create highly personalized content that speaks directly to your audience",
    category: "video",
    icon: React.createElement(Video),
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-personalized-content-thumbnail.png",
    popular: true,
    salesCopy: appSalesCopy['ai-personalizedcontent'] || appSalesCopy['ai-personalized-content'],
  },
  {
    id: "video-ai-editor",
    name: "Video AI Editor",
    description: "Professional video editing powered by artificial intelligence",
    category: "video",
    icon: React.createElement(Video),
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/video-ai-editor-thumbnail.png",
    popular: true,
    salesCopy: appSalesCopy['video-ai-editor'],
  },
  {
    id: "ai-video-image",
    name: "AI Video & Image",
    description: "Transform videos and images with advanced AI processing",
    category: "ai-image",
    icon: React.createElement(ImageIcon),
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-video-image-thumbnail.png",
    new: true,
    salesCopy: appSalesCopy['ai-video-image'],
  },

  // Sales & Marketing Apps (7)
  {
    id: "ai-referral-maximizer",
    name: "AI Referral Maximizer",
    description: "Maximize your referral conversions with AI-powered automation",
    category: "lead-gen",
    icon: React.createElement(Share2),
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-referral-maximizer-thumbnail.png",
    popular: true,
    salesCopy: appSalesCopy['ai-referral-maximizer'],
  },
  {
    id: "ai-sales",
    name: "AI Sales Maximizer",
    description: "Boost your sales with intelligent AI-driven strategies",
    category: "lead-gen",
    icon: React.createElement(TrendingUp),
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-sales-maximizer-thumbnail.png",
    popular: true,
    salesCopy: appSalesCopy['ai-sales'],
  },
  {
    id: "smart-crm-closer",
    name: "Smart CRM Closer",
    description: "Close more deals with AI-powered CRM intelligence",
    category: "lead-gen",
    icon: React.createElement(Target),
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/smart-crm-closer-thumbnail.png",
    popular: true,
    salesCopy: appSalesCopy['smart-crm-closer'],
  },
  {
    id: "funnelcraft-ai",
    name: "FunnelCraft AI",
    description: "Build high-converting sales funnels",
    category: "lead-gen",
    icon: React.createElement(BarChart2),
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/funnelcraft-ai-thumbnail.png",
    new: true,
    salesCopy: appSalesCopy['funnelcraft-ai'],
  },
  {
    id: "ai-proposal",
    name: "AI Proposal",
    description: "Create winning proposals with AI-powered writing assistance",
    category: "lead-gen",
    icon: React.createElement(FileText),
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-proposal-thumbnail.png",
    salesCopy: appSalesCopy['ai-proposal'],
  },
  {
    id: "sales-assistant-app",
    name: "Sales Assistant App",
    description: "Your complete AI sales assistance platform",
    category: "lead-gen",
    icon: React.createElement(Users),
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/sales-assistant-app-thumbnail.png",
    salesCopy: appSalesCopy['sales-assistant-app'],
  },
  {
    id: "sales-page-builder",
    name: "Sales Page Builder",
    description: "Build high-converting sales pages in minutes",
    category: "lead-gen",
    icon: React.createElement(Layers),
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/sales-page-builder-thumbnail.png",
    salesCopy: appSalesCopy['sales-page-builder'],
  },

  // Professional Development Apps (4)
  {
    id: "personalizer-recorder",
    name: "AI Screen Recorder",
    description: "Record your screen with AI-enhanced editing capabilities",
    category: "personalizer",
    icon: React.createElement(Camera),
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-screen-recorder-thumbnail.png",
    salesCopy: appSalesCopy['personalizer-recorder'],
  },
  {
    id: "ai-skills-monetizer",
    name: "AI Skills Monetizer",
    description: "Turn your skills into profitable income streams",
    category: "personalizer",
    icon: React.createElement(DollarSign),
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-skills-monetizer-thumbnail.png",
    popular: true,
    salesCopy: appSalesCopy['ai-skills-monetizer'],
  },
  {
    id: "ai-signature",
    name: "AI Signature",
    description: "Create professional email signatures with AI design",
    category: "personalizer",
    icon: React.createElement(FileSignature),
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-signature-thumbnail.png",
    salesCopy: appSalesCopy['ai-signature'],
  },
  {
    id: "ai-template-generator",
    name: "AI Template Generator",
    description: "Generate templates for any purpose",
    category: "creative",
    icon: React.createElement(LayoutTemplate),
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-template-generator-thumbnail.png",
    new: true,
    salesCopy: appSalesCopy['ai-template-generator'],
  },

  // Personalizer Suite Apps (3)
  {
    id: "personalizer-profile",
    name: "Personalizer AI Profile Generator",
    description: "Generate compelling personalized profiles with AI",
    category: "personalizer",
    icon: React.createElement(UserCircle),
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/personalizer-profile-generator-thumbnail.png",
    popular: true,
    salesCopy: appSalesCopy['personalizer-profile'],
  },
  {
    id: "personalizer-video-image-transformer",
    name: "Personalizer AI Video & Image Transformer",
    description: "Transform media content with personalized AI enhancements",
    category: "ai-image",
    icon: React.createElement(Sparkles),
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/personalizer-video-image-transformer-thumbnail.png",
    salesCopy: appSalesCopy['personalizer-video-image-transformer'],
  },
  {
    id: "personalizer-url-video-generation",
    name: "Personalizer URL Video Generation Templates & Editor",
    description: "Generate personalized videos from URLs with smart templates",
    category: "video",
    icon: React.createElement(Play),
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/personalizer-url-video-generation-thumbnail.png",
    salesCopy: appSalesCopy['personalizer-url-video-generation'],
  },
];

// Export apps data with AI-generated thumbnails where available
export const appsData: App[] = updateAppThumbnails(rawAppsData);
