import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, FileText, Sparkles, ArrowRight, Wand2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import usePurchases from '../../hooks/usePurchases';
import { useApps } from '../../hooks/useApps';
import MagicSparkles from '../MagicSparkles';

// Helper function to get app URL
const getAppUrl = (appId: string, apps: any[]) => {
  const app = apps.find(a => a.id === appId);
  return app?.url || `/app/${appId}`;
};

const DashboardPersonalizerSection: React.FC = () => {
  const { user } = useAuth();
  const { purchasedApps, hasAnyPurchases } = usePurchases();
  const { apps: appsData, loading: appsLoading } = useApps();

  const personalizerApps = appsData.filter(app =>
    app.category === 'personalizer' &&
    (!user || purchasedApps.includes(app.id))
  );

  const specificPersonalizerApps = [
    'personalizer-text-ai-editor',
    'personalizer-url-video-generation',
    'personalizer-video-image-transformer',
    'ai-signature',
    'personalizer-advanced-text-video-editor',
    'interactive-shopping',
    'personalizer-recorder',
    'thumbnail-generator',
    'personalizer-writing-toolkit'
  ];

  const filteredPersonalizerApps = personalizerApps.filter(app =>
    specificPersonalizerApps.includes(app.id)
  );

  if (!user || !hasAnyPurchases || filteredPersonalizerApps.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-black relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-grid-pattern"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px]"></div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto mb-12 text-center"
        >
          <MagicSparkles minSparkles={5} maxSparkles={10}>
            <div className="inline-block mb-4">
              <div className="bg-gradient-to-r from-primary-600 to-primary-400 text-white font-bold px-6 py-2 rounded-full">
                <Wand2 className="inline-block mr-2 h-5 w-5" />
                PERSONALIZER SUITE
              </div>
            </div>
          </MagicSparkles>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Your <span className="text-primary-400">Personalizer</span> Tools
          </h2>

          <p className="text-xl text-gray-300 mb-8">
            Advanced personalization tools to create highly targeted content
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredPersonalizerApps.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                whileHover={{ y: -10 }}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 hover:border-primary-500/50 transition-colors shadow-lg group"
              >
                <a href={getAppUrl(app.id, appsData)} className="block">
                  <div className="relative h-[180px]">
                    <img
                      src={app.image}
                      alt={app.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

                    <div className="absolute top-3 left-3 bg-primary-600/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                      Personalizer
                    </div>

                    {app.popular && (
                      <div className="absolute top-3 right-3 bg-yellow-500 text-black text-xs px-2 py-0.5 rounded font-bold">
                        POPULAR
                      </div>
                    )}

                    {app.new && (
                      <div className="absolute top-3 right-3 bg-green-500 text-black text-xs px-2 py-0.5 rounded font-bold">
                        NEW
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h4 className="text-white font-bold text-lg mb-2 group-hover:text-primary-400 transition-colors">
                      {app.name}
                    </h4>
                    <p className="text-gray-400 text-sm mb-4">{app.description}</p>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {React.isValidElement(app.icon) ?
                          React.cloneElement(app.icon as React.ReactElement, { className: "h-4 w-4 text-primary-400 mr-1" })
                          : <Sparkles className="h-4 w-4 text-primary-400 mr-1" />}
                        <span className="text-gray-500 text-xs">Personalizer Tool</span>
                      </div>

                      <span className="text-primary-400 text-sm font-medium flex items-center">
                        Use Tool
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </span>
                    </div>
                  </div>
                </a>

                <div className="absolute inset-0 bg-primary-900/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center rounded-xl">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white text-gray-900 font-bold py-3 px-6 rounded-lg flex items-center"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = getAppUrl(app.id, appsData);
                    }}
                  >
                    <Wand2 className="h-5 w-5 mr-2" />
                    Open Tool
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {filteredPersonalizerApps.length > 6 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-10"
          >
            <Link
              to="/tools"
              className="inline-flex items-center bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold px-8 py-4 rounded-lg shadow-lg shadow-primary-600/20"
            >
              View All Personalizer Tools
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default DashboardPersonalizerSection;
