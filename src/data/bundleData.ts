import { App } from './appsData';

export interface Bundle {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  priceCents: number;
  apps: string[];
  image: string;
  features: string[];
  popular?: boolean;
}

export const bundles: Bundle[] = [
  {
    id: 'sales-lead-gen-bundle',
    name: 'Sales, Lead Gen & Prospecting Bundle',
    description: '10 AI-powered sales and lead generation tools for prospecting, outreach, and deal closing.',
    category: 'sales-lead-gen',
    price: 397,
    priceCents: 39700,
    apps: [
      'ai-sales-intelligence-pro',
      'lead-research-scraper-ai',
      'ai-business-growth-consultant',
      'ai-strategy-advisor',
      'ai-sales-email-writer',
      'ai-offer-decision-helper',
      'launch-campaign-builder-ai',
      'competitor-spy-ai',
      'ai-agency-builder-suite',
      'sales-call-follow-up-ai',
    ],
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    features: [
      'Lifetime access to all 10 apps',
      'All future updates included',
      'Priority customer support',
      'Commercial usage rights',
      'Save $573 vs buying individually ($970 value)',
      'Money-back guarantee',
    ],
    popular: true,
  },
  {
    id: 'content-marketing-bundle',
    name: 'Content Creation & Marketing Bundle',
    description: '11 AI-powered content creation and marketing tools for social media, blogs, video, and campaigns.',
    category: 'content-marketing',
    price: 397,
    priceCents: 39700,
    apps: [
      'blog-to-podcast-ai',
      'daily-content-engine-ai',
      'ai-content-creator-pro',
      'ai-content-editor',
      'ai-documentation-writer',
      'youtube-repurposer-ai',
      'newsletter-repurposer-ai',
      'ai-news-content-writer',
      'ai-video-script-producer',
      'ai-music-idea-generator',
    ],
    image: 'https://images.unsplash.com/photo-1499750310101-6cda608e867c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    features: [
      'Lifetime access to all 11 apps',
      'All future updates included',
      'Priority customer support',
      'Commercial usage rights',
      'Save $660 vs buying individually ($1,070 value)',
      'Money-back guarantee',
    ],
  },
  {
    id: 'video-audio-voice-bundle',
    name: 'Video, Audio & Voice Business Bundle',
    description: '11 AI-powered video, audio, and voice tools for content creation and business communication.',
    category: 'video-audio-voice',
    price: 397,
    priceCents: 39700,
    apps: [
      'ai-film-producer',
      'podcast-creator-ai',
      'news-to-podcast-ai',
      'ai-voice-support-agent',
      'talk-to-your-business-ai',
      'ai-audio-guide-creator',
      'ai-intake-voice-agent',
      'ai-dictation-assistant',
      'ai-music-jingle-assistant',
    ],
    image: 'https://images.unsplash.com/photo-1493711662062-fa9a0ceca13e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    features: [
      'Lifetime access to all 11 apps',
      'All future updates included',
      'Priority customer support',
      'Commercial usage rights',
      'Save $660 vs buying individually ($1,070 value)',
      'Money-back guarantee',
    ],
  },
  {
    id: 'rag-knowledgebase-bundle',
    name: 'RAG, Knowledgebase & Document Chat Bundle',
    description: '16 AI-powered tools for document analysis, knowledgebase creation, and intelligent Q&A.',
    category: 'rag-knowledgebase',
    price: 397,
    priceCents: 39700,
    apps: [
      'business-knowledgebase-ai',
      'pdf-business-assistant',
      'research-paper-assistant',
      'codebase-chat-ai',
      'gmail-intelligence-ai',
      'video-knowledge-assistant',
      'blog-knowledge-search-ai',
      'visual-document-ai',
      'citation-knowledgebase-ai',
      'smart-search-ai',
      'private-company-ai-assistant',
      'multimodal-knowledge-ai',
      'ai-knowledgebase-debugger',
    ],
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    features: [
      'Lifetime access to all 16 apps',
      'All future updates included',
      'Priority customer support',
      'Commercial usage rights',
      'Save $753 vs buying individually ($1,553 value)',
      'Money-back guarantee',
    ],
  },
  {
    id: 'realestate-local-bundle',
    name: 'Real Estate, Home Services & Local Business Bundle',
    description: '7 AI-powered tools for real estate marketing, home services, and local business growth.',
    category: 'realestate-local',
    price: 397,
    priceCents: 39700,
    apps: [
      'real-estate-marketing-ai',
      'home-renovation-visualizer-ai',
      'travel-planner-ai',
      'local-tour-guide-ai',
      'local-business-voice-assistant',
      'local-business-growth-advisor',
      'local-business-analytics-ai',
    ],
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    features: [
      'Lifetime access to all 7 apps',
      'All future updates included',
      'Priority customer support',
      'Commercial usage rights',
      'Save $283 vs buying individually ($683 value)',
      'Money-back guarantee',
    ],
  },
  {
    id: 'hr-hiring-bundle',
    name: 'HR, Hiring & Recruiting Bundle',
    description: '7 AI-powered tools for hiring, recruitment, and HR management.',
    category: 'hr-hiring',
    price: 397,
    priceCents: 39700,
    apps: [
      'ai-hiring-assistant',
      'resume-analyzer-ai',
      'candidate-decision-ai',
      'candidate-outreach-ai',
      'interview-summary-ai',
      'hiring-plan-builder',
    ],
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    features: [
      'Lifetime access to all 7 apps',
      'All future updates included',
      'Priority customer support',
      'Commercial usage rights',
      'Save $283 vs buying individually ($683 value)',
      'Money-back guarantee',
    ],
  },
  {
    id: 'finance-business-bundle',
    name: 'Finance, Business Planning & Investment Bundle',
    description: '7 AI-powered financial analysis and business planning tools.',
    category: 'finance-business',
    price: 397,
    priceCents: 39700,
    apps: [
      'finance-research-ai',
      'business-finance-ai-team',
      'profit-coach-ai',
      'investment-research-assistant',
      'startup-due-diligence-ai',
      'revenue-data-analyst-ai',
      'financial-dashboard-ai',
    ],
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    features: [
      'Lifetime access to all 7 apps',
      'All future updates included',
      'Priority customer support',
      'Commercial usage rights',
      'Save $283 vs buying individually ($683 value)',
      'Money-back guarantee',
    ],
  },
  {
    id: 'legal-compliance-bundle',
    name: 'Legal, Compliance & Risk Bundle',
    description: '6 AI-powered legal analysis and compliance tools.',
    category: 'legal-compliance',
    price: 397,
    priceCents: 39700,
    apps: [
      'contract-summary-ai',
      'legal-pdf-explainer',
      'policy-compliance-assistant',
      'claim-checker-ai',
      'fraud-investigation-assistant',
      'risk-decision-ai',
    ],
    image: 'https://images.unsplash.com/photo-1589578527967-67ecab9b246d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    features: [
      'Lifetime access to all 6 apps',
      'All future updates included',
      'Priority customer support',
      'Commercial usage rights',
      'Save $226 vs buying individually ($586 value)',
      'Money-back guarantee',
    ],
  },
  {
    id: 'coding-developer-bundle',
    name: 'Coding, Developer & SaaS Builder Bundle',
    description: '12 AI-powered development tools for app building, coding, and SaaS creation.',
    category: 'coding-developer',
    price: 397,
    priceCents: 39700,
    apps: [
      'ai-app-builder-assistant',
      'ai-saas-architect',
      'ai-code-review-pro',
      'ai-bug-fixer',
      'ai-fullstack-builder',
      'python-fixer-ai',
      'github-repo-assistant',
      'github-automation-agent',
      'build-plan-generator',
      'sprint-planner-ai',
    ],
    image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    features: [
      'Lifetime access to all 12 apps',
      'All future updates included',
      'Priority customer support',
      'Commercial usage rights',
      'Save $774 vs buying individually ($1,174 value)',
      'Money-back guarantee',
    ],
  },
  {
    id: 'design-uiux-bundle',
    name: 'Design, UI/UX & Landing Page Bundle',
    description: '6 AI-powered design tools for UI/UX, branding, and landing pages.',
    category: 'design-uiux',
    price: 397,
    priceCents: 39700,
    apps: [
      'ai-design-studio',
      'landing-page-critic-ai',
      'ai-ux-designer',
      'dashboard-designer-ai',
      'landing-page-copy-ai',
      'conversion-copy-editor',
    ],
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    features: [
      'Lifetime access to all 6 apps',
      'All future updates included',
      'Priority customer support',
      'Commercial usage rights',
      'Save $226 vs buying individually ($586 value)',
      'Money-back guarantee',
    ],
  },
  {
    id: 'research-education-bundle',
    name: 'Research, Education & Training Bundle',
    description: '11 AI-powered research and educational tools for learning and content creation.',
    category: 'research-education',
    price: 397,
    priceCents: 39700,
    apps: [
      'research-assistant-ai',
      'deep-research-pro',
      'research-planner-ai',
      'ai-course-creator-assistant',
      'academic-research-ai',
      'market-research-ai',
      'fact-check-ai',
      'research-memory-assistant',
    ],
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    features: [
      'Lifetime access to all 11 apps',
      'All future updates included',
      'Priority customer support',
      'Commercial usage rights',
      'Save $660 vs buying individually ($1,070 value)',
      'Money-back guarantee',
    ],
  },
  {
    id: 'productivity-personal-bundle',
    name: 'Productivity, Memory & Personal Assistant Bundle',
    description: '14 AI-powered productivity and personal assistant tools.',
    category: 'productivity-personal',
    price: 397,
    priceCents: 39700,
    apps: [
      'personal-ai-memory-assistant',
      'multi-ai-memory-hub',
      'private-ai-chat-with-memory',
      'private-chatgpt-clone',
      'travel-concierge-ai',
      'browser-task-agent',
      'ai-tool-router',
      'notion-workspace-ai',
      'email-memory-assistant',
    ],
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    features: [
      'Lifetime access to all 14 apps',
      'All future updates included',
      'Priority customer support',
      'Commercial usage rights',
      'Save $900 vs buying individually ($1,300 value)',
      'Money-back guarantee',
    ],
  },
];

