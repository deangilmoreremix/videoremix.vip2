import React, { useState, useEffect } from 'react';
import { X, Star, CheckCircle, TrendingUp, Users, Zap, Target, DollarSign } from 'lucide-react';

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

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  app,
  isOpen,
  onClose,
  onPurchase
}) => {
  const [activeSection, setActiveSection] = useState('overview');

  if (!isOpen) return null;

  // Generate extended sales copy using GTM tonalities if not provided
  const extendedCopy = app.extendedCopy || generateExtendedSalesCopy(app);

  const sections = [
    { id: 'overview', title: 'Overview', icon: Star },
    { id: 'profit', title: 'How to Profit', icon: DollarSign },
    { id: 'features', title: 'Features', icon: CheckCircle },
    { id: 'testimonials', title: 'Success Stories', icon: Users },
    { id: 'pricing', title: 'Pricing', icon: TrendingUp }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <div className="text-4xl">{app.icon}</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{app.name}</h2>
              <p className="text-gray-600">{app.category}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Hero Section */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            {extendedCopy.heroHeadline}
          </h3>
          <p className="text-xl text-gray-700 mb-6">
            {extendedCopy.subheadline}
          </p>
          <div className="flex space-x-4">
            <button
              onClick={() => onPurchase(app.id)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Zap size={20} />
              <span>{extendedCopy.cta}</span>
            </button>
            <button
              onClick={() => setActiveSection('overview')}
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex border-b bg-gray-50">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${
                activeSection === section.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <section.icon size={18} />
              <span>{section.title}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-semibold mb-3 flex items-center space-x-2">
                  <Target size={20} className="text-blue-600" />
                  <span>What It Does</span>
                </h4>
                <p className="text-gray-700 leading-relaxed">{extendedCopy.whatItDoes}</p>
              </div>

              <div>
                <h4 className="text-xl font-semibold mb-3 flex items-center space-x-2">
                  <Zap size={20} className="text-green-600" />
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
                <h4 className="text-xl font-semibold mb-3 text-green-700">For Local Businesses</h4>
                <p className="text-gray-700 leading-relaxed">{extendedCopy.howToProfit.localBusiness}</p>
              </div>

              <div>
                <h4 className="text-xl font-semibold mb-3 text-blue-700">For Individuals</h4>
                <p className="text-gray-700 leading-relaxed">{extendedCopy.howToProfit.individual}</p>
              </div>
            </div>
          )}

          {activeSection === 'features' && (
            <div>
              <h4 className="text-xl font-semibold mb-4">Powerful Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {extendedCopy.features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle size={20} className="text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'testimonials' && (
            <div>
              <h4 className="text-xl font-semibold mb-4">Success Stories</h4>
              <div className="space-y-4">
                {extendedCopy.testimonials.map((testimonial, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 italic">"{testimonial}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'pricing' && (
            <div>
              <h4 className="text-xl font-semibold mb-4">Choose Your Plan</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h5 className="text-lg font-semibold mb-2">Starter</h5>
                  <p className="text-2xl font-bold text-blue-600 mb-4">{extendedCopy.pricing.starter}</p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Basic features</li>
                    <li>• 100 uses/month</li>
                    <li>• Email support</li>
                  </ul>
                </div>

                <div className="border-2 border-blue-500 rounded-lg p-6 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">Most Popular</span>
                  </div>
                  <h5 className="text-lg font-semibold mb-2">Pro</h5>
                  <p className="text-2xl font-bold text-blue-600 mb-4">{extendedCopy.pricing.pro}</p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• All features</li>
                    <li>• Unlimited uses</li>
                    <li>• Priority support</li>
                  </ul>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <h5 className="text-lg font-semibold mb-2">Enterprise</h5>
                  <p className="text-2xl font-bold text-blue-600 mb-4">{extendedCopy.pricing.enterprise}</p>
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
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Ready to transform your workflow?
            </div>
            <button
              onClick={() => onPurchase(app.id)}
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <DollarSign size={20} />
              <span>Get Started Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
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