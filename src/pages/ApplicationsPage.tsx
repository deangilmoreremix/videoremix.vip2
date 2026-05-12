import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApps } from '../hooks/useApps';
import { useAuth } from '../context/AuthContext';
import { useUserAccess } from '../hooks/useUserAccess';
import LazyIcon from '../components/LazyIcon';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

const ApplicationsPage: React.FC = () => {
  const { apps, loading, error } = useApps();
  const { user } = useAuth();
  const { hasAccessToApp } = useUserAccess();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-primary-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-red-400">
          <p className="text-xl mb-2">Error loading applications</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pt-24">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            All <span className="text-primary-400">Applications</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto"
          >
            Browse our complete catalog of AI-powered applications. 
            {user ? 'All GTM information is visible for each app.' : 'Sign in to see detailed app information.'}
          </motion.p>
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Link to="/signin">
                <Button size="lg" className="bg-primary-600 hover:bg-primary-700">
                  Sign In to View Details
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* Apps Grid */}
      <section className="py-16 container mx-auto px-4">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Application Catalog</h2>
          <p className="text-gray-400">
            {apps.length} applications available • {user ? 'GTM details visible' : 'Sign in for full access'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {apps.map((app, index) => {
            const isPurchased = user && hasAccessToApp(app.id);
            
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
              >
                <Card className="overflow-hidden bg-gray-800 border-gray-700 hover:border-primary-500/50 transition-all duration-300 h-full">
                  {/* App Image */}
                  <div className="relative aspect-video overflow-hidden">
                    <img 
                      src={app.image || app.demoImage || 'https://via.placeholder.com/400x225'} 
                      alt={app.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                    
                    {/* Status Badges */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1">
                      {isPurchased && (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded font-bold flex items-center">
                          OWNED
                        </span>
                      )}
                      {!isPurchased && user && (
                        <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded font-bold flex items-center">
                          LOCKED
                        </span>
                      )}
                      {app.popular && (
                        <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded font-bold">
                          POPULAR
                        </span>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-4">
                    {/* App Info */}
                    <div className="flex items-center mb-2">
                      <LazyIcon name={app.iconName} className="w-5 h-5 text-primary-400 mr-2" />
                      <h3 className="text-lg font-bold text-white">{app.name}</h3>
                    </div>
                    
                    {/* GTM: Short Description */}
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {app.description}
                    </p>

                    {/* GTM: Benefits (if available) */}
                    {app.benefits && app.benefits.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Key Benefits</h4>
                        <ul className="text-xs text-gray-400 space-y-1">
                          {app.benefits.slice(0, 3).map((benefit: string, i: number) => (
                            <li key={i} className="flex items-start">
                              <span className="text-primary-400 mr-1">✓</span>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* GTM: Features (if available) */}
                    {app.features && app.features.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Features</h4>
                        <p className="text-xs text-gray-400">
                          {app.features.length} feature{app.features.length !== 1 ? 's' : ''} included
                        </p>
                      </div>
                    )}

                    {/* GTM: Use Cases (if available) */}
                    {app.use_cases && app.use_cases.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Use Cases</h4>
                        <div className="flex flex-wrap gap-1">
                          {app.use_cases.slice(0, 3).map((useCase: string, i: number) => (
                            <span key={i} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                              {useCase}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Price & Action */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                      <div>
                        <span className="text-2xl font-bold text-white">${app.price || 97}</span>
                        <span className="text-gray-400 text-sm ml-1">/app</span>
                      </div>
                      
                      <Link to={`/app/${app.id}`}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-primary-500 text-primary-400 hover:bg-primary-500/10"
                        >
                          {isPurchased ? 'Open' : 'View Details'}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default ApplicationsPage;