import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Users, Image as ImageIcon, Sparkles, Palette, CircleUser as UserCircle, Package, Layers, FileText, Mic, Search, ArrowRight, Filter, Play, Star, PanelTop, Zap, Camera, Share, Wand2, Globe, MessageSquare, Brain, FileVideo, ShoppingCart, Lock, Check } from 'lucide-react';
import MagicSparkles from '../MagicSparkles';
import { useInView } from 'react-intersection-observer';
import { useAuth } from '../../context/AuthContext';
import { useUserAccess } from '../../hooks/useUserAccess';
import { useApps } from '../../hooks/useApps';
import LockedAppOverlay from '../LockedAppOverlay';
import PurchaseModal from '../PurchaseModal';
import LazyIcon from '../LazyIcon';

// Define TrendingUp component
const TrendingUp: React.FC<{ className?: string }> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

// App categories with personalization focus
const toolCategories = [
  { id: 'all', label: 'All Personalization Tools', icon: React.createElement(Layers, { className: "w-4 h-4" }) },
  { id: 'video', label: 'Personalized Video', icon: React.createElement(Video, { className: "w-4 h-4" }) },
  { id: 'lead-gen', label: 'Personalized Marketing', icon: React.createElement(Users, { className: "w-4 h-4" }) },
  { id: 'ai-image', label: 'Personalized AI Image', icon: React.createElement(ImageIcon, { className: "w-4 h-4" }) },
  { id: 'branding', label: 'Personalized Branding', icon: React.createElement(Palette, { className: "w-4 h-4" }) },
  { id: 'personalizer', label: 'Content Personalizer', icon: React.createElement(UserCircle, { className: "w-4 h-4" }) },
  { id: 'creative', label: 'Personalized Creative', icon: React.createElement(Package, { className: "w-4 h-4" }) }
];

// Featured apps to highlight
const featuredApps = [
  'video-creator',
  'landing-page',
  'thumbnail-generator',
  'ai-art',
  'storyboard',
  'rebrander-ai'
];

// Fallback image URLs to use when an app image fails to load
const fallbackImages = [
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
];

// Personalization benefits
const personalizationBenefits = [
  { title: '47% Higher Engagement', description: 'Personalized content drives significantly more engagement than generic content', icon: <Zap className="h-5 w-5 text-primary-400" /> },
  { title: '3.5x More Conversions', description: 'Personalized videos convert at rates up to 3.5x higher than standard videos', icon: <TrendingUp className="h-5 w-5 text-primary-400" /> },
  { title: '92% Message Retention', description: 'Viewers remember personalized content longer and more accurately', icon: <Brain className="h-5 w-5 text-primary-400" /> },
  { title: 'Global Audience Ready', description: 'Personalize content for different regions, languages, and cultures', icon: <Globe className="h-5 w-5 text-primary-400" /> }
];

// Helper function to get app URL
const getAppUrl = (appId: string, apps: any[] = []) => {
  if (!apps || apps.length === 0) {
    return `/app/${appId}`;
  }
  const app = apps.find(a => a.id === appId);
  return app?.url || `/app/${appId}`;
};

const DashboardToolsSection: React.FC = () => {
  const { user } = useAuth();
  const { hasAccessToApp, accessData, isLoading: accessLoading } = useUserAccess();
  const { apps: appsData, loading: appsLoading } = useApps();

  const purchasedApps = accessData?.apps.map(app => app.appSlug) || [];
  const hasAnyPurchases = purchasedApps.length > 0;
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredApps, setFilteredApps] = useState<any[]>([]);
  const [sortOrder, setSortOrder] = useState<'popular' | 'new' | 'a-z'>('popular');
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const containerRef = useRef<HTMLDivElement>(null);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [selectedAppForPurchase, setSelectedAppForPurchase] = useState<any>(null);
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });
  
  // Image loading error handling state
  const [imageErrors, setImageErrors] = useState<Record<string, number>>({});

  // Update filtered tools when category, search query, or access data change
  useEffect(() => {
    if (!appsData || appsData.length === 0) {
      setFilteredApps([]);
      return;
    }

    let result = [...appsData];

    // For logged-in users, only show purchased apps
    if (user) {
      result = result.filter(app => hasAccessToApp(app.id));
    }
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(app => app.category === selectedCategory);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        app => app.name.toLowerCase().includes(query) || 
               app.description.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    switch (sortOrder) {
      case 'popular':
        result.sort((a, b) => {
          if (a.popular && !b.popular) return -1;
          if (!a.popular && b.popular) return 1;
          return 0;
        });
        break;
      case 'new':
        result.sort((a, b) => {
          if (a.new && !b.new) return -1;
          if (!a.new && b.new) return 1;
          return 0;
        });
        break;
      case 'a-z':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    
    setFilteredApps(result);
  }, [selectedCategory, searchQuery, sortOrder, user, accessData, appsData]);
  
  // Handle image load errors
  const handleImageError = (appId: string) => {
    setImageErrors(prev => {
      // Get the current error count or 0 if first error
      const currentErrorCount = prev[appId] || 0;
      
      // Increment error count for this app
      return {
        ...prev,
        [appId]: currentErrorCount + 1
      };
    });
  };
  
  // Get a fallback image URL based on app ID
  const getFallbackImage = (appId: string, errorCount: number = 0) => {
    // Start with a deterministic fallback based on app ID
    const index = appId.charCodeAt(0) % fallbackImages.length;
    
    // If multiple errors, cycle through fallbacks
    const adjustedIndex = (index + errorCount) % fallbackImages.length;
    
    return fallbackImages[adjustedIndex];
  };
  
  // Scroll helpers
  const scrollLeft10Percent = () => {
    if (containerRef.current) {
      const width = containerRef.current.clientWidth;
      containerRef.current.scrollBy({ left: -width * 0.3, behavior: 'smooth' });
    }
  };

  const scrollRight10Percent = () => {
    if (containerRef.current) {
      const width = containerRef.current.clientWidth;
      containerRef.current.scrollBy({ left: width * 0.3, behavior: 'smooth' });
    }
  };
  
  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    
    // Dispatch custom event for sound effect
    document.dispatchEvent(new Event('sound:click'));
  };
  
  // Get featured apps
  const getFeaturedApps = () => {
    if (!appsData || appsData.length === 0) {
      return [];
    }
    return appsData.filter(app => featuredApps.includes(app.id));
  };

  // Animated cards with staggered entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };


  return (
    <section id="tools" className="py-20 bg-black relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10 bg-grid-pattern"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px]"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px]"></div>
      
      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <MagicSparkles minSparkles={5} maxSparkles={10} colors={['#6366f1', '#818cf8', '#f472b6', '#ec4899']}>
            <div className="inline-block mb-4">
              <div className="bg-gradient-to-r from-primary-600 to-primary-400 text-white font-bold px-6 py-2 rounded-full">
                <Sparkles className="inline-block mr-2 h-5 w-5" />
                PERSONALIZED TOOLS COLLECTION
              </div>
            </div>
          </MagicSparkles>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            {user ? (
              <>
                Your <span className="text-primary-400">Personalized Tools</span>
              </>
            ) : (
              <>
                Create Content That <span className="text-primary-400">Speaks Directly</span> To Your Audience
              </>
            )}
          </h2>

          <p className="text-xl text-gray-300 mb-8">
            {user && hasAnyPurchases ? (
              <>You have access to {purchasedApps.length} personalization {purchasedApps.length === 1 ? 'tool' : 'tools'}</>
            ) : user ? (
              <>Browse available tools and start personalizing your content</>
            ) : (
              <>VideoRemix.vip offers 50+ personalization tools that help you create highly targeted, engaging content that resonates with each specific viewer segment.</>
            )}
          </p>
          
          {/* Personalization benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {personalizationBenefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-5 border border-gray-700"
              >
                <div className="flex items-center justify-center mb-3">
                  <div className="p-2.5 rounded-full bg-primary-900/50">
                    {benefit.icon}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{benefit.title}</h3>
                <p className="text-gray-400 text-sm">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Categories */}
        <div className="relative mb-10">
          <div className="flex justify-center overflow-x-auto hide-scrollbar">
            <div className="flex space-x-3">
              {toolCategories.map(category => (
                <motion.button
                  key={category.id}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 min-w-[140px] ${
                    selectedCategory === category.id
                      ? `bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md`
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => handleCategoryChange(category.id)}
                >
                  <div className="flex flex-col items-center">
                    <div className={`p-2 rounded-full ${selectedCategory === category.id ? 'bg-white/20' : 'bg-gray-700'} mb-1`}>
                      {category.icon}
                    </div>
                    <span>{category.label}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Empty state when user has no purchases */}
        {user && !accessLoading && purchasedApps.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-3xl mx-auto mb-16 text-center"
          >
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12 border border-gray-700">
              <div className="w-20 h-20 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-10 w-10 text-primary-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Welcome to Your Dashboard
              </h3>
              <p className="text-gray-300 mb-8">
                You don't have any apps yet. Browse our collection of 50+ personalization tools and unlock the power of personalized content.
              </p>
              <Link
                to="/tools"
                className="inline-flex items-center bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold px-8 py-4 rounded-lg shadow-lg shadow-primary-600/20"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Browse All Tools
              </Link>
            </div>
          </motion.div>
        )}

        {/* Featured personalization tools - only show if user has purchases */}
        {(!user || hasAnyPurchases) && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-6xl mx-auto mb-16"
          >
            <h3 className="text-2xl font-bold text-white mb-6">
              {user && hasAnyPurchases ? 'Your Apps' : 'Featured Personalization Tools'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFeaturedApps().map((app, index) => {
                const isPurchased = user && hasAccessToApp(app.id);
                const handleAppClick = (e: React.MouseEvent) => {
                  if (!isPurchased) {
                    e.preventDefault();
                    setSelectedAppForPurchase(app);
                    setPurchaseModalOpen(true);
                  }
                };

                return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                whileHover={{
                  y: -10,
                  transition: { duration: 0.2 }
                }}
                className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden group border border-gray-700 shadow-lg"
                onClick={handleAppClick}
              >
                {/* App label and status */}
                <div className="absolute top-0 left-0 right-0 px-4 py-3 bg-gradient-to-b from-black/70 to-transparent z-20 flex justify-between items-start">
                  <div className="max-w-[70%]">
                    <h4 className="text-white font-bold truncate">Personalized {app.name}</h4>
                    <p className="text-gray-300 text-sm truncate">Tailored {app.description.toLowerCase()}</p>
                  </div>

                  <div className="flex flex-col space-y-1 items-end">
                    {isPurchased && (
                      <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold flex items-center">
                        <Check className="h-3 w-3 mr-1" /> OWNED
                      </span>
                    )}
                    {!isPurchased && (
                      <span className="bg-gray-600 text-white text-xs px-2 py-0.5 rounded-full font-bold flex items-center">
                        <Lock className="h-3 w-3 mr-1" /> LOCKED
                      </span>
                    )}
                    {app.popular && (
                      <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full font-bold">
                        POPULAR
                      </span>
                    )}
                    {app.new && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                        NEW
                      </span>
                    )}
                  </div>
                </div>
                
                {/* App image */}
                <div className="w-full aspect-video">
                  <img 
                    src={imageErrors[app.id] ? getFallbackImage(app.id, imageErrors[app.id]) : app.image} 
                    alt={app.name} 
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
                    onError={() => handleImageError(app.id)}
                  />
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                </div>
                
                {/* Hover overlay with action button */}
                {!isPurchased && (
                  <div className="absolute inset-0 bg-primary-900/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-30">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-white text-gray-900 px-6 py-3 rounded-lg font-bold flex items-center"
                      onClick={handleAppClick}
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Purchase Now
                    </motion.button>
                  </div>
                )}
                {isPurchased && (
                  <div className="absolute inset-0 bg-primary-900/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-30">
                    <a
                      href={getAppUrl(app.id, appsData)}
                      className="bg-white text-gray-900 px-6 py-3 rounded-lg font-bold flex items-center"
                    >
                      <Wand2 className="mr-2 h-5 w-5" />
                      Open App
                    </a>
                  </div>
                )}
                
                {/* Bottom info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent z-10">
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-800/80 rounded-full mr-3">
                      <LazyIcon name={app.iconName} className="w-5 h-5 text-primary-400" />
                    </div>
                    
                    <div className="flex items-center text-gray-300 text-sm overflow-hidden">
                      <span className="truncate">Personalized {toolCategories.find(c => c.id === app.category)?.label}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Search and filter controls - only show if user has purchases */}
        {(!user || hasAnyPurchases) && (
          <div className="max-w-6xl mx-auto mb-8">
          <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0">
            <div className="relative md:w-1/3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search personalization tools..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setSearchQuery('')}
                >
                  <span className="text-gray-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </span>
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <div className="relative md:w-48">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white appearance-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'popular' | 'new' | 'a-z')}
                >
                  <option value="popular">Most Popular First</option>
                  <option value="new">Newest First</option>
                  <option value="a-z">Alphabetical</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-1 flex">
                <button
                  className={`p-1 rounded ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  className={`p-1 rounded ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
            </div>
          </div>
        )}

        {/* All tools carousel with horizontal scroll - only show if user has purchases */}
        {(!user || hasAnyPurchases) && (
          <div className="max-w-6xl mx-auto mb-16 relative" ref={containerRef}>
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Wand2 className="h-6 w-6 mr-2 text-primary-400" />
            Personalization Tools
          </h3>
          
          {/* Left/Right scroll controls */}
          <button 
            onClick={scrollLeft10Percent}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 z-20 bg-black/80 backdrop-blur-sm p-2 rounded-full text-white shadow-lg hover:bg-black/60"
            aria-label="Scroll left"
          >
            <ArrowRight className="h-5 w-5 rotate-180" />
          </button>

          <button 
            onClick={scrollRight10Percent}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2 z-20 bg-black/80 backdrop-blur-sm p-2 rounded-full text-white shadow-lg hover:bg-black/60"
            aria-label="Scroll right"
          >
            <ArrowRight className="h-5 w-5" />
          </button>

          {/* Tool cards in horizontal scroll container */}
          <div className="overflow-x-auto pb-6 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
            <div className="flex space-x-4 px-1" style={{ width: 'max-content' }}>
              {filteredApps.map(app => {
                const appUrl = getAppUrl(app.id, appsData);
                const isPurchased = user && hasAccessToApp(app.id);
                const handleClick = (e: React.MouseEvent) => {
                  if (!isPurchased) {
                    e.preventDefault();
                    setSelectedAppForPurchase(app);
                    setPurchaseModalOpen(true);
                  }
                };

                return (
                <motion.div
                  key={app.id}
                  whileHover={{ y: -10 }}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 w-[280px] flex-shrink-0 group hover:border-primary-500/50 transition-colors cursor-pointer"
                  onClick={handleClick}
                >
                    <div className="relative h-[160px]">
                      <img 
                        src={imageErrors[app.id] ? getFallbackImage(app.id, imageErrors[app.id]) : app.image} 
                        alt={app.name} 
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(app.id)}
                      />
                      
                      {/* Overlay with personalization focus */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                      
                      {/* Personalization badge */}
                      <div className="absolute top-3 left-3 bg-primary-600/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                        Personalized
                      </div>
                      
                      {/* Status badges */}
                      <div className="absolute top-3 right-3 flex flex-col space-y-1 items-end">
                        {isPurchased ? (
                          <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded font-bold flex items-center">
                            <Check className="h-3 w-3 mr-1" /> OWNED
                          </span>
                        ) : (
                          <span className="bg-gray-600 text-white text-xs px-2 py-0.5 rounded font-bold flex items-center">
                            <Lock className="h-3 w-3 mr-1" /> LOCKED
                          </span>
                        )}
                        {app.popular && (
                          <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded font-bold">
                            POPULAR
                          </span>
                        )}
                        {app.new && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded font-bold">
                            NEW
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4">
                      <h4 className="text-white font-bold text-lg group-hover:text-primary-400 transition-colors">{app.name}</h4>
                      <p className="text-gray-400 text-sm mb-3">{app.description}</p>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <LazyIcon name={app.iconName} className="h-4 w-4 text-primary-400 mr-1" />
                          <span className="text-gray-500 text-xs">Personalization Tool</span>
                        </div>

                        <span className="text-primary-400 text-sm font-medium flex items-center">
                          {isPurchased ? 'Open' : 'Purchase'}
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </span>
                      </div>
                    </div>
                </motion.div>
                )})}
            </div>
          </div>
          </div>
        )}

        {/* Main tools grid/list - only show if user has purchases */}
        {(!user || hasAnyPurchases) && (
          <div className="max-w-6xl mx-auto mb-16">
          {filteredApps.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
              }
            >
              {filteredApps.map((app) => {
                const appUrl = getAppUrl(app.id, appsData);
                const isPurchased = user && hasAccessToApp(app.slug || app.id);
                const handleClick = (e: React.MouseEvent) => {
                  if (!isPurchased) {
                    e.preventDefault();
                    setSelectedAppForPurchase(app);
                    setPurchaseModalOpen(true);
                  } else {
                    window.location.href = appUrl;
                  }
                };

                return (
                <motion.div
                  key={app.id}
                  variants={itemVariants}
                  onHoverStart={() => setHoveredApp(app.id)}
                  onHoverEnd={() => setHoveredApp(null)}
                  onClick={handleClick}
                  className={`relative cursor-pointer ${
                    viewMode === 'grid'
                    ? "group bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 hover:border-primary-500/50 transition-colors shadow-lg"
                    : "flex bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 hover:border-primary-500/50 transition-colors shadow-lg"
                  }`}
                >
                  {/* App image */}
                  <div 
                    className={viewMode === 'grid' 
                      ? "w-full aspect-video" 
                      : "flex-shrink-0 w-32 h-full"
                    }
                  >
                    <div className="relative h-full">
                      <img 
                        src={imageErrors[app.id] ? getFallbackImage(app.id, imageErrors[app.id]) : app.image} 
                        alt={app.name} 
                        className={`object-cover ${
                          viewMode === 'grid' 
                          ? "w-full h-full" 
                          : "w-32 h-full"
                        }`}
                        onError={() => handleImageError(app.id)}
                      />
                      
                      {/* Personalization marker */}
                      <div className="absolute top-2 left-2 bg-primary-600/80 text-xs text-white px-2 py-0.5 rounded-full">
                        Personalized
                      </div>
                      
                      {/* Status badges */}
                      <div className="absolute top-2 right-2 flex flex-col space-y-1 items-end">
                        {isPurchased ? (
                          <div className="bg-green-500 text-xs text-white px-1.5 py-0.5 rounded font-bold flex items-center">
                            <Check className="h-3 w-3 mr-1" /> OWNED
                          </div>
                        ) : (
                          <div className="bg-gray-600 text-xs text-white px-1.5 py-0.5 rounded font-bold flex items-center">
                            <Lock className="h-3 w-3 mr-1" /> LOCKED
                          </div>
                        )}
                        {app.popular && (
                          <div className="bg-yellow-500 text-xs text-black px-1.5 py-0.5 rounded font-bold">
                            POPULAR
                          </div>
                        )}
                        {app.new && (
                          <div className="bg-blue-500 text-xs text-white px-1.5 py-0.5 rounded font-bold">
                            NEW
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className={viewMode === 'grid' ? "p-4" : "p-4 flex-grow"}>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary-400 transition-colors break-words">
                      {app.name}
                    </h3>
                    <p className="text-gray-300 text-sm mb-4 break-words">Personalized {app.description.toLowerCase()}</p>

                    {/* Link to app details */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-xs text-gray-400">
                        <LazyIcon name={app.iconName} className="h-4 w-4 text-primary-400 mr-1" />
                        <span>{toolCategories.find(c => c.id === app.category)?.label}</span>
                      </div>

                      <span className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center">
                        {isPurchased ? 'Open App' : 'Purchase'}
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </span>
                    </div>
                    
                    {/* Hover effect for grid view */}
                    {viewMode === 'grid' && (
                      <div className="absolute inset-0 bg-primary-900/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center z-20">
                        {isPurchased ? (
                          <a
                            href={appUrl}
                            className="bg-white text-gray-900 font-bold py-2 px-6 rounded-lg flex items-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Wand2 className="h-5 w-5 mr-2" />
                            Open App
                          </a>
                        ) : (
                          <button
                            className="bg-white text-gray-900 font-bold py-2 px-6 rounded-lg flex items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClick(e);
                            }}
                          >
                            <ShoppingCart className="h-5 w-5 mr-2" />
                            Purchase Now
                          </button>
                        )}
                        
                        {/* User count for popular apps */}
                        {app.popular && (
                          <div className="mt-3 flex items-center text-white text-sm">
                            <Users className="h-4 w-4 mr-1" />
                            <span>Used by 1,200+ creators</span>
                          </div>
                        )}
                        
                        {/* Star ratings */}
                        <div className="mt-2 flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )})}
            </motion.div>
          ) : (
            <div className="bg-gray-800 rounded-xl p-8 text-center">
              <div className="text-gray-400 text-lg mb-4">No personalization tools found matching your criteria</div>
              <button 
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="text-primary-400 font-medium"
              >
                Reset filters
              </button>
            </div>
          )}
          </div>
        )}

        {/* Bottom CTA - show for non-logged-in users or users without purchases */}
        {(!user || !hasAnyPurchases) && (
          <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center bg-gradient-to-r from-primary-900/40 to-primary-700/40 p-8 rounded-xl border border-primary-500/30"
        >
          <MagicSparkles minSparkles={5} maxSparkles={8}>
            <h3 className="text-2xl font-bold text-white mb-4">
              Unlock All Personalization Tools
            </h3>
          </MagicSparkles>
          
          <p className="text-gray-300 mb-8">
            Get unlimited access to all 50+ personalization tools and create content that delivers 3x better results than generic videos.
          </p>
          
          <motion.a
            href="#pricing"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold px-8 py-4 rounded-lg shadow-lg shadow-primary-600/20"
          >
            <span>Start Personalizing Today</span>
            <ArrowRight className="ml-2 h-5 w-5" />
          </motion.a>
          </motion.div>
        )}
      </div>

      {/* Purchase Modal */}
      {selectedAppForPurchase && (
        <PurchaseModal
          isOpen={purchaseModalOpen}
          onClose={() => {
            setPurchaseModalOpen(false);
            setSelectedAppForPurchase(null);
          }}
          app={selectedAppForPurchase}
        />
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
};

export default DashboardToolsSection;