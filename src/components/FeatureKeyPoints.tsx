import React from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

interface FeatureKeyPointsProps {
  points: string[];
  benefits: {
    title: string;
    description: string;
  }[];
}

const FeatureKeyPoints: React.FC<FeatureKeyPointsProps> = ({ points, benefits }) => {
  return (
    <section className="py-20 bg-black relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-grid-pattern"></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block mb-3">
            <div className="bg-primary-500/20 text-primary-400 px-4 py-1.5 rounded-full text-sm font-semibold">
              KEY CAPABILITIES
            </div>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            How This Feature <span className="text-primary-400">Transforms</span> Your Workflow
          </h2>
          
          <p className="text-xl text-gray-300 mx-auto max-w-3xl">
            Discover the powerful capabilities that make this feature an essential part of your video creation toolkit.
          </p>
        </motion.div>
        
        {/* Key points grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {points.map((point, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
              whileHover={{ 
                scale: 1.03, 
                backgroundColor: "rgba(31, 41, 55, 0.7)",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                borderColor: "rgba(99, 102, 241, 0.4)"
              }}
              className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 flex items-start transition-all duration-200"
            >
              <motion.div 
                className="bg-primary-900/50 p-2 rounded-full mr-4 flex-shrink-0 mt-1"
                whileHover={{ 
                  rotate: [0, 15, -15, 0],
                  scale: 1.1,
                  backgroundColor: "rgba(79, 70, 229, 0.3)",
                }}
                transition={{ duration: 0.6 }}
              >
                <Check className="h-5 w-5 text-primary-400" />
              </motion.div>
              <span className="text-gray-300">{point}</span>
            </motion.div>
          ))}
        </div>
        
        {/* Benefits section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-2xl font-bold text-white text-center mb-10">
            Key Benefits
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                whileHover={{ 
                  y: -10,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
                  borderColor: "rgba(99, 102, 241, 0.3)"
                }}
                className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700 relative overflow-hidden group hover:border-primary-500/30 transition-all duration-300"
              >
                {/* Decorative background sparkle */}
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-primary-500/10 rounded-full blur-xl transform rotate-45 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <motion.div 
                    className="bg-primary-900/50 w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    whileHover={{ 
                      scale: 1.1,
                      rotate: [0, 5, -5, 0],
                      backgroundColor: "rgba(79, 70, 229, 0.3)",
                    }}
                  >
                    <Sparkles className="h-6 w-6 text-primary-400" />
                  </motion.div>
                  
                  <motion.h4 
                    className="text-xl font-bold text-white mb-3"
                    whileHover={{ x: 3 }}
                  >
                    {benefit.title}
                  </motion.h4>
                  <motion.p 
                    className="text-gray-400"
                    whileHover={{ x: 3 }}
                  >
                    {benefit.description}
                  </motion.p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeatureKeyPoints;