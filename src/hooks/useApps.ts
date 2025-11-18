import React, { useState, useEffect } from 'react';
import {
  Video,
  Users,
  Image as ImageIcon,
  Sparkles,
  Palette,
  UserCircle,
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
  FileSignature,
  LayoutTemplate,
  ShoppingBag,
  Store,
  UserCheck,
  Rocket,
  Settings,
  BarChart2,
  Briefcase,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { getAppUrl as getCentralizedAppUrl, isExternalUrl } from '../config/appUrls';

interface DatabaseApp {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  image?: string;
  icon?: string;
  netlify_url?: string;
  custom_domain?: string;
  is_active: boolean;
  is_featured: boolean;
  popular?: boolean;
  new?: boolean;
  coming_soon?: boolean;
  price?: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface ComponentApp {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  image: string;
  popular?: boolean;
  new?: boolean;
  comingSoon?: boolean;
  url?: string;
}

// Icon mapping based on category or app slug
const getIconForApp = (app: DatabaseApp): React.ReactNode => {
  const iconMap: { [key: string]: React.ComponentType<any> } = {
    // Categories
    'video': Video,
    'lead-gen': Users,
    'ai-image': ImageIcon,
    'branding': Palette,
    'personalizer': UserCircle,
    'creative': Package,
    'content': Sparkles,
    'visual': ImageIcon,
    'sales': BarChart2,
    'page': PanelTop,
    'client': UserCheck,
    'communication': MessageSquare,
    'ai': Sparkles,

    // Specific apps
    'ai-personalized-content': Sparkles,
    'ai-referral-maximizer': Megaphone,
    'ai-sales-maximizer': BarChart2,
    'ai-screen-recorder': Monitor,
    'smart-crm-closer': Database,
    'video-ai-editor': Video,
    'ai-video-image': ImageIcon,
    'ai-skills-monetizer': DollarSign,
    'ai-signature': FileSignature,
    'ai-template-generator': LayoutTemplate,
    'funnelcraft-ai': BarChart2,
    'interactive-shopping': ShoppingBag,
    'personalizer-ai-profile-generator': UserCircle,
    'personalizer-ai-video-image-transformer': Sparkles,
    'personalizer-url-video-generation': Video,
    'ai-proposal': FileText,
    'sales-assistant-app': Briefcase,
    'sales-page-builder': PanelTop,

    // 15 New Dashboard Apps
    'ai-referral-maximizer-pro': Megaphone,
    'smart-crm-closer-pro': Database,
    'video-ai-editor-pro': Video,
    'ai-video-image-pro': ImageIcon,
    'ai-skills-monetizer-pro': DollarSign,
    'ai-signature-pro': FileSignature,
    'personalizer-profile-generator': UserCircle,
    'personalizer-transformer': Sparkles,
    'personalizer-url-templates': LayoutTemplate,
    'ai-proposal-generator': FileText,
    'sales-assistant-platform': Briefcase,
    'sales-page-builder-pro': PanelTop
  };

  const IconComponent = iconMap[app.slug] || iconMap[app.category] || Sparkles;
  return React.createElement(IconComponent, { className: "h-6 w-6" });
};

// Transform database app to component app
const transformApp = (dbApp: DatabaseApp): ComponentApp => {
  // URL Priority Order:
  // 1. Database custom_domain (highest priority)
  // 2. Database netlify_url
  // 3. Centralized APP_URLS config (from appUrls.ts)
  // 4. Fallback to internal route
  let appUrl: string;

  if (dbApp.custom_domain) {
    appUrl = dbApp.custom_domain;
  } else if (dbApp.netlify_url) {
    appUrl = dbApp.netlify_url;
  } else {
    // Use centralized config, which will return internal route if not found
    appUrl = getCentralizedAppUrl(dbApp.slug);
  }

  return {
    id: dbApp.slug,
    name: dbApp.name,
    description: dbApp.description || '',
    category: dbApp.category,
    icon: getIconForApp(dbApp),
    image: dbApp.image || 'https://images.unsplash.com/photo-1616469829941-c7200edec809?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    popular: dbApp.popular || dbApp.is_featured,
    new: dbApp.new || false,
    comingSoon: dbApp.coming_soon || false,
    url: appUrl
  };
};

export const useApps = () => {
  const [apps, setApps] = useState<ComponentApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApps = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('apps')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (supabaseError) {
        throw supabaseError;
      }

      if (data) {
        const transformedApps = data.map(transformApp);
        setApps(transformedApps);
      }
    } catch (err) {
      console.error('Error fetching apps:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setApps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  return {
    apps,
    loading,
    error,
    refetch: fetchApps
  };
};