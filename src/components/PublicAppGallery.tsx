import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Sparkles, ArrowRight, Lock } from "lucide-react";
import { useApps } from "../hooks/useApps";
import { useAuth } from "../context/AuthContext";
import LazyIcon from "./LazyIcon";
import ErrorBoundary from "./ErrorBoundary";

const PublicAppGallery: React.FC = () => {
  const { user } = useAuth();
  const { apps, loading } = useApps();

  // Get featured public apps
  const featuredPublicApps = apps
    .filter((app) => app.isPublic && (app.popular || app.new))
    .slice(0, 6); // Show top 6

  if (loading) {
    return (
      <div className="py-20">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-t-2 border-primary-500 border-solid rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (featuredPublicApps.length === 0) {
    return null; // Don't show if no public apps
  }

  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6"
          >
            <Sparkles className="h-4 w-4 text-primary-400 mr-2" />
            <span className="text-primary-400 text-sm font-medium">
              Featured Tools
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Powerful Tools for
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400">
              {" "}
              Content Creation
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-400 max-w-3xl mx-auto"
          >
            Discover our most popular tools. Create stunning content with
            AI-powered features designed for creators and businesses.
          </motion.p>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {featuredPublicApps.map((app, index) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className="group relative bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 hover:border-primary-500/50 transition-all duration-300 overflow-hidden"
            >
              {/* App Preview */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary-500/10 rounded-lg">
                      <LazyIcon
                        name={app.iconName}
                        className="h-6 w-6 text-primary-400"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors">
                        {app.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {app.popular && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                            <Star className="h-3 w-3 mr-1" />
                            Popular
                          </span>
                        )}
                        {app.new && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                            <Sparkles className="h-3 w-3 mr-1" />
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {app.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    {app.category}
                  </span>

                  {user ? (
                    <Link
                      to={`/app/${app.id}`}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors group-hover:shadow-lg group-hover:shadow-primary-500/25"
                    >
                      Open Tool
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  ) : (
                    <Link
                      to="/sign-in"
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-400 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 rounded-lg transition-colors"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Sign In to Access
                    </Link>
                  )}
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 rounded-2xl border border-primary-500/20 p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Create Amazing Content?
            </h3>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              Join thousands of creators who trust our tools to bring their
              ideas to life. Sign up today and unlock the full potential of
              AI-powered content creation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/sign-up"
                className="inline-flex items-center px-8 py-3 text-lg font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-primary-500/25"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center px-8 py-3 text-lg font-semibold text-gray-300 bg-gray-800/50 hover:bg-gray-800/70 border border-gray-600 rounded-xl transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Wrap with error boundary for production resilience
const PublicAppGalleryWithErrorBoundary = (props: any) => (
  <ErrorBoundary
    fallback={
      <div className="py-20 text-center">
        <div className="max-w-md mx-auto">
          <h3 className="text-xl font-semibold text-white mb-2">
            Unable to load app gallery
          </h3>
          <p className="text-gray-400">Please refresh the page to try again.</p>
        </div>
      </div>
    }
  >
    <PublicAppGallery {...props} />
  </ErrorBoundary>
);

export default PublicAppGalleryWithErrorBoundary;
