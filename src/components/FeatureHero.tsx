import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';
import MagicSparkles from './MagicSparkles';

interface FeatureHeroProps {
  title: string;
  description: string;
  image: string;
  icon: React.ReactNode;
  videoUrl?: string;
}

const FeatureHero: React.FC<FeatureHeroProps> = ({
  title,
  description,
  image,
  icon,
  videoUrl
}) => {
  return (
    <section className="pt-32 pb-20 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black -z-10"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-700/20 rounded-full blur-[100px] -z-10"></div>
      
      <div className="container mx-auto px-4 relative">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2">
            <motion.div 
              className="mb-6"
              whileHover={{ x: -5, transition: { duration: 0.2 } }}
            >
              <Link 
                to="/features" 
                className="inline-flex items-center text-primary-400 hover:text-primary-300 font-medium"
              >
                <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                Back to All Features
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div 
                className="inline-block mb-4"
                whileHover={{ 
                  scale: 1.05,
                  backgroundColor: "rgba(99, 102, 241, 0.15)",
                  transition: { duration: 0.2 }
                }}
              >
                <div className="bg-primary-600/20 text-primary-400 px-4 py-1.5 rounded-full text-sm font-semibold flex items-center">
                  {icon}
                  <span className="ml-2">POWERFUL FEATURE</span>
                </div>
              </motion.div>
              
              <MagicSparkles minSparkles={3} maxSparkles={6} colors={['#6366f1', '#818cf8', '#f472b6', '#ec4899']}>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                  {title}
                </h1>
              </MagicSparkles>
              
              <motion.p 
                className="text-xl text-gray-300 mb-8"
                whileHover={{ x: 5, transition: { duration: 0.2 } }}
              >
                {description}
              </motion.p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <motion.button
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 20px 25px -5px rgba(79, 70, 229, 0.3)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold px-8 py-4 rounded-lg flex items-center justify-center"
                >
                  Try This Feature
                  <motion.div
                    animate={{ 
                      x: [0, 5, 0],
                      transition: { repeat: Infinity, duration: 1.5 }
                    }}
                  >
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </motion.div>
                </motion.button>
                
                <motion.button
                  whileHover={{ 
                    scale: 1.05,
                    backgroundColor: "rgba(31, 41, 55, 0.8)",
                    borderColor: "rgba(107, 114, 128, 0.5)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-8 py-4 rounded-lg flex items-center justify-center border border-gray-700"
                >
                  Watch Demo
                </motion.button>
              </div>
              
              <motion.div 
                className="flex items-center space-x-6"
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
              >
                <motion.div 
                  className="flex -space-x-2"
                  whileHover={{ 
                    scale: 1.05,
                    x: 3,
                    transition: { duration: 0.2 } 
                  }}
                >
                  {[...Array(4)].map((_, i) => (
                    <motion.img 
                      key={i}
                      src={`https://randomuser.me/api/portraits/men/${20 + i}.jpg`} 
                      alt="User" 
                      className="w-8 h-8 rounded-full border-2 border-gray-900"
                      whileHover={{ 
                        scale: 1.2, 
                        zIndex: 10,
                        transition: { duration: 0.2 } 
                      }}
                    />
                  ))}
                </motion.div>
                <motion.div 
                  className="text-gray-400 text-sm"
                  whileHover={{ x: 3, transition: { duration: 0.2 } }}
                >
                  <span className="text-white font-semibold">10,000+</span> users love this feature
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
          
          <div className="md:w-1/2">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="bg-gradient-to-br from-gray-800 to-black p-1.5 rounded-xl overflow-hidden shadow-2xl"
              whileHover={{ 
                scale: 1.03,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)"
              }}
            >
              <motion.div className="rounded-lg overflow-hidden">
                <img 
                  src={image}
                  alt={title}
                  className="w-full object-cover rounded-lg aspect-video"
                />
              </motion.div>
              
              {/* Play button overlay (if video available) */}
              {videoUrl && (
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center"
                  whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
                >
                  <motion.button 
                    whileHover={{ scale: 1.1, boxShadow: "0 0 30px 5px rgba(99, 102, 241, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-primary-600/90 rounded-full p-4 shadow-xl relative group"
                  >
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary-500 opacity-50 blur-md z-0"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.3, 0.5]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    />
                    <motion.svg 
                      className="w-10 h-10 text-white relative z-10" 
                      viewBox="0 0 24 24" 
                      fill="currentColor"
                      whileHover={{ scale: 1.1 }}
                    >
                      <path d="M8 5v14l11-7z" />
                    </motion.svg>
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureHero;