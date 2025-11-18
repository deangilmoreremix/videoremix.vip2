import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import MagicSparkles from './MagicSparkles';

interface FeatureCTAProps {
  title?: string;
  relatedFeatures?: {
    id: string;
    title: string;
  }[];
}

const FeatureCTA: React.FC<FeatureCTAProps> = ({ 
  title = "Ready to Transform Your Video Creation Process?",
  relatedFeatures = []
}) => {
  return (
    <section className="py-20 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px]"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center bg-gradient-to-r from-primary-900/40 to-primary-700/40 p-8 rounded-xl border border-primary-500/30"
          whileHover={{ 
            y: -10,
            boxShadow: "0 20px 25px -5px rgba(79, 70, 229, 0.2)",
            borderColor: "rgba(99, 102, 241, 0.5)",
          }}
        >
          <MagicSparkles speed="fast" minSparkles={3} maxSparkles={6} colors={['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe']}>
            <h3 className="text-2xl font-bold text-white mb-4">
              {title}
            </h3>
          </MagicSparkles>
          
          <p className="text-gray-300 mb-8">
            Join thousands of creators and businesses who have revolutionized their video production with VideoRemix.vip's powerful features.
          </p>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mb-8"
          >
            <motion.div
              whileHover={{ 
                boxShadow: "0 0 25px 5px rgba(99, 102, 241, 0.4)"
              }}
              className="inline-block"
            >
              <Link 
                to="/get-started" 
                className="inline-flex items-center bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold px-8 py-4 rounded-lg shadow-lg shadow-primary-600/20"
              >
                <span>Try VideoRemix.vip Today</span>
                <motion.div 
                  animate={{ 
                    x: [0, 5, 0],
                    transition: { repeat: Infinity, duration: 1.5 }
                  }}
                >
                  <ArrowRight className="ml-2 h-5 w-5" />
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
          
          <p className="text-gray-500 text-sm mb-6">
            No credit card required. 14-day free trial on all premium features.
          </p>
          
          {/* Related features */}
          {relatedFeatures.length > 0 && (
            <div>
              <h4 className="text-white font-medium mb-4 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary-400 mr-2" />
                <span>Explore Related Features</span>
              </h4>
              
              <div className="flex flex-wrap justify-center gap-3">
                {relatedFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ 
                      scale: 1.05, 
                      y: -3,
                      backgroundColor: "rgba(255, 255, 255, 0.15)",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Link
                      to={`/features/${feature.id}`}
                      className="bg-white/10 hover:bg-white/15 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm transition-colors duration-200"
                    >
                      {feature.title}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default FeatureCTA;