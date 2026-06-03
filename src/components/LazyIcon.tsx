import React, { lazy, Suspense, ComponentType } from "react";
import { Sparkles } from "lucide-react";

// Icon mapping with lazy loading
const iconMap: Record<string, () => Promise<{ default: ComponentType<any> }>> =
  {
    // Categories
    video: () => import("lucide-react").then((m) => ({ default: m.Video })),
    "lead-gen": () =>
      import("lucide-react").then((m) => ({ default: m.Users })),
    "ai-image": () =>
      import("lucide-react").then((m) => ({ default: m.Image })),
    branding: () =>
      import("lucide-react").then((m) => ({ default: m.Palette })),
    personalizer: () =>
      import("lucide-react").then((m) => ({ default: m.UserCircle })),
    creative: () =>
      import("lucide-react").then((m) => ({ default: m.Package })),
    content: () =>
      import("lucide-react").then((m) => ({ default: m.Sparkles })),
    visual: () => import("lucide-react").then((m) => ({ default: m.Image })),
    sales: () => import("lucide-react").then((m) => ({ default: m.BarChart2 })),
    page: () => import("lucide-react").then((m) => ({ default: m.PanelTop })),
    client: () =>
      import("lucide-react").then((m) => ({ default: m.UserCheck })),
    communication: () =>
      import("lucide-react").then((m) => ({ default: m.MessageSquare })),
    ai: () => import("lucide-react").then((m) => ({ default: m.Sparkles })),

    // Specific apps
    "ai-personalized-content": () =>
      import("lucide-react").then((m) => ({ default: m.Sparkles })),
    "ai-strategy-advisor": () =>
      import("lucide-react").then((m) => ({ default: m.Megaphone })),
    "ai-sales-email-writer-maximizer": () =>
      import("lucide-react").then((m) => ({ default: m.BarChart2 })),
    "ai-screen-recorder": () =>
      import("lucide-react").then((m) => ({ default: m.Monitor })),
    "ai-offer-decision-helper": () =>
      import("lucide-react").then((m) => ({ default: m.Database })),
    "lead-research-scraper-ai": () =>
      import("lucide-react").then((m) => ({ default: m.Video })),
    "ai-business-growth-consultant": () =>
      import("lucide-react").then((m) => ({ default: m.Image })),
    "daily-content-engine-ai": () =>
      import("lucide-react").then((m) => ({ default: m.DollarSign })),
    "ai-content-creator-pro": () =>
      import("lucide-react").then((m) => ({ default: m.FileSignature })),
    "ai-content-editor": () =>
      import("lucide-react").then((m) => ({ default: m.LayoutTemplate })),
    "launch-campaign-builder-ai": () =>
      import("lucide-react").then((m) => ({ default: m.BarChart2 })),
    "interactive-shopping": () =>
      import("lucide-react").then((m) => ({ default: m.ShoppingBag })),
    "personalizer-ai-profile-generator": () =>
      import("lucide-react").then((m) => ({ default: m.UserCircle })),
    "personalizer-ai-business-growth-consultant-transformer": () =>
      import("lucide-react").then((m) => ({ default: m.Sparkles })),
    "newsletter-repurposer-ai": () =>
      import("lucide-react").then((m) => ({ default: m.Video })),
    "competitor-spy-ai": () =>
      import("lucide-react").then((m) => ({ default: m.FileText })),
    "ai-agency-builder-suite": () =>
      import("lucide-react").then((m) => ({ default: m.Briefcase })),
    "sales-call-follow-up-ai": () =>
      import("lucide-react").then((m) => ({ default: m.PanelTop })),

    // 15 New Dashboard Apps
    "ai-strategy-advisor-pro": () =>
      import("lucide-react").then((m) => ({ default: m.Megaphone })),
    "ai-offer-decision-helper-pro": () =>
      import("lucide-react").then((m) => ({ default: m.Database })),
    "lead-research-scraper-ai-pro": () =>
      import("lucide-react").then((m) => ({ default: m.Video })),
    "ai-business-growth-consultant-pro": () =>
      import("lucide-react").then((m) => ({ default: m.Image })),
    "daily-content-engine-ai-pro": () =>
      import("lucide-react").then((m) => ({ default: m.DollarSign })),
    "ai-content-creator-pro-pro": () =>
      import("lucide-react").then((m) => ({ default: m.FileSignature })),
    "ai-documentation-writer-generator": () =>
      import("lucide-react").then((m) => ({ default: m.UserCircle })),
    "personalizer-transformer": () =>
      import("lucide-react").then((m) => ({ default: m.Sparkles })),
    "personalizer-url-templates": () =>
      import("lucide-react").then((m) => ({ default: m.LayoutTemplate })),
    "competitor-spy-ai-generator": () =>
      import("lucide-react").then((m) => ({ default: m.FileText })),
    "sales-assistant-platform": () =>
      import("lucide-react").then((m) => ({ default: m.Briefcase })),
    "sales-call-follow-up-ai-pro": () =>
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
  const IconComponent = React.lazy(
    iconMap[name] || (() => Promise.resolve({ default: Sparkles })),
  );

  return (
    <Suspense fallback={<Sparkles className={className} size={size} />}>
      <IconComponent className={className} size={size} />
    </Suspense>
  );
};

export default LazyIcon;
