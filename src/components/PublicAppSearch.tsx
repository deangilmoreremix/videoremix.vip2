import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, ArrowRight, Lock, Star, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApps } from '../hooks/useApps';
import { useAuth } from '../context/AuthContext';
import LazyIcon from './LazyIcon';
import { AppGridSkeleton } from './LoadingSkeleton';

// Available categories for filtering
const categories = [
  { id: 'all', name: 'All Categories', icon: 'layers' },
  { id: 'video', name: 'Video', icon: 'video' },
  { id: 'ai-image', name: 'AI Image', icon: 'image' },
  { id: 'personalizer', name: 'Personalization', icon: 'user-circle' },
  { id: 'marketing', name: 'Marketing', icon: 'users' },
  { id: 'branding', name: 'Branding', icon: 'palette' },
  { id: 'creative', name: 'Creative', icon: 'package' }
];

const PublicAppSearch: React.FC = () => {
  const { user } = useAuth();
  const { apps, loading } = useApps();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Input validation and sanitization
  const sanitizedSearchQuery = useMemo(() => {
    if (!searchQuery.trim()) return '';
    // Remove potentially harmful characters and limit length
    return searchQuery.trim().replace(/[<>\"'&]/g, '').substring(0, 100);
  }, [searchQuery]);

  // Filter apps based on visibility, search, and category
  const filteredApps = useMemo(() => {
    let result = apps.filter(app => {
      // Public apps are visible to everyone
      if (app.isPublic) return true;

      // Private apps only visible to logged-in users
      return user && true; // Could add more complex logic here
    });

    // Apply search filter with sanitized input
    if (sanitizedSearchQuery) {
      const query = sanitizedSearchQuery.toLowerCase();
      result = result.filter(app =>
        app.name.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query) ||
        app.category.toLowerCase().includes(query)
      );
    }

    // Apply category filter with validation
    if (selectedCategory !== 'all' && categories.some(cat => cat.id === selectedCategory)) {
      result = result.filter(app => app.category === selectedCategory);
    }

    return result;
  }, [apps, user, sanitizedSearchQuery, selectedCategory]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header skeleton */}
          <div className="text-center mb-12">
            <div className="h-12 bg-gray-700 rounded w-96 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-700 rounded w-2/3 mx-auto animate-pulse"></div>
          </div>

          {/* Search skeleton */}
          <div className="mb-8">
            <div className="flex gap-4">
              <div className="flex-1 h-12 bg-gray-800 rounded-xl animate-pulse"></div>
              <div className="w-32 h-12 bg-gray-800 rounded-xl animate-pulse"></div>
            </div>
          </div>

          {/* Apps grid skeleton */}
          <AppGridSkeleton count={9} />
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Discover Our
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400">
              {" "}Complete Toolkit
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto"
          >
            Search and explore our full range of AI-powered tools. Find the perfect solution for your creative needs.
          </motion.p>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tools by name, description, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-6 py-4 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white hover:bg-gray-800/70 transition-colors"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
              {(searchQuery || selectedCategory !== 'all') && (
                <span className="ml-2 px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded-full">
                  Active
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 p-6 bg-gray-800/30 rounded-xl border border-gray-700/50"
              >
                <div className="flex flex-wrap gap-3 mb-4">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700/70 border border-gray-600/50'
                      }`}
                    >
                      <LazyIcon name={category.icon} className="h-4 w-4 mr-2" />
                      {category.name}
                    </button>
                  ))}
                </div>

                {(searchQuery || selectedCategory !== 'all') && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      {searchQuery && (
                        <span>Search: "{searchQuery}"</span>
                      )}
                      {selectedCategory !== 'all' && (
                        <span>
                          Category: {categories.find(c => c.id === selectedCategory)?.name}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={clearFilters}
                      className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Summary */}
        <div className="mb-8 flex items-center justify-between">
          <div className="text-gray-400">
            {filteredApps.length === 0 ? (
              <span>No tools found matching your criteria</span>
            ) : (
              <span>
                Showing {filteredApps.length} tool{filteredApps.length !== 1 ? 's' : ''}
                {(searchQuery || selectedCategory !== 'all') && (
                  <span className="text-primary-400 ml-2">
                    (filtered from {apps.filter(app => app.isPublic || user).length} total)
                  </span>
                )}
              </span>
            )}
          </div>

          {!user && filteredApps.some(app => !app.isPublic) && (
            <div className="text-sm text-gray-500 flex items-center">
              <Lock className="h-4 w-4 mr-1" />
              Some tools require sign-in
            </div>
          )}
        </div>

        {/* Apps Grid */}
        {filteredApps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredApps.map((app, index) => {
              const canAccess = app.isPublic || user;
              const isPreview = !canAccess;

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.05 * index }}
                  className={`group relative bg-gray-800/50 backdrop-blur-sm rounded-xl border transition-all duration-300 overflow-hidden ${
                    isPreview
                      ? 'border-gray-700/50 opacity-75'
                      : 'border-gray-700/50 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10'
                  }`}
                >
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          isPreview
                            ? 'bg-gray-700/50'
                            : 'bg-primary-500/10 group-hover:bg-primary-500/20'
                        } transition-colors`}>
                          <LazyIcon
                            name={app.iconName}
                            className={`h-5 w-5 ${
                              isPreview ? 'text-gray-500' : 'text-primary-400'
                            }`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className={`text-base font-semibold truncate ${
                            isPreview
                              ? 'text-gray-400'
                              : 'text-white group-hover:text-primary-400'
                          } transition-colors`}>
                            {app.name}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            {app.popular && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-500/10 text-yellow-400">
                                <Star className="h-3 w-3 mr-1" />
                                Popular
                              </span>
                            )}
                            {app.new && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400">
                                <Sparkles className="h-3 w-3 mr-1" />
                                New
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isPreview && (
                        <Lock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {app.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                        {app.category}
                      </span>

                      {canAccess ? (
                        <Link
                          to={`/app/${app.id}`}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                        >
                          Open
                          <ArrowRight className="ml-1.5 h-4 w-4" />
                        </Link>
                      ) : (
                        <Link
                          to="/sign-in"
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-400 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 rounded-lg transition-colors"
                        >
                          <Lock className="mr-1.5 h-4 w-4" />
                          Sign In
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Hover Effect */}
                  {canAccess && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <Search className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No tools found
              </h3>
              <p className="text-gray-400 mb-6">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-6 py-3 text-primary-400 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 rounded-lg transition-colors"
              >
                Clear filters
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PublicAppSearch;