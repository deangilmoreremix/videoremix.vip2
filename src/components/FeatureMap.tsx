import React from 'react';
import { motion } from 'framer-motion';
import MagicSparkles from './MagicSparkles';

interface FeatureMapProps {
  title?: string;
  subtitle?: string;
}

// This component maps all the functionality areas from the information provided
const FeatureMap: React.FC<FeatureMapProps> = ({ 
  title = "Comprehensive Marketing Personalization Features",
  subtitle = "Explore the powerful personalization capabilities of VideoRemix.vip's marketing platform"
}) => {
  
  const featureCategories = [
    {
      title: "Personalized Video Marketing",
      features: [
        "Personalized Marketing from Text/Keywords/Prompts",
        "Personalized Marketing from User Data",
        "Personalized Audio/Music for Campaigns",
        "Personalized Imagery from Various Sources",
        "Personalized Marketing Campaign Storage",
        "Personalized Campaign Layer Management"
      ]
    },
    {
      title: "Personalized Marketing Copy",
      features: [
        "Personalized Marketing Text Elements",
        "Personalized Marketing Text Masking",
        "Personalized Marketing Copy Based on User Data",
        "Personalized Marketing for Email Lists",
        "Personalized Marketing Link™ with Various Email Services",
        "Personalized Marketing Text Animations"
      ]
    },
    {
      title: "Personalized Marketing Elements",
      features: [
        "Personalized Marketing Animation Elements",
        "Personalized Marketing Transition Elements",
        "Personalized Marketing Blend Modes",
        "Personalized Marketing Pause Elements",
        "Personalized Marketing Loop Elements",
        "Personalized Marketing Skip Elements"
      ]
    },
    {
      title: "Personalized Interactive Marketing",
      features: [
        "Personalized Marketing CTA Elements",
        "Personalized Marketing Connect Form",
        "Personalized Marketing Google Maps Integration",
        "Personalized Marketing Screen Recorder",
        "Personalized Marketing Audio Recorder",
        "Personalized Marketing Opt-in Form"
      ]
    },
    {
      title: "Personalized Professional Marketing",
      features: [
        "Personalized Marketing Lower Thirds Presets",
        "Personalized Marketing Custom Lower Thirds",
        "Personalized Marketing AI Voice Coach",
        "Personalized Marketing Storyboard AI",
        "Personalized Marketing AI Script Creator",
        "Personalized Marketing Template Generator"
      ]
    },
    {
      title: "Personalized Marketing Social & Sharing",
      features: [
        "Personalized Social Campaign Tools",
        "Personalized Marketing Social Plugin Integration",
        "Personalized Marketing Facebook/LinkedIn Content",
        "Personalized Marketing LinkedIn Video Sharing",
        "Personalized Social Media Marketing Pack",
        "Personalized Interactive Marketing Video Outros"
      ]
    },
    {
      title: "Personalized Marketing Advanced Tools",
      features: [
        "Personalized Marketing Clip Editor",
        "Personalized Marketing Thumbnail Generator",
        "Personalized Marketing AI Background Remover",
        "Personalized Marketing AI Art Generator",
        "Personalized Marketing Video Project Thumbnails",
        "Personalized Marketing Text to Speech"
      ]
    },
    {
      title: "Personalized Marketing Multi-Language",
      features: [
        "Personalized Marketing Automatic Captions",
        "Personalized Marketing Multi-language Support",
        "Personalized Marketing Copy Translation",
        "Personalized Marketing International Formatting",
        "Personalized Marketing Regional Dialect Recognition",
        "Personalized Marketing Cultural Context Adaptation"
      ]
    }
  ];
  
  return (
    <section className="py-20 bg-black relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-block mb-3">
            <div className="bg-primary-500/20 text-primary-400 px-4 py-1.5 rounded-full text-sm font-semibold">
              MARKETING PERSONALIZATION FEATURES
            </div>
          </div>
          
          <MagicSparkles minSparkles={3} maxSparkles={6}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 break-words">
              {title}
            </h2>
          </MagicSparkles>
          
          <p className="text-xl text-gray-300 break-words">
            {subtitle}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featureCategories.map((category, categoryIndex) => (
            <motion.div
              key={categoryIndex}
              whileHover={{ 
                y: -8,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
                borderColor: "rgba(99, 102, 241, 0.4)"
              }}
              transition={{ duration: 0.2 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-primary-600/30"
            >
              <div className="flex items-center mb-4">
                <h3 className="text-lg font-bold text-white break-words">{category.title}</h3>
              </div>
              
              <ul className="space-y-3">
                {category.features.map((feature, featureIndex) => (
                  <motion.li
                    key={featureIndex}
                    className="flex items-start"
                    whileHover={{ 
                      x: 5, 
                      color: "#a5b4fc",
                      transition: { duration: 0.2 }
                    }}
                  >
                    <div className="bg-primary-500/20 p-1 rounded-full mr-2 mt-1 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-primary-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-300 text-sm break-words">{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureMap;