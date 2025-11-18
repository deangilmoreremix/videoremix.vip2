import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface UseCase {
  title: string;
  description: string;
  points: string[];
}

interface FeatureUseCasesProps {
  useCases: UseCase[];
}

const FeatureUseCases: React.FC<FeatureUseCasesProps> = ({ useCases }) => {
  return (
    <section className="py-20 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>
      
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
              USE CASES
            </div>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Who Benefits from This Feature
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover how different professionals and industries are leveraging this powerful capability.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              whileHover={{ 
                y: -10, 
                boxShadow: "0px 20px 40px -15px rgba(0, 0, 0, 0.3)",
                borderColor: "rgba(99, 102, 241, 0.4)",
              }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden transition-all duration-300"
            >
              {/* Header */}
              <motion.div 
                className="bg-gradient-to-r from-primary-900 to-primary-700 px-6 py-5 border-b border-primary-600/30"
                whileHover={{
                  backgroundImage: "linear-gradient(to right, rgba(67, 56, 202, 1), rgba(79, 70, 229, 1))"
                }}
              >
                <motion.h3 
                  className="text-xl font-bold text-white"
                  whileHover={{ x: 3 }}
                >
                  {useCase.title}
                </motion.h3>
              </motion.div>
              
              {/* Body */}
              <div className="p-6">
                <p className="text-gray-300 mb-6">{useCase.description}</p>
                
                <div className="space-y-3">
                  {useCase.points.map((point, i) => (
                    <motion.div 
                      key={i} 
                      className="flex items-start"
                      whileHover={{ 
                        x: 5,
                        transition: { duration: 0.2 }
                      }}
                    >
                      <motion.div 
                        className="bg-primary-900/50 p-1 rounded-full mr-3 mt-1.5 flex-shrink-0"
                        whileHover={{ 
                          rotate: [0, 10, -10, 0],
                          scale: 1.1,
                          backgroundColor: "rgba(79, 70, 229, 0.3)",
                          transition: { duration: 0.4 }
                        }}
                      >
                        <Check className="h-3 w-3 text-primary-400" />
                      </motion.div>
                      <span className="text-gray-400 text-sm">{point}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureUseCases;