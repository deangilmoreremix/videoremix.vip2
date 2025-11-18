import React from 'react';
import { motion } from 'framer-motion';
import { Wand2, Check, X, Zap, Clock, Monitor, Copy, ArrowRight, Sparkles, Users, BarChart, Target, UserRoundX, MessageSquareOff, TrendingDown, Coins, EyeOff, Share2, LineChart, HandCoins } from 'lucide-react';
import MagicSparkles from './MagicSparkles';
import SparkleEffect from './SparkleEffect';

// Comparison data
const comparisonPoints = [
  {
    traditional: "One-size-fits-all marketing for everyone",
    videoRemix: "Personalized marketing videos for each audience segment",
    icon: <Users className="h-5 w-5" />
  },
  {
    traditional: "Manual customization takes hours per campaign",
    videoRemix: "AI personalizes marketing in minutes",
    icon: <Clock className="h-5 w-5" />
  },
  {
    traditional: "Same messaging regardless of prospect stage",
    videoRemix: "Dynamic marketing adapts to each buyer journey stage",
    icon: <Target className="h-5 w-5" />
  },
  {
    traditional: "Static templates with limited marketing options",
    videoRemix: "50+ personalized marketing tools for any campaign",
    icon: <Wand2 className="h-5 w-5" />
  }
];

const SolutionSection: React.FC = () => {
  return (
    <section id="solution" className="py-20 bg-black relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px]"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-600/20 rounded-full blur-[100px]"></div>
      
      {/* Enhanced sparkle effects */}
      <SparkleEffect
        count={30}
        colors={['#ffffff', '#c7d2fe', '#a5b4fc', '#818cf8']}
        minSize={2}
        maxSize={5}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <div className="inline-block mb-4 relative">
            <MagicSparkles minSparkles={5} maxSparkles={10} speed="medium">
              <div className="bg-gradient-to-r from-primary-600 to-primary-400 text-white font-bold px-6 py-2 rounded-full flex items-center">
                <Sparkles className="mr-2 h-5 w-5" />
                THE PERSONALIZED MARKETING REVOLUTION
              </div>
            </MagicSparkles>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Introducing <span className="text-gradient relative">
              VideoRemix.vip
              <motion.div 
                className="absolute -inset-1 opacity-30 blur-md -z-10" 
                animate={{
                  background: [
                    'radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(99,102,241,0) 70%)',
                    'radial-gradient(circle, rgba(236,72,153,0.4) 0%, rgba(236,72,153,0) 70%)',
                    'radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(99,102,241,0) 70%)'
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />
            </span>
            <br />Your Complete Personalized Marketing Platform
          </h2>
          
          <p className="text-xl text-gray-300">
            Create personalized marketing videos that speak directly to each viewer, driving 3X higher engagement and dramatically increasing conversion rates across your marketing campaigns.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Video showcase */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.3 }
            }}
          >
            <motion.div 
              className="bg-gradient-to-br from-primary-500/20 to-primary-700/20 p-1.5 rounded-xl overflow-hidden"
              animate={{ 
                boxShadow: [
                  "0 0 0 rgba(99, 102, 241, 0.1)",
                  "0 0 20px rgba(99, 102, 241, 0.3)",
                  "0 0 0 rgba(99, 102, 241, 0.1)"
                ]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                repeatType: "reverse" 
              }}
            >
              <div className="bg-black rounded-lg overflow-hidden aspect-video relative">
                <img 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                  alt="Personalized Marketing Video Interface" 
                  className="w-full h-full object-cover opacity-90"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20"></div>
                
                {/* Personalization UI elements */}
                <motion.div 
                  className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-lg text-white text-sm flex items-center"
                  whileHover={{ 
                    scale: 1.05, 
                    x: 5,
                    backgroundColor: "rgba(0, 0, 0, 0.6)" 
                  }}
                >
                  <Users className="h-4 w-4 mr-2 text-primary-400" />
                  <span>Audience: B2B Decision Makers</span>
                </motion.div>
                
                <motion.div 
                  className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-lg text-white text-sm flex items-center"
                  whileHover={{ 
                    scale: 1.05, 
                    x: -5,
                    backgroundColor: "rgba(0, 0, 0, 0.6)" 
                  }}
                >
                  <Sparkles className="h-4 w-4 mr-2 text-primary-400" />
                  <span>Marketing Personalization Active</span>
                </motion.div>
                
                {/* Video editing UI elements */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="w-full h-1 bg-gray-700 rounded-full mb-2 overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary-500"
                      animate={{ 
                        width: ["0%", "66%", "66%"]
                      }}
                      transition={{ 
                        duration: 2,
                        times: [0, 0.8, 1],
                        ease: "easeOut",
                        repeat: Infinity,
                        repeatDelay: 3
                      }}
                    ></motion.div>
                  </div>
                  <div className="flex items-center justify-between">
                    <motion.button 
                      className="text-white bg-primary-600 p-2 rounded-full"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                    </motion.button>
                    <div className="text-white text-sm">01:23 / 02:30</div>
                  </div>
                </div>
                
                {/* AI Personalization overlay */}
                <motion.div
                  className="absolute top-14 left-1/2 transform -translate-x-1/2 bg-primary-600/50 backdrop-blur-sm rounded-lg px-3 py-1.5"
                  initial={{ y: -40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -5,
                    boxShadow: "0 10px 15px -3px rgba(99, 102, 241, 0.3)"
                  }}
                >
                  <div className="flex items-center text-sm text-white">
                    <Wand2 className="h-4 w-4 text-primary-200 mr-2" />
                    <span>AI marketing personalization applied to this segment</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {["Segmented Audiences", "Dynamic Marketing Content", "Personalized CTAs", "Conversion-Focused Messaging"].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                  className="bg-gray-800 px-3 py-1 rounded-full text-sm text-gray-300"
                  whileHover={{ 
                    y: -5,
                    backgroundColor: "rgb(55, 65, 81)",
                    color: "rgb(224, 231, 255)",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                  }}
                >
                  {feature}
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          {/* Features/comparison */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-2xl font-bold text-white mb-6">
              How VideoRemix.vip Transforms Your Marketing With Personalization
            </h3>
            
            <div className="space-y-6 mb-8">
              {comparisonPoints.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <motion.div 
                    className="flex items-center bg-red-900/20 p-4 rounded-lg border border-red-500/20"
                    whileHover={{ 
                      scale: 1.03, 
                      x: -5,
                      y: -3,
                      borderColor: "rgba(239, 68, 68, 0.4)" 
                    }}
                  >
                    <motion.div 
                      className="bg-red-500/20 p-2 rounded-full mr-3"
                      whileHover={{ 
                        rotate: [0, 15, -15, 0],
                        transition: { duration: 0.5 }
                      }}
                    >
                      <X className="h-5 w-5 text-red-500" />
                    </motion.div>
                    <span className="text-gray-300 text-sm">{point.traditional}</span>
                  </motion.div>
                  <motion.div 
                    className="flex items-center bg-green-900/20 p-4 rounded-lg border border-green-500/20 relative"
                    whileHover={{ 
                      scale: 1.03, 
                      x: 5,
                      y: -3,
                      borderColor: "rgba(16, 185, 129, 0.4)" 
                    }}
                  >
                    <MagicSparkles minSparkles={1} maxSparkles={2} speed="slow" minSize={5} maxSize={8}>
                      <motion.div 
                        className="bg-green-500/20 p-2 rounded-full mr-3"
                        whileHover={{ 
                          rotate: [0, 15, -15, 0],
                          scale: 1.1,
                          transition: { duration: 0.5 }
                        }}
                      >
                        <Check className="h-5 w-5 text-green-500" />
                      </motion.div>
                    </MagicSparkles>
                    <span className="text-gray-300 text-sm">{point.videoRemix}</span>
                  </motion.div>
                </motion.div>
              ))}
            </div>
            
            <motion.div
              whileHover={{ 
                y: -10,
                boxShadow: "0 20px 25px -5px rgba(79, 70, 229, 0.2)",
                borderColor: "rgba(99, 102, 241, 0.4)",
                transition: { duration: 0.3 }
              }}
              className="bg-gradient-to-r from-primary-900/40 to-primary-700/40 p-6 rounded-xl border border-primary-500/30 relative"
            >
              <motion.div 
                className="absolute -top-2 -right-2 w-10 h-10 opacity-40"
                whileHover={{ 
                  rotate: [0, 180, 360],
                  transition: { duration: 2, repeat: Infinity }
                }}
              >
                <MagicSparkles minSparkles={2} maxSparkles={4} speed="medium" minSize={5} maxSize={10} />
              </motion.div>
              
              <h3 className="text-xl font-bold text-white mb-4">What Personalized Marketing Means For Your Business:</h3>
              <ul className="space-y-3">
                {[
                  "215% increase in marketing video engagement rates",
                  "183% higher conversion rates across your marketing funnel",
                  "67% more time spent viewing your marketing videos",
                  "3X more shares and social amplification of your campaigns",
                  "Stronger audience connection and measurable marketing ROI"
                ].map((benefit, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                    className="flex items-start"
                    whileHover={{ 
                      x: 10,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <motion.div 
                      className="bg-primary-500/20 p-1 rounded-full mr-3 mt-1"
                      whileHover={{ 
                        rotate: [0, 15, -15, 0],
                        scale: 1.2,
                        transition: { duration: 0.5 }
                      }}
                    >
                      <Check className="h-4 w-4 text-primary-400" />
                    </motion.div>
                    <span className="text-gray-300">{benefit}</span>
                  </motion.li>
                ))}
              </ul>
              
              <motion.div
                className="mt-6"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 1 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <MagicSparkles minSparkles={2} maxSparkles={4} speed="fast">
                  <motion.a 
                    href="/tools" 
                    className="inline-flex items-center bg-primary-500 hover:bg-primary-600 text-white font-semibold px-5 py-2.5 rounded-lg"
                    whileHover={{
                      boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.4)"
                    }}
                  >
                    <span>Explore 50+ Marketing Personalization Tools</span>
                    <motion.div
                      animate={{
                        x: [0, 5, 0],
                        transition: { repeat: Infinity, duration: 1.5, repeatType: "loop" }
                      }}
                    >
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </motion.div>
                  </motion.a>
                </MagicSparkles>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Bottom CTA - Personalization Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center bg-gradient-to-r from-gray-800 to-gray-900 p-8 rounded-xl border border-gray-700 relative"
          whileHover={{ 
            y: -10,
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
            borderColor: "rgba(99, 102, 241, 0.4)",
            transition: { duration: 0.3 }
          }}
        >
          <motion.div 
            className="absolute -top-5 -left-5 w-20 h-20 opacity-30"
            animate={{
              rotate: [0, 180, 360],
              transition: { duration: 20, repeat: Infinity, ease: "linear" }
            }}
          >
            <MagicSparkles minSparkles={5} maxSparkles={10} speed="medium" />
          </motion.div>
          
          <h3 className="text-2xl font-bold text-white mb-3">
            Personalized Marketing By The Numbers
          </h3>
          <p className="text-gray-300 mb-6">
            The data is clear: personalized marketing significantly outperforms generic marketing
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { value: "215%", label: "Higher Engagement" },
              { value: "183%", label: "Better Conversion" },
              { value: "300%", label: "Marketing ROI" }
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                className="bg-black/30 p-3 rounded-lg"
                whileHover={{ 
                  scale: 1.05,
                  y: -5,
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  transition: { duration: 0.2 }
                }}
              >
                <motion.div 
                  className="text-2xl md:text-3xl font-bold text-primary-400 mb-1"
                  whileHover={{ 
                    scale: 1.1,
                    rotate: [0, 3, -3, 0],
                    transition: { duration: 0.5 }
                  }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-gray-300 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
          
          <motion.a 
            href="#pricing" 
            className="inline-flex items-center bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold px-6 py-3 rounded-lg"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 20px 25px -5px rgba(79, 70, 229, 0.4)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            <span>Get Personalized Marketing Access Today</span>
            <motion.div
              animate={{
                x: [0, 5, 0],
                transition: { repeat: Infinity, duration: 1.5, repeatType: "loop" }
              }}
            >
              <Copy className="ml-2 h-5 w-5" />
            </motion.div>
          </motion.a>
          
          <motion.div 
            className="absolute -bottom-5 -right-5 w-20 h-20 opacity-30"
            animate={{
              rotate: [0, 180, 360],
              transition: { duration: 20, repeat: Infinity, ease: "linear" }
            }}
          >
            <MagicSparkles minSparkles={5} maxSparkles={10} speed="medium" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default SolutionSection;