import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Users, Target, Play, ArrowRight, Check, Wand2, Clock, BarChart, Layers, Settings, FileText } from 'lucide-react';
import MagicSparkles from './MagicSparkles';
import { Link } from 'react-router-dom';

// Step data
const workflowSteps = [
  {
    id: "audience-identification",
    title: "Identify Your Marketing Audience Segments",
    description: "Our AI automatically analyzes your audience data and segments them based on behavior, demographics, and buying intent.",
    benefits: [
      "Automatic segmentation based on existing marketing data",
      "Create custom segments for specific marketing campaigns",
      "Import segments from CRM and marketing systems",
      "Up to 50+ unique marketing audience segments supported"
    ],
    color: "from-blue-500 to-indigo-600",
    icon: <Users className="h-10 w-10 text-white" />,
    stats: { value: "2 min", label: "Average setup time" },
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "content-personalization",
    title: "Personalize Your Marketing Content",
    description: "Choose from 50+ personalization tools to tailor your marketing videos, images, and copy for each audience segment.",
    benefits: [
      "Personalized marketing visuals, text, and audio",
      "Dynamic content insertion based on prospect data",
      "AI-powered marketing personalization recommendations",
      "Custom branding elements for each market segment"
    ],
    color: "from-purple-500 to-pink-600",
    icon: <Wand2 className="h-10 w-10 text-white" />,
    stats: { value: "5 min", label: "Average personalization time" },
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "automation-setup",
    title: "Set Up Marketing Automation",
    description: "Configure when and how your personalized marketing is delivered to each audience segment automatically.",
    benefits: [
      "Scheduled delivery based on optimal marketing times",
      "Behavioral trigger-based marketing delivery",
      "Multi-channel marketing distribution (email, social, web)",
      "A/B testing for personalized marketing variants"
    ],
    color: "from-orange-500 to-amber-600",
    icon: <Settings className="h-10 w-10 text-white" />,
    stats: { value: "3 min", label: "Average setup time" },
    image: "https://images.unsplash.com/photo-1551033406-611cf9a28f67?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "measure-optimize",
    title: "Measure & Optimize Marketing Performance",
    description: "Track marketing performance across segments and automatically optimize your personalization strategy for maximum conversions.",
    benefits: [
      "Real-time marketing analytics by segment",
      "Automatic A/B testing of personalization elements", 
      "AI-powered marketing optimization recommendations",
      "ROI calculator for marketing personalization efforts"
    ],
    color: "from-green-500 to-emerald-600",
    icon: <BarChart className="h-10 w-10 text-white" />,
    stats: { value: "300%", label: "Average marketing ROI increase" },
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
  }
];

const PersonalizationWorkflowSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Change active step on time interval
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % workflowSteps.length);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Intersection observer to animate in when visible
  useEffect(() => {
    if (!sectionRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-simple" className="py-20 bg-black relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-10 bg-grid-pattern"></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>
      
      <div className="container mx-auto px-4 relative z-10" ref={sectionRef}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <div className="inline-block mb-3">
            <div className="bg-primary-500/20 text-primary-400 px-4 py-1.5 rounded-full text-sm font-semibold">
              MARKETING PERSONALIZATION MADE SIMPLE
            </div>
          </div>
          
          <MagicSparkles minSparkles={3} maxSparkles={6}>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Create <span className="text-primary-400">Personalized Marketing</span> in Just Minutes
            </h2>
          </MagicSparkles>
          
          <p className="text-xl text-gray-300 mb-8">
            Our intuitive workflow makes it easy to create personalized marketing videos and campaigns for every audience segment
          </p>
        </motion.div>
        
        {/* Step Timeline Navigation */}
        <div className="mb-12">
          <div className="flex justify-between items-center max-w-4xl mx-auto relative">
            {/* Connecting line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-800 -translate-y-1/2"></div>
            
            {/* Step circles */}
            {workflowSteps.map((step, index) => (
              <motion.button 
                key={step.id}
                className={`relative z-10 flex flex-col items-center`}
                onClick={() => setActiveStep(index)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    activeStep >= index 
                      ? `bg-gradient-to-br ${step.color} shadow-lg`
                      : 'bg-gray-800 border border-gray-700'
                  }`}
                  animate={{
                    scale: activeStep === index ? [1, 1.1, 1] : 1
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: activeStep === index ? Infinity : 0,
                    repeatType: "reverse"
                  }}
                >
                  {activeStep > index ? (
                    <Check className="h-6 w-6 text-white" />
                  ) : (
                    <div className="text-lg text-white font-bold">{index + 1}</div>
                  )}
                </motion.div>
                <div className={`text-sm font-medium mt-2 max-w-[110px] text-center ${
                  activeStep === index ? 'text-primary-400' : 'text-gray-400'
                }`}>
                  {step.title.split(' ').slice(0, 2).join(' ')}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
        
        {/* Step Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={`step-content-${activeStep}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5 }}
            >
              <div className={`bg-gradient-to-br ${workflowSteps[activeStep].color} p-3 inline-block rounded-lg mb-6`}>
                {workflowSteps[activeStep].icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                {workflowSteps[activeStep].title}
              </h3>
              <p className="text-xl text-gray-300 mb-6">
                {workflowSteps[activeStep].description}
              </p>
              
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 mb-6">
                <h4 className="text-lg font-semibold text-white mb-4">Key Features:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {workflowSteps[activeStep].benefits.map((benefit, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-start"
                    >
                      <div className="flex-shrink-0 mt-1">
                        <Check className="h-5 w-5 text-primary-400" />
                      </div>
                      <p className="ml-2 text-gray-300 text-sm">{benefit}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Step metrics */}
              <div className="bg-primary-900/30 border border-primary-700/30 p-4 rounded-lg inline-flex items-center">
                <Clock className="h-5 w-5 text-primary-400 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-white">
                    {workflowSteps[activeStep].stats.value}
                  </div>
                  <div className="text-sm text-primary-300">
                    {workflowSteps[activeStep].stats.label}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Visual */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`step-image-${activeStep}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="relative rounded-xl overflow-hidden border border-gray-700 shadow-xl"
            >
              <div className="aspect-video bg-gray-900">
                {/* Step image */}
                <img 
                  src={workflowSteps[activeStep].image} 
                  alt={workflowSteps[activeStep].title}
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent"></div>
                
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`bg-gradient-to-br ${workflowSteps[activeStep].color} p-4 rounded-full shadow-xl`}
                  >
                    <Play className="h-8 w-8 text-white ml-1" />
                  </motion.button>
                </div>
                
                {/* Step indicator */}
                <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm px-3 py-1 rounded text-sm font-medium text-white">
                  Marketing Step {activeStep + 1} of {workflowSteps.length}
                </div>
                
                {/* Personalization elements */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className={`bg-gradient-to-r ${workflowSteps[activeStep].color} bg-opacity-80 backdrop-blur-sm p-4 rounded-lg`}>
                    <div className="flex items-center mb-2">
                      <Sparkles className="h-5 w-5 text-white mr-2" />
                      <h4 className="text-lg font-bold text-white">Marketing Personalization Preview</h4>
                    </div>
                    <p className="text-white/90 text-sm mb-2">
                      {activeStep === 0 && "Marketing segments identified: Decision Makers, Researchers, Influencers, Budget Holders"}
                      {activeStep === 1 && "Personalizing marketing for CEO persona: Enterprise value proposition activated"}
                      {activeStep === 2 && "Automation set: Deliver personalized marketing video via email 2 days after website visit"}
                      {activeStep === 3 && "Results: Decision Maker segment showing 247% higher marketing engagement rate"}
                    </p>
                    <div className="flex justify-end">
                      <div className="text-xs text-white/70">
                        Marketing personalization powered by AI
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Stats and CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {[
              { value: "215%", label: "Higher engagement with marketing personalization", icon: <Target className="h-6 w-6 text-primary-400" /> },
              { value: "183%", label: "Increased marketing conversion rate", icon: <BarChart className="h-6 w-6 text-primary-400" /> },
              { value: "10 min", label: "Average marketing personalization time", icon: <Clock className="h-6 w-6 text-primary-400" /> },
              { value: "50+", label: "Marketing personalization tools available", icon: <Layers className="h-6 w-6 text-primary-400" /> }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
              >
                <div className="flex justify-center mb-2">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-white text-center">{stat.value}</div>
                <div className="text-xs text-gray-400 text-center">{stat.label}</div>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block"
            >
              <Link 
                to="/tools" 
                className="inline-flex items-center bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold px-8 py-4 rounded-lg shadow-lg"
              >
                <span>Explore All Marketing Personalization Tools</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </motion.div>
            
            <p className="mt-4 text-gray-400 text-sm">
              Get started with our 14-day free marketing personalization trial. No credit card required.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PersonalizationWorkflowSection;