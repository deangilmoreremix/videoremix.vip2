import React from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';

interface Stat {
  value: string;
  label: string;
}

interface FeatureStatsProps {
  stats: Stat[];
  title?: string;
  subtitle?: string;
}

const FeatureStats: React.FC<FeatureStatsProps> = ({ 
  stats, 
  title = "The Impact", 
  subtitle = "See the real-world results users achieve with this feature." 
}) => {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
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
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {title}
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {subtitle}
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {stats.map((stat, index) => {
            // Parse numeric part from the value (e.g. "80%" -> 80)
            const numericValue = parseInt(stat.value.replace(/[^0-9.]/g, ''));
            const suffix = stat.value.replace(/[0-9.]/g, '');
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                whileHover={{ 
                  y: -15,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
                  borderColor: "rgba(99, 102, 241, 0.4)",
                  transition: { type: "spring", stiffness: 300, damping: 15 }
                }}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 text-center"
              >
                <motion.div 
                  className="bg-gradient-to-br from-primary-600/20 to-primary-400/10 p-4 rounded-xl mb-4 inline-block"
                  whileHover={{ 
                    rotate: [0, 5, -5, 0],
                    scale: 1.1,
                    background: "radial-gradient(circle at center, rgba(99, 102, 241, 0.3) 0%, rgba(99, 102, 241, 0.1) 80%)",
                    transition: { duration: 0.5 }
                  }}
                >
                  <motion.div 
                    className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-primary-300 to-primary-500"
                    whileHover={{ 
                      scale: 1.1,
                      textShadow: "0 0 8px rgba(99, 102, 241, 0.5)"
                    }}
                  >
                    <CountUp 
                      end={numericValue || 0} 
                      duration={2.5} 
                      suffix={suffix} 
                    />
                  </motion.div>
                </motion.div>
                <motion.div 
                  className="text-gray-300"
                  whileHover={{ scale: 1.05 }}
                >
                  {stat.label}
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeatureStats;