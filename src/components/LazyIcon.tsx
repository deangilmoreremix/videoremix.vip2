import React, { lazy, Suspense, ComponentType, useMemo } from "react";
import { Sparkles } from "lucide-react";

// Fallback component for missing icons
const FallbackIcon: React.FC<{ className?: string; size?: number }> = ({ className = "h-6 w-6", size }) => (
  <Sparkles className={className} size={size} />
);

// Icon mapping with lazy loading - create lazy components at module level
const iconMap: Record<string, ComponentType<any>> = {
  // App icons from appsData.ts
  "bar-chart-2": lazy(() => import("lucide-react").then((m) => ({ default: m.BarChart2 }))),
  "book-open": lazy(() => import("lucide-react").then((m) => ({ default: m.BookOpen }))),
  "briefcase": lazy(() => import("lucide-react").then((m) => ({ default: m.Briefcase }))),
  "code": lazy(() => import("lucide-react").then((m) => ({ default: m.Code }))),
  "database": lazy(() => import("lucide-react").then((m) => ({ default: m.Database }))),
  "dollar-sign": lazy(() => import("lucide-react").then((m) => ({ default: m.DollarSign }))),
  "edit": lazy(() => import("lucide-react").then((m) => ({ default: m.Edit }))),
  "file-signature": lazy(() => import("lucide-react").then((m) => ({ default: m.Ligature }))),
  "file-text": lazy(() => import("lucide-react").then((m) => ({ default: m.FileText }))),
  "globe": lazy(() => import("lucide-react").then((m) => ({ default: m.Globe }))),
  "home": lazy(() => import("lucide-react").then((m) => ({ default: m.Home }))),
  "image-icon": lazy(() => import("lucide-react").then((m) => ({ default: m.Image }))),
  "layers": lazy(() => import("lucide-react").then((m) => ({ default: m.Layers }))),
  "layout-template": lazy(() => import("lucide-react").then((m) => ({ default: m.LayoutTemplate }))),
  "mail": lazy(() => import("lucide-react").then((m) => ({ default: m.Mail }))),
  "map-pin": lazy(() => import("lucide-react").then((m) => ({ default: m.MapPin }))),
  "megaphone": lazy(() => import("lucide-react").then((m) => ({ default: m.Megaphone }))),
  "message-square": lazy(() => import("lucide-react").then((m) => ({ default: m.MessageSquare }))),
  "mic": lazy(() => import("lucide-react").then((m) => ({ default: m.Mic }))),
  "monitor": lazy(() => import("lucide-react").then((m) => ({ default: m.Monitor }))),
  "palette": lazy(() => import("lucide-react").then((m) => ({ default: m.Palette }))),
  "panel-top": lazy(() => import("lucide-react").then((m) => ({ default: m.PanelTop }))),
  "plane": lazy(() => import("lucide-react").then((m) => ({ default: m.Plane }))),
  "radio": lazy(() => import("lucide-react").then((m) => ({ default: m.Radio }))),
  "rocket": lazy(() => import("lucide-react").then((m) => ({ default: m.Rocket }))),
  "search": lazy(() => import("lucide-react").then((m) => ({ default: m.Search }))),
  "settings": lazy(() => import("lucide-react").then((m) => ({ default: m.Settings }))),
  "shield": lazy(() => import("lucide-react").then((m) => ({ default: m.Shield }))),
  "sparkles": lazy(() => import("lucide-react").then((m) => ({ default: m.Sparkles }))),
  "trending-up": lazy(() => import("lucide-react").then((m) => ({ default: m.TrendingUp }))),
  "user-check": lazy(() => import("lucide-react").then((m) => ({ default: m.UserCheck }))),
  "user-circle": lazy(() => import("lucide-react").then((m) => ({ default: m.UserCircle }))),
  "video": lazy(() => import("lucide-react").then((m) => ({ default: m.Video }))),
  
  // Legacy categories (kept for backward compatibility)
  "sales-lead-gen": lazy(() => import("lucide-react").then((m) => ({ default: m.BarChart2 }))),
  "content-marketing": lazy(() => import("lucide-react").then((m) => ({ default: m.FileText }))),
  "video-audio-voice": lazy(() => import("lucide-react").then((m) => ({ default: m.Video }))),
  "rag-knowledgebase": lazy(() => import("lucide-react").then((m) => ({ default: m.Database }))),
  "realestate-local": lazy(() => import("lucide-react").then((m) => ({ default: m.Home }))),
  "hr-hiring": lazy(() => import("lucide-react").then((m) => ({ default: m.UserCheck }))),
  "finance-business": lazy(() => import("lucide-react").then((m) => ({ default: m.DollarSign }))),
  "legal-compliance": lazy(() => import("lucide-react").then((m) => ({ default: m.Shield }))),
  "coding-developer": lazy(() => import("lucide-react").then((m) => ({ default: m.Settings }))),
  "design-uiux": lazy(() => import("lucide-react").then((m) => ({ default: m.Palette }))),
  "research-education": lazy(() => import("lucide-react").then((m) => ({ default: m.Search }))),
  "productivity-personal": lazy(() => import("lucide-react").then((m) => ({ default: m.UserCircle }))),
  
  // Feature icons from featuresData.ts
  "wand-2": lazy(() => import("lucide-react").then((m) => ({ default: m.Wand2 }))),
  "clock": lazy(() => import("lucide-react").then((m) => ({ default: m.Clock }))),
  "pencil-ruler": lazy(() => import("lucide-react").then((m) => ({ default: m.PencilRuler }))),
  
  // Specific apps
  "ai-personalized-content": lazy(() => import("lucide-react").then((m) => ({ default: m.Sparkles }))),
  "ai-referral-maximizer": lazy(() => import("lucide-react").then((m) => ({ default: m.Megaphone }))),
  "ai-sales-maximizer": lazy(() => import("lucide-react").then((m) => ({ default: m.BarChart2 }))),
  "ai-screen-recorder": lazy(() => import("lucide-react").then((m) => ({ default: m.Monitor }))),
  "smart-crm-closer": lazy(() => import("lucide-react").then((m) => ({ default: m.Database }))),
  "video-ai-editor": lazy(() => import("lucide-react").then((m) => ({ default: m.Video }))),
  "ai-video-image": lazy(() => import("lucide-react").then((m) => ({ default: m.Image }))),
  "ai-skills-monetizer": lazy(() => import("lucide-react").then((m) => ({ default: m.DollarSign }))),
  "ai-signature": lazy(() => import("lucide-react").then((m) => ({ default: m.FileSignature }))),
  "ai-template-generator": lazy(() => import("lucide-react").then((m) => ({ default: m.LayoutTemplate }))),
  "funnelcraft-ai": lazy(() => import("lucide-react").then((m) => ({ default: m.BarChart2 }))),
  "interactive-shopping": lazy(() => import("lucide-react").then((m) => ({ default: m.ShoppingBag }))),
  "personalizer-ai-profile-generator": lazy(() => import("lucide-react").then((m) => ({ default: m.UserCircle }))),
  "personalizer-ai-video-image-transformer": lazy(() => import("lucide-react").then((m) => ({ default: m.Sparkles }))),
  "personalizer-url-video-generation": lazy(() => import("lucide-react").then((m) => ({ default: m.Video }))),
  "ai-proposal": lazy(() => import("lucide-react").then((m) => ({ default: m.FileText }))),
  "sales-assistant-app": lazy(() => import("lucide-react").then((m) => ({ default: m.Briefcase }))),
  "sales-page-builder": lazy(() => import("lucide-react").then((m) => ({ default: m.PanelTop }))),

  // 15 New Dashboard Apps
  "ai-referral-maximizer-pro": lazy(() => import("lucide-react").then((m) => ({ default: m.Megaphone }))),
  "smart-crm-closer-pro": lazy(() => import("lucide-react").then((m) => ({ default: m.Database }))),
  "video-ai-editor-pro": lazy(() => import("lucide-react").then((m) => ({ default: m.Video }))),
  "ai-video-image-pro": lazy(() => import("lucide-react").then((m) => ({ default: m.Image }))),
  "ai-skills-monetizer-pro": lazy(() => import("lucide-react").then((m) => ({ default: m.DollarSign }))),
  "ai-signature-pro": lazy(() => import("lucide-react").then((m) => ({ default: m.FileSignature }))),
  "personalizer-profile-generator": lazy(() => import("lucide-react").then((m) => ({ default: m.UserCircle }))),
  "personalizer-transformer": lazy(() => import("lucide-react").then((m) => ({ default: m.Sparkles }))),
  "personalizer-url-templates": lazy(() => import("lucide-react").then((m) => ({ default: m.LayoutTemplate }))),
  "ai-proposal-generator": lazy(() => import("lucide-react").then((m) => ({ default: m.FileText }))),
  "sales-assistant-platform": lazy(() => import("lucide-react").then((m) => ({ default: m.Briefcase }))),
  "sales-page-builder-pro": lazy(() => import("lucide-react").then((m) => ({ default: m.PanelTop }))),
};

interface LazyIconProps {
  name: string;
  className?: string;
  size?: number;
}

const LazyIcon: React.FC<LazyIconProps> = ({
  name,
  className = "h-6 w-6",
  size,
}) => {
  // Defensive: Ensure name is a string, not an object
  const iconName = typeof name === "string" ? name : "sparkles";

  // Get the icon component or use fallback
  const IconComponent = iconMap[iconName] || FallbackIcon;

  return (
    <Suspense fallback={<FallbackIcon className={className} size={size} />}>
      <IconComponent className={className} size={size} />
    </Suspense>
  );
};

export default LazyIcon;
