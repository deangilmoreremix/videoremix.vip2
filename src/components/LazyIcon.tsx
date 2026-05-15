import React, { lazy, Suspense, ComponentType, useMemo } from "react";
import { Sparkles } from "lucide-react";

// Fallback component for missing icons
const FallbackIcon: React.FC<{ className?: string; size?: number }> = ({ className = "h-6 w-6", size }) => (
  <Sparkles className={className} size={size} />
);

// Icon mapping with lazy loading
const iconMap: Record<string, () => Promise<{ default: ComponentType<any> }>> =
  {
    // App icons from appsData.ts
    "bar-chart-2": () => import("lucide-react").then((m) => ({ default: m.BarChart2 })),
    "book-open": () => import("lucide-react").then((m) => ({ default: m.BookOpen })),
    "briefcase": () => import("lucide-react").then((m) => ({ default: m.Briefcase })),
    "code": () => import("lucide-react").then((m) => ({ default: m.Code })),
    "database": () => import("lucide-react").then((m) => ({ default: m.Database })),
    "dollar-sign": () => import("lucide-react").then((m) => ({ default: m.DollarSign })),
    "edit": () => import("lucide-react").then((m) => ({ default: m.Edit })),
    "file-signature": () => import("lucide-react").then((m) => ({ default: m.Ligature })),
    "file-text": () => import("lucide-react").then((m) => ({ default: m.FileText })),
    "globe": () => import("lucide-react").then((m) => ({ default: m.Globe })),
    "home": () => import("lucide-react").then((m) => ({ default: m.Home })),
    "image-icon": () => import("lucide-react").then((m) => ({ default: m.Image })),
    "layers": () => import("lucide-react").then((m) => ({ default: m.Layers })),
    "layout-template": () => import("lucide-react").then((m) => ({ default: m.LayoutTemplate })),
    "mail": () => import("lucide-react").then((m) => ({ default: m.Mail })),
    "map-pin": () => import("lucide-react").then((m) => ({ default: m.MapPin })),
    "megaphone": () => import("lucide-react").then((m) => ({ default: m.Megaphone })),
    "message-square": () => import("lucide-react").then((m) => ({ default: m.MessageSquare })),
    "mic": () => import("lucide-react").then((m) => ({ default: m.Mic })),
    "monitor": () => import("lucide-react").then((m) => ({ default: m.Monitor })),
    "palette": () => import("lucide-react").then((m) => ({ default: m.Palette })),
    "panel-top": () => import("lucide-react").then((m) => ({ default: m.PanelTop })),
    "plane": () => import("lucide-react").then((m) => ({ default: m.Plane })),
    "radio": () => import("lucide-react").then((m) => ({ default: m.Radio })),
    "rocket": () => import("lucide-react").then((m) => ({ default: m.Rocket })),
    "search": () => import("lucide-react").then((m) => ({ default: m.Search })),
    "settings": () => import("lucide-react").then((m) => ({ default: m.Settings })),
    "shield": () => import("lucide-react").then((m) => ({ default: m.Shield })),
    "sparkles": () => import("lucide-react").then((m) => ({ default: m.Sparkles })),
    "trending-up": () => import("lucide-react").then((m) => ({ default: m.TrendingUp })),
    "user-check": () => import("lucide-react").then((m) => ({ default: m.UserCheck })),
    "user-circle": () => import("lucide-react").then((m) => ({ default: m.UserCircle })),
    "video": () => import("lucide-react").then((m) => ({ default: m.Video })),
    
    // Legacy categories (kept for backward compatibility)
    "sales-lead-gen": () => import("lucide-react").then((m) => ({ default: m.BarChart2 })),
    "content-marketing": () => import("lucide-react").then((m) => ({ default: m.FileText })),
    "video-audio-voice": () => import("lucide-react").then((m) => ({ default: m.Video })),
    "rag-knowledgebase": () => import("lucide-react").then((m) => ({ default: m.Database })),
    "realestate-local": () => import("lucide-react").then((m) => ({ default: m.Home })),
    "hr-hiring": () => import("lucide-react").then((m) => ({ default: m.UserCheck })),
    "finance-business": () => import("lucide-react").then((m) => ({ default: m.DollarSign })),
    "legal-compliance": () => import("lucide-react").then((m) => ({ default: m.Shield })),
    "coding-developer": () => import("lucide-react").then((m) => ({ default: m.Settings })),
    "design-uiux": () => import("lucide-react").then((m) => ({ default: m.Palette })),
    "research-education": () => import("lucide-react").then((m) => ({ default: m.Search })),
    "productivity-personal": () => import("lucide-react").then((m) => ({ default: m.UserCircle })),
    
    // Feature icons from featuresData.ts
    "wand-2": () => import("lucide-react").then((m) => ({ default: m.Wand2 })),
    "clock": () => import("lucide-react").then((m) => ({ default: m.Clock })),
    "layout-template": () => import("lucide-react").then((m) => ({ default: m.LayoutTemplate })),
    "pencil-ruler": () => import("lucide-react").then((m) => ({ default: m.PencilRuler })),
    
    // Specific apps
    "ai-personalized-content": () =>
      import("lucide-react").then((m) => ({ default: m.Sparkles })),
    "ai-referral-maximizer": () =>
      import("lucide-react").then((m) => ({ default: m.Megaphone })),
    "ai-sales-maximizer": () =>
      import("lucide-react").then((m) => ({ default: m.BarChart2 })),
    "ai-screen-recorder": () =>
      import("lucide-react").then((m) => ({ default: m.Monitor })),
    "smart-crm-closer": () =>
      import("lucide-react").then((m) => ({ default: m.Database })),
    "video-ai-editor": () =>
      import("lucide-react").then((m) => ({ default: m.Video })),
    "ai-video-image": () =>
      import("lucide-react").then((m) => ({ default: m.Image })),
    "ai-skills-monetizer": () =>
      import("lucide-react").then((m) => ({ default: m.DollarSign })),
    "ai-signature": () =>
      import("lucide-react").then((m) => ({ default: m.FileSignature })),
    "ai-template-generator": () =>
      import("lucide-react").then((m) => ({ default: m.LayoutTemplate })),
    "funnelcraft-ai": () =>
      import("lucide-react").then((m) => ({ default: m.BarChart2 })),
    "interactive-shopping": () =>
      import("lucide-react").then((m) => ({ default: m.ShoppingBag })),
    "personalizer-ai-profile-generator": () =>
      import("lucide-react").then((m) => ({ default: m.UserCircle })),
    "personalizer-ai-video-image-transformer": () =>
      import("lucide-react").then((m) => ({ default: m.Sparkles })),
    "personalizer-url-video-generation": () =>
      import("lucide-react").then((m) => ({ default: m.Video })),
    "ai-proposal": () =>
      import("lucide-react").then((m) => ({ default: m.FileText })),
    "sales-assistant-app": () =>
      import("lucide-react").then((m) => ({ default: m.Briefcase })),
    "sales-page-builder": () =>
      import("lucide-react").then((m) => ({ default: m.PanelTop })),

    // 15 New Dashboard Apps
    "ai-referral-maximizer-pro": () =>
      import("lucide-react").then((m) => ({ default: m.Megaphone })),
    "smart-crm-closer-pro": () =>
      import("lucide-react").then((m) => ({ default: m.Database })),
    "video-ai-editor-pro": () =>
      import("lucide-react").then((m) => ({ default: m.Video })),
    "ai-video-image-pro": () =>
      import("lucide-react").then((m) => ({ default: m.Image })),
    "ai-skills-monetizer-pro": () =>
      import("lucide-react").then((m) => ({ default: m.DollarSign })),
    "ai-signature-pro": () =>
      import("lucide-react").then((m) => ({ default: m.FileSignature })),
    "personalizer-profile-generator": () =>
      import("lucide-react").then((m) => ({ default: m.UserCircle })),
    "personalizer-transformer": () =>
      import("lucide-react").then((m) => ({ default: m.Sparkles })),
    "personalizer-url-templates": () =>
      import("lucide-react").then((m) => ({ default: m.LayoutTemplate })),
    "ai-proposal-generator": () =>
      import("lucide-react").then((m) => ({ default: m.FileText })),
    "sales-assistant-platform": () =>
      import("lucide-react").then((m) => ({ default: m.Briefcase })),
    "sales-page-builder-pro": () =>
      import("lucide-react").then((m) => ({ default: m.PanelTop })),
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

  // Get the icon loader or use fallback - memoized to prevent re-creating lazy component
  const iconLoader = useMemo(() => {
    return iconMap[iconName] || (() => Promise.resolve({ default: FallbackIcon }));
  }, [iconName]);

  // Create lazy component - memoized to prevent recreation on every render
  const IconComponent = useMemo(() => React.lazy(iconLoader), [iconLoader]);

  return (
    <Suspense fallback={<FallbackIcon className={className} size={size} />}>
      <IconComponent className={className} size={size} />
    </Suspense>
  );
};

export default LazyIcon;