export const getBundleById = (id: string): Bundle | undefined => {
  return bundles.find(bundle => bundle.id === id);
};

export const getBundlesByCategory = (category: string): Bundle[] => {
  return bundles.filter(bundle => bundle.category === category);
};

// Helper exports for Admin User Access Management

export const getBundleApps = (bundleId: string): string[] => {
  const bundle = bundles.find(b => b.id === bundleId);
  return bundle ? bundle.apps : [];
};

export const getAllBundleIds = (): string[] => {
  return bundles.map(bundle => bundle.id);
};

export const getBundleForApp = (appSlug: string): Bundle | undefined => {
  return bundles.find(bundle => bundle.apps.includes(appSlug));
};

export const getTotalAppCount = (): number => {
  // Get unique app slugs from all bundles (since bundles define all available apps)
  const allApps = new Set<string>();
  bundles.forEach(bundle => {
    bundle.apps.forEach(app => allApps.add(app));
  });
  return allApps.size;
};

// Bundle icons/colors for UI
export const bundleIcons: Record<string, { icon: string; color: string; bgColor: string }> = {
  'sales-lead-gen': { icon: '💰', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  'content-marketing': { icon: '📝', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  'video-audio-voice': { icon: '🎬', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  'rag-knowledgebase': { icon: '📚', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  'realestate-local': { icon: '🏠', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  'hr-hiring': { icon: '👥', color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
  'finance-business': { icon: '📊', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  'legal-compliance': { icon: '⚖️', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  'coding-developer': { icon: '💻', color: 'text-indigo-400', bgColor: 'bg-indigo-500/20' },
  'design-uiux': { icon: '🎨', color: 'text-rose-400', bgColor: 'bg-rose-500/20' },
  'research-education': { icon: '🔬', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  'productivity-personal': { icon: '⚡', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
};