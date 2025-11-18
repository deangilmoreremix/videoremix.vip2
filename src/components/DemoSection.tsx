import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Check, ChevronDown, Sparkles, ArrowRight } from 'lucide-react';

const DemoSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ["Template Selection", "AI Editing", "Export & Share"];
  
  // Demo features for each tab
  const features = [
    [
      "500+ professionally designed templates",
      "Category filters for any industry or purpose",
      "Preview templates before selection",
      "Customizable to match your brand",
      "Regular updates with new designs"
    ],
    [
      "Smart scene detection and auto-editing",
      "Automatic color correction and enhancement",
      "AI-powered transitions between clips",
      "Voice recognition for automatic captions",
      "Content-aware cropping for different platforms"
    ],
    [
      "One-click export to multiple formats",
      "Automatic optimization for each platform",
      "Direct publishing to social media",
      "Cloud storage of all projects",
      "Bulk export capabilities"
    ]
  ];

  // Video play state
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section id="demo" className="py-20 bg-black relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10 bg-grid-pattern"></div>
        
        {/* Glowing orbs */}
        <div className="absolute top-1/4 right-1/4 w-40 h-40 bg-primary-500/30 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/3 left-1/3 w-60 h-60 bg-primary-700/20 rounded-full blur-[100px]"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <div className="inline-block mb-3">
            <div className="bg-primary-500/20 text-primary-400 px-4 py-1.5 rounded-full text-sm font-semibold">
              SEE HOW SIMPLE IT IS
            </div>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Create Professional Videos in <span className="text-primary-400">3 Simple Steps</span>
          </h2>
          
          <p className="text-xl text-gray-300 mb-8">
            VideoRemix.vip makes professional video creation accessible to everyone, regardless of technical skills or experience.
          </p>
          
          {/* Video preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative aspect-video max-w-3xl mx-auto mb-16 rounded-xl overflow-hidden shadow-xl"
            whileHover={{ 
              scale: 1.02, 
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1593697821028-7cc59cfd7399?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
              alt="VideoRemix.vip Demo"
              className="w-full h-full object-cover opacity-80"
            />
            
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative group"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {/* Pulsing animation */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary-500/40 blur-[10px]"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.7, 0, 0.7]
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                <div className="bg-primary-600 hover:bg-primary-500 rounded-full p-5 relative flex items-center justify-center">
                  {isPlaying ? (
                    <motion.div 
                      className="h-12 w-4 bg-white rounded-sm"
                      animate={{ width: [4, 12, 4], height: [16, 12, 16] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    />
                  ) : (
                    <Play className="h-12 w-12 text-white" fill="white" />
                  )}
                </div>
                
                <span className="absolute whitespace-nowrap bottom-full left-1/2 transform -translate-x-1/2 -translate-y-4 bg-white text-gray-900 px-4 py-1 rounded text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  {isPlaying ? "Pause Demo" : "Watch Demo"}
                </span>
              </motion.button>
              
              {/* Demo duration badge */}
              <div className="absolute bottom-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                2:45
              </div>
            </div>
          </motion.div>
          
          {/* Tabs for features */}
          <div className="mb-8">
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {tabs.map((tab, index) => (
                <motion.button
                  key={index}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    activeTab === index 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveTab(index)}
                  whileHover={{ 
                    scale: 1.05,
                    y: -3,
                    boxShadow: activeTab === index ? 
                      "0 15px 25px -5px rgba(79, 70, 229, 0.3)" : 
                      "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="flex items-center">
                    <div className="w-5 h-5 rounded-full bg-black/30 flex items-center justify-center mr-2">
                      {index + 1}
                    </div>
                    {tab}
                  </div>
                </motion.button>
              ))}
            </div>
            
            {/* Feature list */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mx-auto"
            >
              <motion.div 
                className="bg-gray-900 rounded-lg p-6 border border-gray-800"
                whileHover={{ 
                  borderColor: "rgba(99, 102, 241, 0.3)",
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
                }}
              >
                <div className="space-y-3">
                  {features[activeTab].map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                      className="flex items-start"
                      whileHover={{ 
                        x: 8, 
                        transition: { duration: 0.2 }
                      }}
                    >
                      <motion.div 
                        className="bg-primary-900 p-1 rounded-full mr-3 mt-0.5 flex-shrink-0"
                        whileHover={{ 
                          rotate: [0, 10, -10, 0],
                          scale: 1.2,
                          backgroundColor: "rgba(79, 70, 229, 0.4)",
                          transition: { duration: 0.5 }
                        }}
                      >
                        <Check className="h-4 w-4 text-primary-400" />
                      </motion.div>
                      <span className="text-gray-300">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center bg-gradient-to-r from-primary-900/40 to-primary-700/40 p-8 rounded-xl border border-primary-500/30"
          whileHover={{ 
            y: -10,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            borderColor: "rgba(99, 102, 241, 0.4)"
          }}
        >
          <div className="inline-flex items-center bg-black/30 px-3 py-1 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-primary-400 mr-2" />
            <span className="text-sm font-medium text-white">AI-POWERED WORKFLOW</span>
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-4">
            Stop Wasting Time on Manual Video Editing
          </h3>
          
          <p className="text-gray-300 mb-8">
            Our AI technology handles the tedious work so you can focus on creating amazing content that grows your audience and business.
          </p>
          
          <motion.a
            href="#pricing"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 20px 25px -5px rgba(79, 70, 229, 0.3)"
            }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold px-8 py-4 rounded-lg shadow-lg shadow-primary-600/20"
          >
            <span>Get Access Today</span>
            <motion.div
              animate={{ 
                x: [0, 5, 0],
                transition: { repeat: Infinity, duration: 1.5 }
              }}
            >
              <ArrowRight className="ml-2 h-5 w-5" />
            </motion.div>
          </motion.a>
          
          <p className="mt-4 text-gray-500 text-sm">
            Join 10,000+ creators and businesses already using VideoRemix.vip
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default DemoSection;