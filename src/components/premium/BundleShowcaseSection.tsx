import React from 'react';
import { motion } from 'framer-motion';
import { bundles, Bundle } from '../../data/bundleData';
import { ChevronRight, Sparkles, Clock, Shield, Star, TrendingUp, BarChart3, Users, DollarSign } from 'lucide-react';
import InteractiveCard from './InteractiveCard';
import TextReveal from './TextReveal';
import { Link } from 'react-router-dom';

const BundleShowcaseSection: React.FC = () => {
  // Get popular bundles and all bundles
  const popularBundles = bundles.filter(b => b.popular);
  const otherBundles = bundles.filter(b => !b.popular);

  const bundleIcons: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
    'sales-lead-gen': { icon: <DollarSign className="h-6 w-6" />, color: 'text-green-400', bgColor: 'bg-green-500/20' },
    'content-marketing': { icon: <Sparkles className="h-6 w-6" />, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    'video-audio-voice': { icon: <Clock className="h-6 w-6" />, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    'rag-knowledgebase': { icon: <Shield className="h-6 w-6" />, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    'realestate-local': { icon: <Star className="h-6 w-6" />, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
    'hr-hiring': { icon: <Users className="h-6 w-6" />, color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
    'finance-business': { icon: <BarChart3 className="h-6 w-6" />, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
    'legal-compliance': { icon: <Clock className="h-6 w-6" />, color: 'text-red-400', bgColor: 'bg-red-500/20' },
    'coding-developer': { icon: <DollarSign className="h-6 w-6" />, color: 'text-indigo-400', bgColor: 'bg-indigo-500/20' },
    'design-uiux': { icon: <Sparkles className="h-6 w-6" />, color: 'text-rose-400', bgColor: 'bg-rose-500/20' },
    'research-education': { icon: <Shield className="h-6 w-6" />, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
    'productivity-personal': { icon: <TrendingUp className="h-6 w-6" />, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const BundleCard: React.FC<{ bundle: Bundle; index: number }> = ({ bundle, index }) => {
    const iconData = bundleIcons[bundle.category] || { icon: <Sparkles className="h-6 w-6" />, color: 'text-primary-400', bgColor: 'bg-primary-500/20' };
    
    return (
      <InteractiveCard>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="bg-gray-900/50 backdrop-blur rounded-xl p-6 h-full flex flex-col"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-lg ${iconData.bgColor}`}>
              {iconData.icon}
            </div>
            {bundle.popular && (
              <span className="px-2 py-1 bg-primary-600/20 text-primary-300 text-xs rounded-full font-medium">
                Popular
              </span>
            )}
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">{bundle.name}</h3>
          <p className="text-gray-400 text-sm mb-4 flex-1">{bundle.description}</p>
          
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">{formatPrice(bundle.price)}</span>
              <span className="text-xs text-gray-400">one-time</span>
            </div>
            <div className="text-xs text-gray-400">
              <span className="text-primary-400">{bundle.apps.length}+ apps</span> included
            </div>
          </div>
          
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-2">Top features:</div>
            <ul className="text-xs text-gray-400 space-y-1">
              {bundle.features.slice(0, 3).map((feature, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-primary-400">•</span>
                  <span className="line-clamp-1">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <Link 
            to={`/bundles/${bundle.id}`}
            className="mt-auto flex items-center justify-center gap-2 text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors"
          >
            View Details
            <ChevronRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </InteractiveCard>
    );
  };

  return (
    <section id="bundles" className="py-20 bg-gray-950">
      <div className="container-max section-padding">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <TextReveal text="Complete App Bundles" as="h2" className="prose-h2 mb-4" />
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Choose from 12 comprehensive bundles, each packed with 6-16 AI-powered apps. 
            Get 60-70% savings compared to buying apps individually.
          </p>
        </motion.div>

        {/* Popular Bundles */}
        {popularBundles.length > 0 && (
          <div className="mb-16">
            <h3 className="text-lg font-semibold text-gray-300 mb-6">Popular Bundles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularBundles.map((bundle, index) => (
                <BundleCard key={bundle.id} bundle={bundle} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* All Bundles Grid */}
        <div>
          <h3 className="text-lg font-semibold text-gray-300 mb-6">All Bundles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherBundles.map((bundle, index) => (
              <BundleCard key={bundle.id} bundle={bundle} index={index} />
            ))}
          </div>
        </div>

        {/* Value Proposition */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 bg-gradient-to-br from-primary-900/30 to-accent-900/30 rounded-xl p-8 text-center"
        >
          <h3 className="text-2xl font-bold text-white mb-4">Maximum Value</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div>
              <p className="text-3xl font-bold text-primary-400 mb-1">$11,252</p>
              <p className="text-gray-400 text-sm">Individual App Value</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white mb-1">$4,764</p>
              <p className="text-gray-400 text-sm">Bundle Price</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-success-400 mb-1">58%</p>
              <p className="text-gray-400 text-sm">Average Savings</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default BundleShowcaseSection;