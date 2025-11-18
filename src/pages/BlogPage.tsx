import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ChevronRight, Calendar, User, Tag, Clock, ArrowRight, Search } from 'lucide-react';
import MagicSparkles from '../components/MagicSparkles';

// Blog post data
const blogPosts = [
  {
    id: 'ai-video-revolution',
    title: 'How AI is Revolutionizing Video Creation in 2025',
    excerpt: 'Discover how artificial intelligence is transforming the video production landscape and making professional video creation accessible to everyone.',
    category: 'Technology',
    author: 'Sarah Johnson',
    authorImage: 'https://randomuser.me/api/portraits/women/44.jpg',
    date: 'May 15, 2025',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1616469829941-c7200edec809?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    featured: true
  },
  {
    id: 'video-marketing-tips',
    title: '10 Video Marketing Tips to Boost Engagement and Conversions',
    excerpt: 'Learn proven strategies to create videos that not only capture attention but drive meaningful engagement and conversions for your business.',
    category: 'Marketing',
    author: 'David Chen',
    authorImage: 'https://randomuser.me/api/portraits/men/32.jpg',
    date: 'May 8, 2025',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    featured: false
  },
  {
    id: 'content-repurposing',
    title: 'Content Repurposing: Turn One Video into Multiple Content Pieces',
    excerpt: 'Maximize your content strategy by learning how to efficiently transform a single video into dozens of engaging content pieces for every platform.',
    category: 'Strategy',
    author: 'Emma Rodriguez',
    authorImage: 'https://randomuser.me/api/portraits/women/63.jpg',
    date: 'April 29, 2025',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1592859600972-1b0834d83747?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    featured: false
  },
  {
    id: 'video-seo-guide',
    title: 'The Ultimate Guide to Video SEO in 2025',
    excerpt: 'Master the latest techniques to optimize your videos for search engines and dramatically increase your organic visibility and traffic.',
    category: 'SEO',
    author: 'Michael Wilson',
    authorImage: 'https://randomuser.me/api/portraits/men/68.jpg',
    date: 'April 22, 2025',
    readTime: '10 min read',
    image: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    featured: false
  },
  {
    id: 'video-storytelling',
    title: 'The Art of Video Storytelling: Connecting with Your Audience',
    excerpt: 'Explore how effective storytelling in your videos can create emotional connections with viewers and build lasting brand loyalty.',
    category: 'Creativity',
    author: 'Olivia Martinez',
    authorImage: 'https://randomuser.me/api/portraits/women/33.jpg',
    date: 'April 15, 2025',
    readTime: '9 min read',
    image: 'https://images.unsplash.com/photo-1585647347384-2b64cc9277ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    featured: false
  },
  {
    id: 'video-analytics',
    title: 'Video Analytics: Understanding What Makes Your Content Perform',
    excerpt: 'Learn how to leverage data and metrics to measure video performance and create content that resonates with your target audience.',
    category: 'Analytics',
    author: 'James Peterson',
    authorImage: 'https://randomuser.me/api/portraits/men/45.jpg',
    date: 'April 8, 2025',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    featured: false
  }
];

// Categories for filter
const categories = [
  { id: 'all', name: 'All Topics' },
  { id: 'technology', name: 'Technology' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'strategy', name: 'Strategy' },
  { id: 'seo', name: 'SEO' },
  { id: 'creativity', name: 'Creativity' },
  { id: 'analytics', name: 'Analytics' }
];

const BlogPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Featured post is the first item
  const featuredPost = blogPosts[0];
  
  // Filter posts based on category and search
  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category.toLowerCase() === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <Helmet>
        <title>Blog | VideoRemix.vip</title>
        <meta 
          name="description" 
          content="Explore articles, tips, and insights about video creation, editing, and marketing from the VideoRemix.vip team." 
        />
      </Helmet>

      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="py-16 relative overflow-hidden">
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
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                    VideoRemix.vip Blog
                  </h1>
                </MagicSparkles>
                
                <p className="text-xl text-gray-300 mb-8">
                  Insights, tips, and strategies to elevate your video content creation
                </p>
              </motion.div>
              
              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="max-w-2xl mx-auto"
              >
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-500" />
                  </div>
                  <input 
                    type="text" 
                    className="bg-gray-800/80 backdrop-blur-sm w-full pl-10 pr-4 py-3 rounded-lg border border-gray-700 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </motion.div>
            </div>
            
            {/* Featured Post */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="mb-20"
            >
              <div className="relative">
                {/* Featured badge */}
                <div className="absolute top-4 left-4 z-10">
                  <div className="bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    FEATURED
                  </div>
                </div>
                
                <Link to={`/blog/${featuredPost.id}`} className="block">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700 hover:border-primary-500/50 transition-colors duration-300">
                    {/* Image */}
                    <div className="relative aspect-video lg:aspect-auto lg:h-full">
                      <img 
                        src={featuredPost.image} 
                        alt={featuredPost.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60"></div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-6 lg:p-10 flex flex-col justify-center">
                      <div className="flex items-center mb-4">
                        <span className="bg-gray-700 text-primary-400 text-xs font-bold px-3 py-1 rounded-full">
                          {featuredPost.category}
                        </span>
                        <span className="text-gray-400 text-sm ml-4 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {featuredPost.readTime}
                        </span>
                      </div>
                      
                      <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                        {featuredPost.title}
                      </h2>
                      
                      <p className="text-gray-300 mb-6">
                        {featuredPost.excerpt}
                      </p>
                      
                      <div className="flex items-center mt-auto">
                        <img 
                          src={featuredPost.authorImage}
                          alt={featuredPost.author}
                          className="w-10 h-10 rounded-full mr-3 object-cover"
                        />
                        <div>
                          <p className="text-white font-medium">{featuredPost.author}</p>
                          <p className="text-gray-400 text-sm">{featuredPost.date}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </motion.div>
            
            {/* Category Filters */}
            <div className="mb-8 overflow-x-auto hide-scrollbar">
              <div className="flex space-x-2 p-1 min-w-max">
                {categories.map((category) => (
                  <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-primary-600 text-white shadow'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Blog Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.slice(1).map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                >
                  <Link to={`/blog/${post.id}`} className="group">
                    <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700 h-full flex flex-col hover:border-primary-500/50 transition-colors duration-300">
                      {/* Image */}
                      <div className="relative aspect-video">
                        <img 
                          src={post.image} 
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60"></div>
                        
                        {/* Category badge */}
                        <div className="absolute top-4 left-4">
                          <span className="bg-gray-900/80 backdrop-blur-sm text-primary-400 text-xs font-bold px-3 py-1 rounded-full">
                            {post.category}
                          </span>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="p-6 flex-grow flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary-400 transition-colors duration-200">
                          {post.title}
                        </h3>
                        
                        <p className="text-gray-400 mb-6 flex-grow">
                          {post.excerpt}
                        </p>
                        
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center">
                            <img 
                              src={post.authorImage}
                              alt={post.author}
                              className="w-8 h-8 rounded-full mr-2 object-cover"
                            />
                            <span className="text-gray-300 text-sm">{post.author}</span>
                          </div>
                          
                          <div className="flex items-center text-gray-500 text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {post.readTime}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            
            {/* No Results */}
            {filteredPosts.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 bg-gray-800/50 rounded-xl border border-gray-700"
              >
                <div className="inline-block mb-4">
                  <Search className="h-12 w-12 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No articles found</h3>
                <p className="text-gray-400 mb-6">No articles match your current filters</p>
                <button 
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="text-primary-400 hover:text-primary-300 font-medium"
                >
                  Reset filters
                </button>
              </motion.div>
            )}
            
            {/* Load More Button */}
            {filteredPosts.length > 6 && (
              <div className="text-center mt-12">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-6 py-3 rounded-lg inline-flex items-center border border-gray-700"
                >
                  Load More Articles
                  <ArrowRight className="ml-2 h-5 w-5" />
                </motion.button>
              </div>
            )}
          </div>
        </section>
        
        {/* Newsletter Section */}
        <section className="py-16 bg-gradient-to-r from-primary-900/40 to-primary-700/40 relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent"></div>
          
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="max-w-4xl mx-auto text-center"
            >
              <MagicSparkles minSparkles={3} maxSparkles={6}>
                <h2 className="text-3xl font-bold text-white mb-6">
                  Subscribe to Our Newsletter
                </h2>
              </MagicSparkles>
              
              <p className="text-xl text-gray-300 mb-8">
                Get weekly insights on video creation, AI technology, and content strategy delivered straight to your inbox.
              </p>
              
              <div className="max-w-xl mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-3 flex-grow text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white text-primary-600 hover:bg-gray-100 font-bold py-3 px-6 rounded-lg"
                  >
                    Subscribe
                  </motion.button>
                </div>
                <p className="text-gray-400 text-sm mt-3">
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default BlogPage;