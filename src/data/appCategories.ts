export interface AppCategory {
  id: string;
  name: string;
  description: string;
  offerAngle: string;
  buyerPersona: string;
  icon: string; // lucide icon name
}

export const appCategories: AppCategory[] = [
  {
    id: 'content-creation',
    name: 'Content Creation',
    description: 'AI-powered tools for generating engaging video, text, and image content at scale.',
    offerAngle: 'Create viral content in minutes with AI assistance',
    buyerPersona: 'Content creators, marketers, social media managers',
    icon: 'Video'
  },
  {
    id: 'email-marketing',
    name: 'Email Marketing & Automation',
    description: 'Platforms for designing, sending, and automating email campaigns to nurture leads and customers.',
    offerAngle: 'Boost engagement with personalized email journeys',
    buyerPersona: 'Email marketers, small business owners, e-commerce managers',
    icon: 'Mail'
  },
  {
    id: 'social-media',
    name: 'Social Media Management',
    description: 'Tools for scheduling, analyzing, and managing social media presence across multiple platforms.',
    offerAngle: 'Grow your audience with smart social scheduling',
    buyerPersona: 'Social media managers, influencers, brand managers',
    icon: 'Share2'
  },
  {
    id: 'sales-funnels',
    name: 'Sales Funnel Builder',
    description: 'Software for creating high-converting landing pages, checkout flows, and automated sales processes.',
    offerAngle: 'Turn visitors into customers with optimized funnels',
    buyerPersona: 'Entrepreneurs, marketers, course creators, coaches',
    icon: 'TrendingUp'
  },
  {
    id: 'lead-generation',
    name: 'Lead Generation & Prospecting',
    description: 'Solutions for finding, capturing, and qualifying leads through various channels and data sources.',
    offerAngle: 'Fill your pipeline with high-quality leads automatically',
    buyerPersona: 'Sales teams, business development, marketing agencies',
    icon: 'Target'
  },
  {
    id: 'marketing-automation',
    name: 'Marketing Automation',
    description: 'Platforms that automate repetitive marketing tasks and workflows across email, social, and more.',
    offerAngle: 'Streamline your marketing with intelligent automation',
    buyerPersona: 'Marketing managers, growth hackers, automation specialists',
    icon: 'Zap'
  },
  {
    id: 'data-analytics',
    name: 'Analytics & Insights',
    description: 'Tools for tracking, analyzing, and visualizing marketing and business performance data.',
    offerAngle: 'Make data-driven decisions with real-time insights',
    buyerPersona: 'Data analysts, marketers, business owners, growth teams',
    icon: 'BarChart3'
  },
  {
    id: 'client-management',
    name: 'Client Management & CRM',
    description: 'Customer relationship management systems for organizing client interactions and sales pipelines.',
    offerAngle: 'Keep your client relationships organized and thriving',
    buyerPersona: 'Sales teams, account managers, service providers, freelancers',
    icon: 'Users'
  },
  {
    id: 'local-seo',
    name: 'Local SEO & Reviews',
    description: 'Software for improving local search visibility and managing online reputation and reviews.',
    offerAngle: 'Get found by local customers and build trust',
    buyerPersona: 'Local businesses, agencies, franchise owners, marketers',
    icon: 'MapPin'
  },
  {
    id: 'booking-systems',
    name: 'Booking & Scheduling',
    description: 'Tools for managing appointments, reservations, and scheduling with calendar integration and payments.',
    offerAngle: 'Never miss an appointment with automated booking',
    buyerPersona: 'Service providers, consultants, coaches, salons, clinics',
    icon: 'CalendarCheck'
  },
  {
    id: 'course-creation',
    name: 'Course Creation & Memberships',
    description: 'Platforms for building, hosting, and selling online courses, membership sites, and digital products.',
    offerAngle: 'Monetize your knowledge with professional course platforms',
    buyerPersona: 'Educators, coaches, experts, entrepreneurs, trainers',
    icon: 'GraduationCap'
  },
  {
    id: 'virtual-tours',
    name: 'Virtual Tours & 3D',
    description: 'Solutions for creating immersive 3D virtual tours, walkthroughs, and interactive property showcases.',
    offerAngle: 'Showcase spaces with stunning virtual experiences',
    buyerPersona: 'Real estate agents, property managers, architects, hotels, venues',
    icon: 'Globe'
  }
];