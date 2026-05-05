import React, { useState, useEffect, useRef } from 'react';
import { X, Star, CheckCircle, TrendingUp, Users, Zap, Target, DollarSign } from 'lucide-react';
import { motion, useScroll, useTransform, useMotionValue } from 'framer-motion';

interface ExtendedSalesCopy {
  heroHeadline: string;
  subheadline: string;
  whatItDoes: string;
  howToProfit: {
    localBusiness: string;
    individual: string;
  };
  whyYouNeedIt: string;
  howItWorks: string;
  features: string[];
  testimonials: string[];
  pricing: {
    starter: string;
    pro: string;
    enterprise: string;
  };
  cta: string;
}

interface ProductDetailModalProps {
  app: {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: string;
    extendedCopy?: ExtendedSalesCopy;
  };
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (appId: string) => void;
}

const CATEGORY_COLORS = {
  'AI Tools': {
    primary: '#1e40af', // blue-800
    secondary: '#3b82f6', // blue-500
    accent1: '#60a5fa', // blue-400
    accent2: '#93c5fd', // blue-300
    accent3: '#dbeafe', // blue-100
    accent4: '#eff6ff', // blue-50
  },
  'RAG Tools': {
    primary: '#7c3aed', // violet-700
    secondary: '#8b5cf6', // violet-500
    accent1: '#a78bfa', // violet-400
    accent2: '#c4b5fd', // violet-300
    accent3: '#e9d5ff', // violet-100
    accent4: '#f3e8ff', // violet-50
  },
  'AI Agents': {
    primary: '#059669', // emerald-600
    secondary: '#10b981', // emerald-500
    accent1: '#34d399', // emerald-400
    accent2: '#6ee7b7', // emerald-300
    accent3: '#d1fae5', // emerald-100
    accent4: '#ecfdf5', // emerald-50
  },
};

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  app,
  isOpen,
  onClose,
  onPurchase
}) => {
  const [activeSection, setActiveSection] = useState('overview');
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus trap - focus the modal when opened
      if (modalRef.current) {
        modalRef.current.focus();
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Generate extended sales copy using GTM tonalities if not provided
  const extendedCopy = app.extendedCopy || generateExtendedSalesCopy(app);

  const colors = CATEGORY_COLORS[app.category] || CATEGORY_COLORS['AI Tools'];

  const { scrollYProgress } = useScroll({ container: contentRef.current });

  const sections = [
    { id: 'overview', title: 'Overview', icon: Star },
    { id: 'profit', title: 'How to Profit', icon: DollarSign },
    { id: 'features', title: 'Features', icon: CheckCircle },
    { id: 'testimonials', title: 'Success Stories', icon: Users },
    { id: 'pricing', title: 'Pricing', icon: TrendingUp }
  ];

  return (
    <motion.div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      tabIndex={-1}
    >
      <motion.div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        role="document"
      >
        {/* Header */}
        <motion.div className="flex items-center justify-between p-6 border-b" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center space-x-4">
            <div className="text-4xl" aria-hidden="true">{app.icon}</div>
            <div>
              <h2 id="modal-title" className="text-2xl font-bold text-gray-900">{app.name}</h2>
              <p className="text-gray-600">{app.category}</p>
            </div>
          </div>
          <motion.button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={24} />
          </motion.button>
        </motion.div>

        {/* Hero Section */}
        <motion.div id="modal-description" className="p-6 bg-gradient-to-r from-blue-50 to-purple-50" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            {extendedCopy.heroHeadline}
          </h3>
          <p className="text-xl text-gray-700 mb-6">
            {extendedCopy.subheadline}
          </p>
          <div className="flex space-x-4">
            <motion.button
              onClick={() => onPurchase(app.id)}
              className="text-white px-8 py-3 rounded-lg font-semibold flex items-center space-x-2"
              style={{ backgroundColor: colors.primary }}
              whileHover={{ scale: 1.05, y: -2, boxShadow: `0 10px 25px ${colors.primary}40` }}
              whileTap={{ scale: 0.95 }}
            >
              <Zap size={20} />
              <span>{extendedCopy.cta}</span>
            </motion.button>
            <motion.button
              onClick={() => setActiveSection('overview')}
              className="border text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              style={{ borderColor: colors.secondary, color: colors.secondary }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Learn More
            </motion.button>
          </div>
        </motion.div>

        {/* Navigation */}
        <motion.div className="flex border-b bg-gray-50" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          {sections.map((section) => (
            <motion.button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${
                activeSection === section.id
                  ? 'bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeSection === section.id ? { color: colors.primary, borderBottom: `2px solid ${colors.primary}` } : {}}
              whileHover={{ backgroundColor: colors.accent4 }}
              whileTap={{ scale: 0.98 }}
            >
              <section.icon size={18} />
              <span>{section.title}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Content */}
        <div ref={contentRef} className="p-6 overflow-y-auto max-h-96">
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-semibold mb-3 flex items-center space-x-2">
                  <Target size={20} style={{ color: colors.primary }} />
                  <span>What It Does</span>
                </h4>
                <p className="text-gray-700 leading-relaxed">{extendedCopy.whatItDoes}</p>
              </div>

              <div>
                <h4 className="text-xl font-semibold mb-3 flex items-center space-x-2">
                  <Zap size={20} style={{ color: colors.accent1 }} />
                  <span>Why You Need It</span>
                </h4>
                <p className="text-gray-700 leading-relaxed">{extendedCopy.whyYouNeedIt}</p>
              </div>

              <div>
                <h4 className="text-xl font-semibold mb-3">How It Works</h4>
                <p className="text-gray-700 leading-relaxed">{extendedCopy.howItWorks}</p>
              </div>
            </div>
          )}

          {activeSection === 'profit' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-semibold mb-3" style={{ color: colors.accent1 }}>For Local Businesses</h4>
                <p className="text-gray-700 leading-relaxed">{extendedCopy.howToProfit.localBusiness}</p>
              </div>

              <div>
                <h4 className="text-xl font-semibold mb-3" style={{ color: colors.secondary }}>For Individuals</h4>
                <p className="text-gray-700 leading-relaxed">{extendedCopy.howToProfit.individual}</p>
              </div>
            </div>
          )}

          {activeSection === 'features' && (
            <div>
              <h4 className="text-xl font-semibold mb-4" style={{ color: colors.primary }}>Powerful Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {extendedCopy.features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle size={20} style={{ color: colors.accent1 }} className="mt-1 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'testimonials' && (
            <div>
              <h4 className="text-xl font-semibold mb-4" style={{ color: colors.primary }}>Success Stories</h4>
              <div className="space-y-4">
                {extendedCopy.testimonials.map((testimonial, index) => (
                  <div key={index} className="p-4 rounded-lg" style={{ backgroundColor: colors.accent4 }}>
                    <p className="text-gray-700 italic">"{testimonial}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'pricing' && (
            <div>
              <h4 className="text-xl font-semibold mb-4" style={{ color: colors.primary }}>Choose Your Plan</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <h5 className="text-lg font-semibold mb-2">Starter</h5>
                  <p className="text-2xl font-bold mb-4" style={{ color: colors.primary }}>{extendedCopy.pricing.starter}</p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Basic features</li>
                    <li>• 100 uses/month</li>
                    <li>• Email support</li>
                  </ul>
                </div>

                <div className="border-2 rounded-lg p-6 relative hover:shadow-xl transition-shadow" style={{ borderColor: colors.primary }}>
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-sm text-white" style={{ backgroundColor: colors.primary }}>Most Popular</span>
                  </div>
                  <h5 className="text-lg font-semibold mb-2">Pro</h5>
                  <p className="text-2xl font-bold mb-4" style={{ color: colors.primary }}>{extendedCopy.pricing.pro}</p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• All features</li>
                    <li>• Unlimited uses</li>
                    <li>• Priority support</li>
                  </ul>
                </div>

                <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <h5 className="text-lg font-semibold mb-2">Enterprise</h5>
                  <p className="text-2xl font-bold mb-4" style={{ color: colors.primary }}>{extendedCopy.pricing.enterprise}</p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Custom features</li>
                    <li>• White-label</li>
                    <li>• Dedicated support</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <motion.div className="p-6 border-t bg-gray-50" style={{ boxShadow: useTransform(scrollYProgress, [0, 1], ['0px 0px 0px rgba(0,0,0,0)', '0px 10px 25px rgba(0,0,0,0.1)']) }}>
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Ready to transform your workflow?
            </div>
            <motion.button
              onClick={() => onPurchase(app.id)}
              className="text-white px-8 py-3 rounded-lg font-semibold flex items-center space-x-2"
              style={{ backgroundColor: colors.primary }}
              whileHover={{ scale: 1.05, y: -2, boxShadow: `0 10px 25px ${colors.primary}40` }}
              whileTap={{ scale: 0.95 }}
            >
              <DollarSign size={20} />
              <span>Get Started Now</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

// Helper function to generate extended sales copy using GTM tonalities
function generateExtendedSalesCopy(app: any): ExtendedSalesCopy {
  const tonalities = {
    'AI Tools': {
      hero: 'Transform Your Workflow with AI Power',
      profit: 'Save 10+ hours weekly automating repetitive tasks'
    },
    'RAG Tools': {
      hero: 'Unlock Knowledge with Intelligent Search',
      profit: 'Find answers instantly from your data'
    },
    'AI Agents': {
      hero: 'Meet Your Personal AI Assistant',
      profit: 'Delegate complex tasks and get expert results'
    }
  };

  const categoryTone = tonalities[app.category] || tonalities['AI Tools'];

  return {
    heroHeadline: categoryTone.hero,
    subheadline: `${app.description} - Powered by advanced AI to deliver professional results.`,
    whatItDoes: `${app.name} leverages cutting-edge AI technology to ${app.description.toLowerCase()}. Experience the future of automation with our intelligent solution.`,
    howToProfit: {
      localBusiness: `Boost your business efficiency by 300% while reducing costs. ${categoryTone.profit} and focus on growing your business.`,
      individual: `Save time and money on professional services. Get expert-level results at a fraction of the cost. ${categoryTone.profit} and achieve more.`
    },
    whyYouNeedIt: `In today's fast-paced world, staying competitive requires leveraging AI. ${app.name} gives you the edge with professional-grade AI capabilities that were once only available to large corporations.`,
    howItWorks: `Simply input your requirements, and our AI processes the information using advanced algorithms to deliver high-quality results. No technical expertise required.`,
    features: [
      'Advanced AI algorithms for superior results',
      'User-friendly interface with guided workflows',
      'Fast processing with instant results',
      'Secure and private data handling',
      'Continuous updates with latest AI improvements'
    ],
    testimonials: [
      '"This tool revolutionized how I work. The AI quality is incredible!" - Sarah M.',
      '"Finally, professional results without the high costs. Game changer!" - Mike R.',
      '"So easy to use, yet so powerful. Exactly what I needed." - Jennifer L.'
    ],
    pricing: {
      starter: '$9/month',
      pro: '$29/month',
      enterprise: '$99/month'
    },
    cta: 'Start Using Today'
  };
}

export default ProductDetailModal;