import React, { lazy, Suspense, ComponentType } from 'react';
import { Sparkles } from 'lucide-react';

// Icon mapping with lazy loading
const iconMap: Record<string, () => Promise<{ default: ComponentType<any> }>> = {
  // Categories
  'video': () => import('lucide-react').then(m => ({ default: m.Video })),
  'lead-gen': () => import('lucide-react').then(m => ({ default: m.Users })),
  'ai-image': () => import('lucide-react').then(m => ({ default: m.Image })),
  'branding': () => import('lucide-react').then(m => ({ default: m.Palette })),
  'personalizer': () => import('lucide-react').then(m => ({ default: m.UserCircle })),
  'creative': () => import('lucide-react').then(m => ({ default: m.Package })),
  'content': () => import('lucide-react').then(m => ({ default: m.Sparkles })),
  'visual': () => import('lucide-react').then(m => ({ default: m.Image })),
  'sales': () => import('lucide-react').then(m => ({ default: m.BarChart2 })),
  'page': () => import('lucide-react').then(m => ({ default: m.PanelTop })),
  'client': () => import('lucide-react').then(m => ({ default: m.UserCheck })),
  'communication': () => import('lucide-react').then(m => ({ default: m.MessageSquare })),
  'ai': () => import('lucide-react').then(m => ({ default: m.Sparkles })),

  // Specific apps
  'ai-personalized-content': () => import('lucide-react').then(m => ({ default: m.Sparkles })),
  'ai-referral-maximizer': () => import('lucide-react').then(m => ({ default: m.Megaphone })),
  'ai-sales-maximizer': () => import('lucide-react').then(m => ({ default: m.BarChart2 })),
  'ai-screen-recorder': () => import('lucide-react').then(m => ({ default: m.Monitor })),
  'smart-crm-closer': () => import('lucide-react').then(m => ({ default: m.Database })),
  'video-ai-editor': () => import('lucide-react').then(m => ({ default: m.Video })),
  'ai-video-image': () => import('lucide-react').then(m => ({ default: m.Image })),
  'ai-skills-monetizer': () => import('lucide-react').then(m => ({ default: m.DollarSign })),
  'ai-signature': () => import('lucide-react').then(m => ({ default: m.FileSignature })),
  'ai-template-generator': () => import('lucide-react').then(m => ({ default: m.LayoutTemplate })),
  'funnelcraft-ai': () => import('lucide-react').then(m => ({ default: m.BarChart2 })),
  'interactive-shopping': () => import('lucide-react').then(m => ({ default: m.ShoppingBag })),
  'personalizer-ai-profile-generator': () => import('lucide-react').then(m => ({ default: m.UserCircle })),
  'personalizer-ai-video-image-transformer': () => import('lucide-react').then(m => ({ default: m.Sparkles })),
  'personalizer-url-video-generation': () => import('lucide-react').then(m => ({ default: m.Video })),
  'ai-proposal': () => import('lucide-react').then(m => ({ default: m.FileText })),
  'sales-assistant-app': () => import('lucide-react').then(m => ({ default: m.Briefcase })),
  'sales-page-builder': () => import('lucide-react').then(m => ({ default: m.PanelTop })),

  // 15 New Dashboard Apps
  'ai-referral-maximizer-pro': () => import('lucide-react').then(m => ({ default: m.Megaphone })),
  'smart-crm-closer-pro': () => import('lucide-react').then(m => ({ default: m.Database })),
  'video-ai-editor-pro': () => import('lucide-react').then(m => ({ default: m.Video })),
  'ai-video-image-pro': () => import('lucide-react').then(m => ({ default: m.Image })),
  'ai-skills-monetizer-pro': () => import('lucide-react').then(m => ({ default: m.DollarSign })),
  'ai-signature-pro': () => import('lucide-react').then(m => ({ default: m.FileSignature })),
  'personalizer-profile-generator': () => import('lucide-react').then(m => ({ default: m.UserCircle })),
  'personalizer-transformer': () => import('lucide-react').then(m => ({ default: m.Sparkles })),
  'personalizer-url-templates': () => import('lucide-react').then(m => ({ default: m.LayoutTemplate })),
  'ai-proposal-generator': () => import('lucide-react').then(m => ({ default: m.FileText })),
  'sales-assistant-platform': () => import('lucide-react').then(m => ({ default: m.Briefcase })),
  'sales-page-builder-pro': () => import('lucide-react').then(m => ({ default: m.PanelTop }))
};

interface LazyIconProps {
  name: string;
  className?: string;
  size?: number;
}

const LazyIcon: React.FC<LazyIconProps> = ({ name, className = "h-6 w-6", size }) => {
  const IconComponent = React.lazy(iconMap[name] || (() => Promise.resolve({ default: Sparkles })));

  return (
    <Suspense fallback={<Sparkles className={className} size={size} />}>
      <IconComponent className={className} size={size} />
    </Suspense>
  );
};

export default LazyIcon;