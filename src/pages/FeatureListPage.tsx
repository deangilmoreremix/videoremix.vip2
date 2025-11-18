import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { featuresData } from '../data/featuresData';
import { ChevronRight, Sparkles, ArrowRight, Filter, Search, X, Check } from 'lucide-react';
import MagicSparkles from '../components/MagicSparkles';

// Additional features not covered in featuresData
const additionalFeatures = [
  {
    id: 'ai-voice-generation',
    title: 'AI Voice Generation',
    shortDescription: 'Create natural-sounding voiceovers in multiple languages',
    icon: '🎙️',
    category: 'ai',
    tags: ['audio', 'voice', 'text-to-speech']
  },
  {
    id: 'background-removal',
    title: 'Background Removal',
    shortDescription: 'Remove backgrounds from videos with one click, no green screen required',
    icon: '✂️',
    category: 'ai',
    tags: ['editing', 'effects']
  },
  {
    id: 'motion-graphics',
    title: 'Motion Graphics Library',
    shortDescription: 'Add professional animated elements and graphics to your videos',
    icon: '🎬',
    category: 'templates',
    tags: ['animation', 'graphics']
  },
  {
    id: 'personalized-videos',
    title: 'Personalized Video Creation',
    shortDescription: 'Create individualized videos at scale with dynamic content insertion',
    icon: '👤',
    category: 'workflow',
    tags: ['personalization', 'marketing']
  },
  {
    id: 'video-analytics',
    title: 'Video Performance Analytics',
    shortDescription: 'Track engagement, view rates, and conversion metrics across platforms',
    icon: '📊',
    category: 'business',
    tags: ['analytics', 'metrics', 'insights']
  },
  {
    id: 'social-publishing',
    title: 'Social Media Publishing',
    shortDescription: 'Schedule and publish videos directly to all major social platforms',
    icon: '🌐',
    category: 'workflow',
    tags: ['social media', 'publishing']
  },
  {
    id: 'video-seo',
    title: 'Video SEO Tools',
    shortDescription: 'Optimize titles, descriptions, and tags for better discovery',
    icon: '🔍',
    category: 'marketing',
    tags: ['SEO', 'discovery']
  },
  {
    id: 'screen-recording',
    title: 'Screen Recording',
    shortDescription: 'Capture high-quality screen recordings with annotation tools',
    icon: '🖥️',
    category: 'workflow',
    tags: ['screen capture', 'tutorial creation']
  },
  {
    id: 'multicam-editing',
    title: 'Multi-Camera Editing',
    shortDescription: 'Edit footage from multiple cameras with synchronized timelines',
    icon: '📹',
    category: 'advanced',
    tags: ['advanced editing', 'professional']
  },
  {
    id: 'color-grading',
    title: 'Advanced Color Grading',
    shortDescription: 'Apply professional color grades and LUTs with fine control',
    icon: '🎨',
    category: 'advanced',
    tags: ['color', 'professional']
  },
  {
    id: 'audio-enhancement',
    title: 'Audio Enhancement',
    shortDescription: 'Improve voice clarity, reduce noise, and optimize audio levels automatically',
    icon: '🔊',
    category: 'ai',
    tags: ['audio', 'sound quality']
  },
  {
    id: 'interactive-elements',
    title: 'Interactive Video Elements',
    shortDescription: 'Add clickable buttons, forms, and interactive hotspots to videos',
    icon: '👆',
    category: 'advanced',
    tags: ['interactive', 'engagement']
  }
];

// Categories for filter
const categories = [
  { id: 'all', name: 'All Features' },
  { id: 'ai', name: 'AI & Automation' },
  { id: 'templates', name: 'Templates & Design' },
  { id: 'workflow', name: 'Workflow & Efficiency' },
  { id: 'collaboration', name: 'Collaboration & Teams' },
  { id: 'business', name: 'Business Tools' },
  { id: 'marketing', name: 'Marketing Features' },
  { id: 'advanced', name: 'Advanced Editing' }
];

// Combine feature data sets and normalize structure
const getAllFeatures = () => {
  // First, normalize the main featuresData
  const normalizedMainFeatures = featuresData.map(feature => ({
    id: feature.id,
    title: feature.title,
    shortDescription: feature.shortDescription,
    icon: feature.icon,
    image: feature.image,
    category: feature.id.includes('ai') ? 'ai' : 
             feature.id.includes('template') ? 'templates' : 
             feature.id.includes('repurposing') ? 'workflow' : 
             feature.id.includes('caption') ? 'ai' : 
             feature.id.includes('collaboration') ? 'collaboration' : 'workflow',
    tags: feature.keyPoints.map(point => point.toLowerCase().split(' ')[0])
  }));
  
  // Then add the additional features
  return [...normalizedMainFeatures, ...additionalFeatures];
};

const FeatureListPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFeatures, setFilteredFeatures] = useState<any[]>([]);
  const [allFeatures] = useState(getAllFeatures());
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  
  useEffect(() => {
    // Filter features based on category and search query
    let filtered = allFeatures;
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(feature => feature.category === selectedCategory);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(feature => 
        feature.title.toLowerCase().includes(query) || 
        feature.shortDescription.toLowerCase().includes(query) ||
        (feature.tags && feature.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }
    
    setFilteredFeatures(filtered);
  }, [selectedCategory, searchQuery, allFeatures]);

  // Reset to top when filters change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedCategory]);

  return (
    <>
      <Helmet>
        <title>Features | VideoRemix.vip</title>
        <meta 
          name="description"
          content="Explore the powerful AI-driven marketing personalization features of VideoRemix.vip. Learn how our tools can transform your marketing campaigns."
        />
      </Helmet>

      <main className="pt-32 pb-20">
        <section className="py-16 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary-600/10 rounded-full blur-[100px] -z-10"></div>
            <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-primary-600/10 rounded-full blur-[100px] -z-10"></div>
          </div>

          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto mb-16 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <MagicSparkles minSparkles={5} maxSparkles={8}>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                    Powerful Features That <span className="text-primary-400">Transform</span> Your Videos
                  </h1>
                </MagicSparkles>
                
                <p className="text-xl text-gray-300 mb-8">
                  Discover the industry-leading tools that make VideoRemix.vip the ultimate platform for marketing personalization and campaign optimization.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-wrap justify-center gap-4"
              >
                <Link 
                  to="/pricing" 
                  className="bg-primary-600 hover:bg-primary-700 text-white py-3 px-6 rounded-lg font-bold inline-flex items-center"
                >
                  View Pricing
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
                
                <Link 
                  to="/contact" 
                  className="bg-gray-800 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-medium inline-flex items-center border border-gray-700"
                >
                  Request a Demo
                </Link>
              </motion.div>
            </div>
            
            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search features..."
                  className="w-full pl-10 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-white" />
                  </button>
                )}
              </div>
            </motion.div>
            
            {/* Category filter */}
            <div className="mb-10 flex justify-center overflow-x-auto pb-4">
              <div className="flex space-x-2">
                {categories.map(category => (
                  <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Features Grid */}
            {filteredFeatures.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredFeatures.map((feature, index) => (
                  <motion.div
                    key={`${feature.id}-${index}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
                    className="relative bg-gray-800 rounded-xl overflow-hidden group border border-gray-700 hover:border-primary-500/50 transition-all duration-300 shadow-lg h-full"
                    onMouseEnter={() => setHoveredFeature(feature.id)}
                    onMouseLeave={() => setHoveredFeature(null)}
                  >
                    {/* Feature image */}
                    {feature.image ? (
                      <div className="relative aspect-video overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10"></div>
                        <img 
                          src={feature.image} 
                          alt={feature.title} 
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                        />
                        
                        {/* Icon overlay */}
                        <div className="absolute top-4 left-4 z-20 bg-black/40 backdrop-blur-sm p-2 rounded-lg">
                          <div className="text-primary-400">
                            {feature.icon}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900">
                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent/20 z-10"></div>
                        
                        {/* Centered icon for features without images */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-primary-400 text-6xl">
                            {typeof feature.icon === 'string' ? feature.icon : 
                             feature.icon ? feature.icon : <Sparkles className="h-16 w-16" />}
                          </div>
                        </div>
                        
                        {/* Category badge */}
                        <div className="absolute top-4 left-4 z-20 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-primary-300">
                          {categories.find(c => c.id === feature.category)?.name || 'Feature'}
                        </div>
                      </div>
                    )}
                    
                    <div className="p-6 relative z-20">
                      <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-primary-400 transition-colors break-words">
                        {feature.title}
                      </h3>
                      <p className="text-gray-300 mb-6 break-words">
                        {feature.shortDescription}
                      </p>
                      
                      {feature.tags && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {feature.tags.slice(0, 3).map((tag, i) => (
                            <span 
                              key={i}
                              className="bg-gray-700/50 text-gray-300 text-xs px-2 py-1 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Link to feature page */}
                      {typeof feature.id === 'string' && featuresData.some(f => f.id === feature.id) ? (
                        <Link
                          to={`/features/${feature.id}`}
                          className="inline-flex items-center text-primary-400 hover:text-primary-300 font-medium"
                        >
                          Explore Feature
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      ) : (
                        <div className="flex justify-between items-center">
                          <Link
                            to="#learn-more"
                            className="inline-flex items-center text-primary-400 hover:text-primary-300 font-medium"
                          >
                            Learn More
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                          
                          {hoveredFeature === feature.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded"
                            >
                              <Check className="h-3 w-3 inline mr-1 text-primary-400" /> Included in Pro+
                            </motion.div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center"
              >
                <div className="inline-block mb-4">
                  <Search className="h-12 w-12 text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">No Features Found</h3>
                <p className="text-gray-400 mb-6">We couldn't find features matching "{searchQuery}"</p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="text-primary-400 hover:text-primary-300 font-medium"
                >
                  Clear Search & Filters
                </button>
              </motion.div>
            )}
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-primary-900/40 to-primary-700/40">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center"
            >
              <MagicSparkles minSparkles={5} maxSparkles={8}>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Ready to Transform Your Video Creation?
                </h2>
              </MagicSparkles>
              
              <p className="text-xl text-gray-300 mb-8">
                Join thousands of creators and businesses who have revolutionized their workflow with VideoRemix.vip's powerful features.
              </p>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block"
              >
                <Link 
                  to="/get-started" 
                  className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold py-4 px-8 rounded-lg inline-flex items-center shadow-lg shadow-primary-700/30"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </motion.div>
              
              <p className="text-gray-400 mt-4">
                No credit card required. Free 14-day trial.
              </p>
            </motion.div>
          </div>
        </section>
        
        {/* Feature Details Section */}
        <section className="py-20 bg-black relative">
          <div className="absolute inset-0 opacity-10 bg-grid-pattern"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                How Our Features Compare
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                VideoRemix.vip offers capabilities that outshine traditional marketing tools and other online platforms
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-900 rounded-xl overflow-hidden shadow-xl border border-gray-800">
                <thead>
                  <tr className="bg-primary-900 text-white">
                    <th className="py-4 px-6 text-left">Feature</th>
                    <th className="py-4 px-6 text-center">VideoRemix.vip</th>
                    <th className="py-4 px-6 text-center">Traditional Editors</th>
                    <th className="py-4 px-6 text-center">Other Online Tools</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "AI-powered video creation", videoremix: true, traditional: false, online: false },
                    { feature: "Automatic editing suggestions", videoremix: true, traditional: false, online: false },
                    { feature: "Content repurposing", videoremix: true, traditional: false, online: true },
                    { feature: "Smart templates", videoremix: true, traditional: false, online: true },
                    { feature: "Automated captions", videoremix: true, traditional: false, online: true },
                    { feature: "Team collaboration", videoremix: true, traditional: true, online: false },
                    { feature: "No technical skills required", videoremix: true, traditional: false, online: true },
                    { feature: "Direct social publishing", videoremix: true, traditional: false, online: true },
                    { feature: "4K export quality", videoremix: true, traditional: true, online: false },
                    { feature: "Advanced editing capabilities", videoremix: true, traditional: true, online: false },
                  ].map((row, index) => (
                    <tr 
                      key={index} 
                      className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-850'}
                    >
                      <td className="py-3 px-6 text-gray-300">{row.feature}</td>
                      <td className="py-3 px-6 text-center">
                        {row.videoremix ? 
                          <Check className="h-5 w-5 text-green-500 mx-auto" /> : 
                          <X className="h-5 w-5 text-red-500 mx-auto" />
                        }
                      </td>
                      <td className="py-3 px-6 text-center">
                        {row.traditional ? 
                          <Check className="h-5 w-5 text-gray-400 mx-auto" /> : 
                          <X className="h-5 w-5 text-red-500 mx-auto" />
                        }
                      </td>
                      <td className="py-3 px-6 text-center">
                        {row.online ? 
                          <Check className="h-5 w-5 text-gray-400 mx-auto" /> : 
                          <X className="h-5 w-5 text-red-500 mx-auto" />
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-8 text-center">
              <Link 
                to="/features/comparison" 
                className="text-primary-400 hover:text-primary-300 inline-flex items-center"
              >
                View Full Feature Comparison
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default FeatureListPage;