import React from "react";
import {
  Bot,
  Brain,
  Code,
  FileText,
  Image as ImageIcon,
  Mic,
  Search,
  Video,
  Zap,
  MessageSquare,
  BarChart3,
  Calculator,
  Camera,
  Database,
  Globe,
  Heart,
  Lightbulb,
  Mail,
  Music,
  Palette,
  Phone,
  PieChart,
  Shield,
  Star,
  Target,
  TrendingUp,
  Users,
  Wand2,
} from "lucide-react";

export interface StreamlitApp {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  image: string;
  price: number;
  features: string[];
  longDescription?: string;
  demoImage?: string;
  tags?: string[];
  complexity?: 'basic' | 'intermediate' | 'advanced';
  estimatedUsage?: string;
  popular?: boolean;
  new?: boolean;
  rating?: number;
  userCount?: number;
}

// Icon mapping for different app categories
const categoryIcons: Record<string, React.ReactNode> = {
  'ai-reasoning': <Brain className="h-6 w-6" />,
  'ai-chat': <MessageSquare className="h-6 w-6" />,
  'ai-image': <ImageIcon className="h-6 w-6" />,
  'ai-audio': <Mic className="h-6 w-6" />,
  'ai-video': <Video className="h-6 w-6" />,
  'data-analysis': <BarChart3 className="h-6 w-6" />,
  'data-visualization': <PieChart className="h-6 w-6" />,
  'machine-learning': <Bot className="h-6 w-6" />,
  'nlp': <FileText className="h-6 w-6" />,
  'computer-vision': <Camera className="h-6 w-6" />,
  'automation': <Zap className="h-6 w-6" />,
  'productivity': <Target className="h-6 w-6" />,
  'business': <TrendingUp className="h-6 w-6" />,
  'education': <Lightbulb className="h-6 w-6" />,
  'healthcare': <Heart className="h-6 w-6" />,
  'finance': <Calculator className="h-6 w-6" />,
  'marketing': <Mail className="h-6 w-6" />,
  'music': <Music className="h-6 w-6" />,
  'design': <Palette className="h-6 w-6" />,
  'security': <Shield className="h-6 w-6" />,
  'database': <Database className="h-6 w-6" />,
  'api': <Globe className="h-6 w-6" />,
  'communication': <Phone className="h-6 w-6" />,
  'social': <Users className="h-6 w-6" />,
  'entertainment': <Star className="h-6 w-6" />,
};

