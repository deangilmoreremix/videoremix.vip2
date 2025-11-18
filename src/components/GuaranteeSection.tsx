import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Check, ArrowRight } from 'lucide-react';

const GuaranteeSection: React.FC = () => {
  return (
    <section className="py-16 bg-black relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/3 mb-6 md:mb-0 flex justify-center">
                  <motion.div
                    animate={{
                      rotate: [0, 5, 0, -5, 0],
                      scale: [1, 1.02, 1, 1.02, 1]
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      repeatType: "loop"
                    }}
                    className="relative"
                    whileHover={{ 
                      scale: 1.05,
                      transition: { type: "spring", stiffness: 300, damping: 10 }
                    }}
                  >
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 blur-xl opacity-30 rounded-full"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        repeatType: "reverse" 
                      }}
                    ></motion.div>
                    <div className="relative bg-gradient-to-br from-primary-600/80 to-primary-700 w-40 h-40 rounded-full flex items-center justify-center shadow-lg">
                      <Shield className="h-20 w-20 text-white" />
                    </div>
                  </motion.div>
                </div>
                
                <div className="md:w-2/3 md:pl-8">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 text-center md:text-left">
                    Risk-Free Trial with Full Platform Support
                  </h3>

                  <p className="text-gray-300 mb-6">
                    Start using VideoRemix with confidence. Try our platform with a free account or paid trial. Our dedicated support team is here to help you succeed with personalized marketing.
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    {[
                      "Free plan available to get started",
                      "Comprehensive onboarding and tutorials",
                      "Dedicated support team available 24/7",
                      "Regular platform updates and new features"
                    ].map((item, i) => (
                      <motion.div 
                        key={i} 
                        className="flex items-start"
                        whileHover={{ 
                          x: 10,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <motion.div
                          whileHover={{ 
                            rotate: [0, 10, -10, 0],
                            scale: 1.2,
                            transition: { duration: 0.5 }
                          }}
                          className="flex-shrink-0 mr-3 mt-0.5"
                        >
                          <Check className="h-5 w-5 text-green-500" />
                        </motion.div>
                        <span className="text-gray-300">{item}</span>
                      </motion.div>
                    ))}
                  </div>
                  
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="text-center md:text-left"
                  >
                    <motion.a
                      href="#pricing" 
                      className="inline-flex items-center bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold px-6 py-3 rounded-lg shadow-lg"
                      whileHover={{ 
                        boxShadow: "0 20px 25px -5px rgba(79, 70, 229, 0.3)"
                      }}
                    >
                      <span>Try Risk-Free Today</span>
                      <motion.div
                        animate={{ 
                          x: [0, 5, 0],
                          transition: { repeat: Infinity, duration: 1.5 }
                        }}
                      >
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </motion.div>
                    </motion.a>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default GuaranteeSection;