// Default app data structure for Streamlit apps
const streamlitAppsData: StreamlitApp[] = [
  // AI Reasoning & Chat Apps
  {
    id: "ai-reasoning-agent",
    name: "AI Reasoning Agent",
    description: "Advanced AI agent capable of complex reasoning and problem-solving tasks",
    category: "ai-reasoning",
    icon: categoryIcons['ai-reasoning'],
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-reasoning-agent-thumbnail.png",
    price: 29,
    features: [
      "Complex multi-step reasoning",
      "Problem decomposition",
      "Logical inference capabilities",
      "Context-aware responses",
      "Custom reasoning strategies"
    ],
    longDescription: "An intelligent AI agent that excels at breaking down complex problems, analyzing multiple perspectives, and providing well-reasoned solutions. Perfect for research, analysis, and strategic planning.",
    complexity: "intermediate",
    estimatedUsage: "Research & Analysis",
    popular: true,
    rating: 4.8,
    userCount: 450
  },

  {
    id: "ai-chat-with-pdf",
    name: "AI PDF Chat Assistant",
    description: "Interactive AI that can read and discuss PDF documents with you",
    category: "ai-chat",
    icon: categoryIcons['ai-chat'],
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-pdf-chat-thumbnail.png",
    price: 39,
    features: [
      "PDF document analysis",
      "Contextual Q&A",
      "Document summarization",
      "Multi-document comparison",
      "Citation tracking"
    ],
    longDescription: "Upload PDF documents and have intelligent conversations about their content. Ask questions, get summaries, and explore complex documents with AI-powered assistance.",
    complexity: "basic",
    estimatedUsage: "Document Analysis",
    new: true,
    rating: 4.7,
    userCount: 320
  },

  // Data Analysis & Visualization
  {
    id: "ai-data-analyst",
    name: "AI Data Analyst Pro",
    description: "Comprehensive data analysis and visualization with AI insights",
    category: "data-analysis",
    icon: categoryIcons['data-analysis'],
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-data-analyst-thumbnail.png",
    price: 49,
    features: [
      "Automated data cleaning",
      "Statistical analysis",
      "Interactive visualizations",
      "Predictive modeling",
      "AI-powered insights",
      "Export capabilities"
    ],
    longDescription: "Transform raw data into actionable insights with AI-powered analysis. Generate visualizations, run statistical tests, and uncover hidden patterns in your data.",
    complexity: "intermediate",
    estimatedUsage: "Business Intelligence",
    popular: true,
    rating: 4.9,
    userCount: 680
  },

  {
    id: "ai-data-visualization",
    name: "Advanced Data Visualizer",
    description: "Create stunning data visualizations with AI assistance",
    category: "data-visualization",
    icon: categoryIcons['data-visualization'],
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-data-viz-thumbnail.png",
    price: 35,
    features: [
      "AI-suggested chart types",
      "Interactive dashboards",
      "Custom styling options",
      "Real-time data updates",
      "Export to multiple formats",
      "Collaboration features"
    ],
    longDescription: "Create beautiful, interactive data visualizations with the help of AI. Get intelligent suggestions for the best chart types and styling options for your data.",
    complexity: "basic",
    estimatedUsage: "Data Presentation",
    rating: 4.6,
    userCount: 290
  },

  // AI Content Creation
  {
    id: "ai-content-creator",
    name: "AI Content Generator",
    description: "Generate high-quality content for blogs, social media, and marketing",
    category: "ai-chat",
    icon: categoryIcons['ai-chat'],
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-content-creator-thumbnail.png",
    price: 45,
    features: [
      "Multi-platform content generation",
      "SEO optimization",
      "Brand voice consistency",
      "Content repurposing",
      "Performance analytics",
      "Bulk content creation"
    ],
    longDescription: "Generate engaging content for all your marketing channels. From blog posts to social media updates, create content that resonates with your audience.",
    complexity: "intermediate",
    estimatedUsage: "Content Marketing",
    popular: true,
    rating: 4.8,
    userCount: 520
  },

  // Image & Video Processing
  {
    id: "ai-image-processor",
    name: "AI Image Enhancement Suite",
    description: "Professional image editing and enhancement powered by AI",
    category: "ai-image",
    icon: categoryIcons['ai-image'],
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-image-processor-thumbnail.png",
    price: 55,
    features: [
      "Automatic image enhancement",
      "Background removal",
      "Color correction",
      "Resolution upscaling",
      "Batch processing",
      "Style transfer"
    ],
    longDescription: "Transform your images with professional-grade AI enhancement. Improve quality, remove backgrounds, and apply artistic styles with just a few clicks.",
    complexity: "intermediate",
    estimatedUsage: "Photo Editing",
    new: true,
    rating: 4.7,
    userCount: 380
  },

  // Business & Productivity
  {
    id: "ai-business-analyst",
    name: "AI Business Intelligence",
    description: "Comprehensive business analysis and strategic planning with AI",
    category: "business",
    icon: categoryIcons['business'],
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-business-analyst-thumbnail.png",
    price: 69,
    features: [
      "Market analysis",
      "Competitor intelligence",
      "Financial modeling",
      "Strategic planning",
      "Risk assessment",
      "Performance forecasting"
    ],
    longDescription: "Make data-driven business decisions with AI-powered analysis. Get insights into market trends, competitor strategies, and business performance.",
    complexity: "advanced",
    estimatedUsage: "Business Strategy",
    popular: true,
    rating: 4.9,
    userCount: 240
  },

  // Specialized AI Apps
  {
    id: "ai-health-advisor",
    name: "AI Health & Wellness Coach",
    description: "Personalized health and wellness guidance powered by AI",
    category: "healthcare",
    icon: categoryIcons['healthcare'],
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-health-advisor-thumbnail.png",
    price: 39,
    features: [
      "Personalized wellness plans",
      "Nutrition guidance",
      "Exercise recommendations",
      "Health tracking",
      "Mental wellness support",
      "Progress monitoring"
    ],
    longDescription: "Get personalized health and wellness advice tailored to your goals and lifestyle. Track progress and receive ongoing support for your wellness journey.",
    complexity: "basic",
    estimatedUsage: "Personal Health",
    rating: 4.6,
    userCount: 180
  },

  {
    id: "ai-financial-planner",
    name: "AI Financial Advisor",
    description: "Intelligent financial planning and investment guidance",
    category: "finance",
    icon: categoryIcons['finance'],
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-financial-planner-thumbnail.png",
    price: 59,
    features: [
      "Investment analysis",
      "Risk assessment",
      "Portfolio optimization",
      "Retirement planning",
      "Tax optimization",
      "Market insights"
    ],
    longDescription: "Make informed financial decisions with AI-powered analysis of your investments, expenses, and financial goals. Get personalized financial advice and planning.",
    complexity: "intermediate",
    estimatedUsage: "Personal Finance",
    rating: 4.8,
    userCount: 310
  }
];

// Helper functions
export const getStreamlitAppById = (id: string): StreamlitApp | undefined => {
  return streamlitAppsData.find(app => app.id === id);
};

export const getStreamlitAppsByCategory = (category: string): StreamlitApp[] => {
  return streamlitAppsData.filter(app => app.category === category);
};

export const getPopularStreamlitApps = (): StreamlitApp[] => {
  return streamlitAppsData.filter(app => app.popular);
};

export const getNewStreamlitApps = (): StreamlitApp[] => {
  return streamlitAppsData.filter(app => app.new);
};

export const searchStreamlitApps = (query: string): StreamlitApp[] => {
  const lowercaseQuery = query.toLowerCase();
  return streamlitAppsData.filter(app =>
    app.name.toLowerCase().includes(lowercaseQuery) ||
    app.description.toLowerCase().includes(lowercaseQuery) ||
    app.category.toLowerCase().includes(lowercaseQuery) ||
    app.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
};

export const getStreamlitCategories = (): string[] => {
  return [...new Set(streamlitAppsData.map(app => app.category))];
};

export const getStreamlitAppStats = () => {
  return {
    totalApps: streamlitAppsData.length,
    totalUsers: streamlitAppsData.reduce((sum, app) => sum + (app.userCount || 0), 0),
    averageRating: streamlitAppsData.reduce((sum, app) => sum + (app.rating || 0), 0) / streamlitAppsData.length,
    categories: getStreamlitCategories().length
  };
};

export { streamlitAppsData };