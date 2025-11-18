import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Clock, Gift, ChevronDown, Sparkles, Shield, Video, FileVideo, Users } from 'lucide-react';
import { useLandingPageContent } from '../context/LandingPageContext';
import MagicSparkles from './MagicSparkles';

export const PricingSection: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'lifetime'>('yearly');
  const { pricingPlans, isLoading } = useLandingPageContent();
  
  // Default pricing data structure as fallback
  const defaultPlans = [
    {
      name: "Free",
      price_monthly: 0,
      price_yearly: 0,
      price_lifetime: 0,
      description: "Perfect for trying out the platform",
      features: [
        "5 video exports per month",
        "720p video quality",
        "Basic editing features",
        "2GB cloud storage",
        "Standard templates",
        "Watermarked videos"
      ],
      is_popular: false
    },
    {
      name: "Pro",
      price_monthly: 29,
      price_yearly: 290,
      price_lifetime: 699,
      description: "Ideal for content creators and small teams",
      features: [
        "Unlimited video exports",
        "4K video quality",
        "All editing features",
        "50GB cloud storage",
        "Premium templates",
        "No watermarks",
        "Basic AI features",
        "Auto subtitle generation",
        "2 team members",
        "Priority email support"
      ],
      is_popular: true
    },
    {
      name: "Business",
      price_monthly: 79,
      price_yearly: 790,
      price_lifetime: 1999,
      description: "For teams and professionals with advanced needs",
      features: [
        "Everything in Pro",
        "500GB cloud storage",
        "All AI features",
        "Advanced analytics",
        "White-label exports",
        "10 team members",
        "Custom templates",
        "API access",
        "Dedicated account manager",
        "24/7 priority support"
      ],
      is_popular: false
    }
  ];
  
  // Use dynamic data from Supabase if available
  const plans = (!isLoading && pricingPlans && pricingPlans.length > 0) ? pricingPlans : defaultPlans;
  
  // Find the popular plan
  const popularPlan = plans.find(plan => plan.is_popular) || plans[1];
  
  // Find the free plan
  const freePlan = plans.find(plan => plan.price_monthly === 0) || plans[0];
  
  // Categorized features for expanded display
  const featureCategories = [
    {
      title: "Video Creation & Editing",
      features: [
        {
          title: "AI Video Creation",
          free: "Limited to 5 videos",
          pro: "Unlimited",
          business: "Unlimited with priority processing"
        },
        {
          title: "Video Quality",
          free: "720p",
          pro: "4K",
          business: "4K"
        },
        {
          title: "AI Editing Tools",
          free: "Basic editing",
          pro: "Advanced editing",
          business: "Professional suite"
        },
        {
          title: "Smart Templates",
          free: "5 templates",
          pro: "500+ templates",
          business: "500+ templates + custom"
        },
        {
          title: "Content Repurposing",
          free: "✕",
          pro: "✓",
          business: "✓ Advanced"
        },
        {
          title: "Auto Captions",
          free: "✕",
          pro: "✓ 40+ languages",
          business: "✓ 100+ languages"
        }
      ]
    },
    {
      title: "Personalization Tools",
      features: [
        {
          title: "Audience Segmentation",
          free: "2 segments",
          pro: "Unlimited segments",
          business: "Unlimited with AI segmentation"
        },
        {
          title: "Marketing Personalization",
          free: "Basic",
          pro: "Advanced",
          business: "Enterprise-level"
        },
        {
          title: "Personalized Video Creation",
          free: "✕",
          pro: "✓",
          business: "✓ Advanced"
        },
        {
          title: "Dynamic Content",
          free: "✕",
          pro: "✓",
          business: "✓ Advanced"
        },
        {
          title: "AI Content Suggestions",
          free: "✕",
          pro: "Basic",
          business: "Advanced"
        },
        {
          title: "Custom Branding",
          free: "Limited",
          pro: "Full branding kit",
          business: "Multiple brand profiles"
        }
      ]
    },
    {
      title: "Collaboration & Workflow",
      features: [
        {
          title: "Team Members",
          free: "1 user",
          pro: "2 users",
          business: "10 users"
        },
        {
          title: "Collaboration Tools",
          free: "✕",
          pro: "✓",
          business: "✓ Advanced"
        },
        {
          title: "Approval Workflows",
          free: "✕",
          pro: "Basic",
          business: "Advanced"
        },
        {
          title: "Version History",
          free: "Limited",
          pro: "30 days",
          business: "Unlimited"
        },
        {
          title: "Role-Based Permissions",
          free: "✕",
          pro: "Basic roles",
          business: "Advanced custom roles"
        },
        {
          title: "Team Projects",
          free: "✕",
          pro: "Up to 5",
          business: "Unlimited"
        }
      ]
    },
    {
      title: "Storage & Publishing",
      features: [
        {
          title: "Cloud Storage",
          free: "2GB",
          pro: "50GB",
          business: "500GB"
        },
        {
          title: "Direct Publishing",
          free: "2 platforms",
          pro: "All major platforms",
          business: "All platforms + scheduling"
        },
        {
          title: "Video Analytics",
          free: "Basic",
          pro: "Advanced",
          business: "Enterprise"
        },
        {
          title: "API Access",
          free: "✕",
          pro: "Limited",
          business: "Full access"
        },
        {
          title: "Scheduled Publishing",
          free: "✕",
          pro: "Basic",
          business: "Advanced with calendar"
        },
        {
          title: "Batch Processing",
          free: "✕",
          pro: "Up to 5 videos",
          business: "Unlimited"
        }
      ]
    },
    {
      title: "AI Features & Personalization",
      features: [
        {
          title: "AI Voice Generation",
          free: "2 voices",
          pro: "30+ voices",
          business: "100+ voices + custom voices"
        },
        {
          title: "AI Background Removal",
          free: "5 per month",
          pro: "Unlimited",
          business: "Unlimited with batch processing"
        },
        {
          title: "AI Scene Detection",
          free: "Basic",
          pro: "Advanced",
          business: "Professional"
        },
        {
          title: "AI Music Generation",
          free: "✕",
          pro: "✓",
          business: "✓ Custom mood profiles"
        },
        {
          title: "AI Video Enhancer",
          free: "✕",
          pro: "Basic enhancement",
          business: "Professional enhancement"
        },
        {
          title: "Personalized Thumbnails",
          free: "✕",
          pro: "AI-generated options",
          business: "Advanced A/B testing"
        }
      ]
    },
    {
      title: "Support & Training",
      features: [
        {
          title: "Support Channels",
          free: "Email",
          pro: "Email + Chat",
          business: "Email + Chat + Phone"
        },
        {
          title: "Response Time",
          free: "48 hours",
          pro: "24 hours",
          business: "4 hours"
        },
        {
          title: "Onboarding",
          free: "Self-service",
          pro: "Guided setup",
          business: "Dedicated onboarding specialist"
        },
        {
          title: "Training Resources",
          free: "Knowledge base",
          pro: "Tutorials + Webinars",
          business: "Custom training sessions"
        },
        {
          title: "Dedicated Account Manager",
          free: "✕",
          pro: "✕",
          business: "✓"
        },
        {
          title: "SLA",
          free: "✕",
          pro: "✕",
          business: "✓"
        }
      ]
    }
  ];

  // Features that are restricted in the free plan but available in Pro
  const restrictedFeatures = [
    "Advanced AI effects",
    "Brand kit integration",
    "Multi-platform optimization",
    "Bulk export capabilities",
    "API access"
  ];

  // Bonuses to add value to the offer
  const bonuses = [
    {
      title: "Video Marketing Blueprint",
      value: "$297",
      description: "Learn how to create videos that convert viewers into customers."
    },
    {
      title: "Viral Video Templates Pack",
      value: "$197",
      description: "10 exclusive templates proven to increase engagement and shares."
    },
    {
      title: "Social Media Calendar",
      value: "$97",
      description: "12-month content planning calendar with video ideas for every platform."
    }
  ];

  // State for expanded features section
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  
  // Effect for discount timer
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const newSeconds = prev.seconds - 1;
        
        if (newSeconds >= 0) {
          return { ...prev, seconds: newSeconds };
        }
        
        const newMinutes = prev.minutes - 1;
        
        if (newMinutes >= 0) {
          return { ...prev, minutes: newMinutes, seconds: 59 };
        }
        
        const newHours = prev.hours - 1;
        
        if (newHours >= 0) {
          return { hours: newHours, minutes: 59, seconds: 59 };
        }
        
        clearInterval(interval);
        return { hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Get pricing based on billing cycle
  const getPrice = (plan) => {
    switch(billingCycle) {
      case 'monthly':
        return plan.price_monthly;
      case 'yearly':
        return plan.price_yearly;
      case 'lifetime':
        return plan.price_lifetime || (plan.price_yearly * 3.5); // Fallback if no lifetime price
      default:
        return plan.price_monthly;
    }
  };

  // Get the discount percentage
  const getDiscount = () => {
    switch(billingCycle) {
      case 'yearly':
        return 20;
      case 'lifetime':
        return 40;
      default:
        return 0;
    }
  };

  // Get the billing period text
  const getBillingText = () => {
    switch(billingCycle) {
      case 'monthly':
        return '/month';
      case 'yearly':
        return '/year';
      case 'lifetime':
        return ' one-time';
      default:
        return '/month';
    }
  };

  return (
    <section id="pricing" className="py-20 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-600/10 rounded-full blur-[100px]"></div>
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
              VIDEOREMIX PLANS
            </div>
          </div>
          
          <MagicSparkles minSparkles={3} maxSparkles={6} colors={['#6366f1', '#818cf8', '#f472b6', '#ec4899']}>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 break-words">
              Choose Your <span className="text-primary-400">VideoRemix Plan</span>
            </h2>
          </MagicSparkles>
          
          <p className="text-xl text-gray-300 mb-4 break-words">
            Select the plan that fits your personalized marketing needs. Flexible options for teams of all sizes.
          </p>
          
          
          {/* Price toggle */}
          <div className="flex justify-center mb-8 mt-8">
            <div className="bg-gray-800 p-1 rounded-full inline-flex">
              <motion.button
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  billingCycle === 'monthly' ? 'bg-primary-600 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setBillingCycle('monthly')}
                whileHover={{ scale: billingCycle === 'monthly' ? 1.0 : 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                Monthly
              </motion.button>
              <motion.button
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  billingCycle === 'yearly' ? 'bg-primary-600 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setBillingCycle('yearly')}
                whileHover={{ scale: billingCycle === 'yearly' ? 1.0 : 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                Yearly <span className="text-xs bg-green-500 text-white px-1 py-0.5 rounded-sm ml-1">Save 20%</span>
              </motion.button>
              <motion.button
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  billingCycle === 'lifetime' ? 'bg-primary-600 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setBillingCycle('lifetime')}
                whileHover={{ scale: billingCycle === 'lifetime' ? 1.0 : 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                Lifetime <span className="text-xs bg-pink-500 text-white px-1 py-0.5 rounded-sm ml-1">Best Value</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
        
        <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
          {/* Free plan - less prominent */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:w-1/3"
            whileHover={{ 
              y: -10,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              transition: { duration: 0.3 }
            }}
          >
            <div className="h-full bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="p-6">
                <div className="text-xl font-bold text-white mb-1 break-words">{freePlan.name}</div>
                <div className="text-gray-400 mb-4 break-words">{freePlan.description}</div>
                
                <div className="mb-6">
                  <div className="flex items-baseline mb-1">
                    <span className="text-4xl font-bold text-white">Free</span>
                    <span className="text-gray-400 ml-2">forever</span>
                  </div>
                  <div className="text-sm text-gray-500">No credit card required</div>
                </div>
                
                <motion.a 
                  href="#signup" 
                  className="block w-full py-3 px-6 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg text-center mb-6"
                  whileHover={{ 
                    scale: 1.03,
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    backgroundColor: "rgba(55, 65, 81, 1)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  Start For Free
                </motion.a>
                
                <div className="space-y-3">
                  {Array.isArray(freePlan.features) && freePlan.features.slice(0, 6).map((feature, i) => (
                    <motion.div 
                      key={i} 
                      className="flex items-start"
                      whileHover={{ x: 5, transition: { duration: 0.2 } }}
                    >
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm break-words">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Pro plan - Highlighted with special offer */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:w-2/3 relative z-20"
            whileHover={{ 
              y: -10, 
              boxShadow: "0 25px 50px -12px rgba(79, 70, 229, 0.4)",
              transition: { duration: 0.3 }
            }}
          >
            <div className="absolute -inset-px bg-gradient-to-b from-primary-500 to-primary-700 rounded-xl opacity-70 blur-[2px]"></div>
            <div className="h-full bg-gradient-to-b from-gray-800 to-gray-900 border border-primary-500/50 rounded-xl overflow-hidden relative z-10 p-8">
              {/* Popular badge */}
              <div className="absolute top-4 right-4">
                <motion.div
                  className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold px-4 py-1 rounded-full text-sm"
                  animate={{
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      "0 0 0 rgba(245, 158, 11, 0)",
                      "0 0 20px rgba(245, 158, 11, 0.5)",
                      "0 0 0 rgba(245, 158, 11, 0)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  MOST POPULAR
                </motion.div>
              </div>
              
              <div className="flex flex-col lg:flex-row">
                <div className="lg:w-2/5 mb-6 lg:mb-0 pr-0 lg:pr-8 lg:border-r lg:border-gray-700">
                  <div className="text-xl font-bold text-white mb-1 break-words">{popularPlan.name}</div>
                  <div className="text-gray-400 mb-4 break-words">{popularPlan.description}</div>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-white break-words">
                        ${billingCycle === 'lifetime' ?
                          Math.round(popularPlan.price_yearly * 3.5) :
                          getPrice(popularPlan)
                        }
                      </span>
                      <span className="text-gray-400 ml-2">{getBillingText()}</span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <div className="text-sm text-gray-500">
                        Billed annually (effectively ${Math.round(popularPlan.price_yearly/12)}/mo)
                      </div>
                    )}
                    {billingCycle === 'lifetime' && (
                      <div className="text-sm text-gray-500">
                        One-time payment, lifetime access
                      </div>
                    )}
                  </div>
                  
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="mb-6"
                  >
                    <motion.a 
                      href="#checkout" 
                      className="block w-full text-center bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold py-4 px-6 rounded-lg shadow-lg shadow-primary-600/20"
                      whileHover={{ 
                        boxShadow: "0 20px 25px -5px rgba(79, 70, 229, 0.4)"
                      }}
                    >
                      GET STARTED NOW
                    </motion.a>
                  </motion.div>
                  
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center">
                      <Shield className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-400">Start with a free trial</span>
                    </div>
                  </div>
                </div>
                
                <div className="lg:w-3/5 lg:pl-8">
                  <div className="mb-6">
                    <motion.div
                      className="flex items-center mb-2"
                      whileHover={{ x: 5 }}
                    >
                      <Gift className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
                      <span className="font-bold text-lg text-white break-words">INCLUDES:</span>
                    </motion.div>

                    <div className="space-y-3">
                      <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                        <div className="font-medium text-white break-words mb-1">Priority Support</div>
                        <p className="text-sm text-gray-400 break-words">Get help when you need it with our dedicated support team</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                        <div className="font-medium text-white break-words mb-1">Regular Updates</div>
                        <p className="text-sm text-gray-400 break-words">Access new features and improvements as they're released</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                        <div className="font-medium text-white break-words mb-1">Training Resources</div>
                        <p className="text-sm text-gray-400 break-words">Comprehensive guides and tutorials to master VideoRemix</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-medium text-white mb-3">Everything in Pro includes:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Array.isArray(popularPlan.features) && popularPlan.features.map((feature, i) => (
                        <motion.div 
                          key={i} 
                          className="flex items-start"
                          whileHover={{ 
                            x: 5,
                            transition: { duration: 0.2 } 
                          }}
                        >
                          <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-300 text-sm break-words">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Expanded Features Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-5xl mx-auto mt-16"
        >
          <button
            onClick={() => setShowAllFeatures(!showAllFeatures)}
            className="flex items-center justify-center w-full mb-6 text-primary-400 hover:text-primary-300"
          >
            <span className="mr-2">{showAllFeatures ? 'Hide' : 'Show'} Full Feature Comparison</span>
            <motion.div
              animate={{ rotate: showAllFeatures ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="h-5 w-5" />
            </motion.div>
          </button>
          
          <AnimatedFeatureTable 
            showAllFeatures={showAllFeatures} 
            featureCategories={featureCategories} 
          />
        </motion.div>
        
        {/* Features comparison */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-4xl mx-auto mt-16"
        >
          <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 transform transition-transform duration-300 hover:translate-y-[-5px] hover:shadow-xl">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Feature Comparison</h3>
              <motion.button 
                className="text-gray-400 hover:text-white flex items-center"
                aria-label="Toggle feature comparison"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-sm mr-2">View all features</span>
                <motion.div
                  animate={{ rotate: [0, 180, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </motion.button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {restrictedFeatures.map((feature, i) => (
                  <motion.div 
                    key={i} 
                    className="grid grid-cols-8 gap-4 items-center py-2 border-b border-gray-800"
                    whileHover={{ 
                      backgroundColor: "rgba(31, 41, 55, 0.5)", 
                      borderRadius: "0.375rem",
                      x: 5,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <div className="col-span-4 text-gray-300 break-words">{feature}</div>
                    <div className="col-span-2 text-center">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <X className="h-5 w-5 text-gray-500 mx-auto" />
                      </motion.div>
                    </div>
                    <div className="col-span-2 text-center">
                      <motion.div
                        whileHover={{ 
                          scale: 1.1, 
                          rotate: [0, 5, -5, 0],
                          color: "rgba(52, 211, 153, 1)" 
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
                
                <div className="grid grid-cols-8 gap-4 items-center pt-2">
                  <div className="col-span-4"></div>
                  <div className="col-span-2 text-center">
                    <div className="text-sm font-medium text-gray-400">Free</div>
                    <motion.a 
                      href="#signup-free" 
                      className="text-xs text-primary-400 hover:text-primary-300"
                      whileHover={{ scale: 1.05 }}
                    >
                      Sign Up
                    </motion.a>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="text-sm font-medium text-primary-400">Pro Plan</div>
                    <motion.a 
                      href="#checkout" 
                      className="text-xs text-primary-400 hover:text-primary-300"
                      whileHover={{ scale: 1.05 }}
                    >
                      Get Access
                    </motion.a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Lifetime offer highlight */}
        {billingCycle === 'lifetime' && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-4xl mx-auto mt-16 bg-gradient-to-br from-primary-900/40 to-secondary-900/30 p-6 rounded-xl border border-primary-500/30"
          >
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="md:w-1/3 flex justify-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 bg-primary-900/50 rounded-full"
                >
                  <FileVideo className="h-16 w-16 text-primary-400" />
                </motion.div>
              </div>
              <div className="md:w-2/3">
                <h3 className="text-2xl font-bold text-white mb-3">Why Choose Lifetime Access?</h3>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Pay once, use forever – no more recurring charges</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Significant cost savings compared to yearly plans after 3 years</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Access to all current features and tools in your plan</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Free major updates for the lifetime of the product</span>
                  </li>
                </ul>
                <motion.a 
                  href="#lifetime-checkout" 
                  className="inline-flex items-center bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold py-3 px-6 rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Secure Lifetime Access Now
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <ChevronDown className="ml-2 h-5 w-5 rotate-270" />
                  </motion.div>
                </motion.a>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* FAQ mini section */}
        <div className="max-w-3xl mx-auto mt-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Frequently Asked Questions</h3>
            <p className="text-gray-400">Quick answers to common questions</p>
          </div>
          
          <div className="space-y-4">
            {[
              {
                question: "Can I switch between plans?",
                answer: "Yes! You can upgrade or downgrade your plan at any time from your account settings. Changes take effect immediately."
              },
              {
                question: "What's included in the free plan?",
                answer: "The free plan includes access to basic personalized marketing tools, limited video exports, and 2GB of storage. Perfect for trying out VideoRemix."
              },
              {
                question: "How does the lifetime plan work?",
                answer: "The lifetime plan gives you permanent access to all Pro features for a one-time payment. You'll receive all future updates and improvements at no additional cost."
              },
              {
                question: "Is there a free trial?",
                answer: "Yes! You can start with our free plan to explore VideoRemix. No credit card required to get started."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                whileHover={{ 
                  y: -5,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  borderColor: "rgba(99, 102, 241, 0.4)",
                  transition: { duration: 0.2 }
                }}
                className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
              >
                <details className="group">
                  <summary className="flex justify-between items-center p-5 font-medium cursor-pointer list-none">
                    <span className="text-white break-words">{item.question}</span>
                    <motion.div
                      animate={{ rotate: 0 }}
                      initial={{ rotate: 0 }}
                      variants={{
                        open: { rotate: 180 },
                        closed: { rotate: 0 }
                      }}
                    >
                      <ChevronDown className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0" />
                    </motion.div>
                  </summary>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="px-5 pb-5 pt-0"
                  >
                    <p className="text-gray-400 break-words">{item.answer}</p>
                  </motion.div>
                </details>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <motion.a 
              href="#faq" 
              className="text-primary-400 hover:text-primary-300 font-medium inline-flex items-center"
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              View all FAQs
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ 
                  repeat: Infinity,
                  duration: 1.5,
                  repeatType: "loop"
                }}
              >
                <ChevronDown className="ml-1 h-4 w-4 rotate-270" />
              </motion.span>
            </motion.a>
          </div>
        </div>
      </div>
    </section>
  );
};

// Animated feature table component
const AnimatedFeatureTable = ({ showAllFeatures, featureCategories }) => {
  if (!showAllFeatures) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden mb-16"
    >
      <div className="px-6 py-4 bg-gray-800 text-white font-bold">
        Complete Feature Comparison
      </div>
      
      <div className="p-6">
        {featureCategories.map((category, index) => (
          <div key={index} className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-2">
              {category.title}
            </h3>
            
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-3 text-gray-300 w-1/3">Feature</th>
                  <th className="text-center py-3 text-gray-300 w-1/5">Free</th>
                  <th className="text-center py-3 text-gray-300 w-1/5">Pro</th>
                  <th className="text-center py-3 text-gray-300 w-1/5">Business</th>
                </tr>
              </thead>
              <tbody>
                {category.features.map((feature, featureIndex) => (
                  <motion.tr 
                    key={featureIndex}
                    className="border-t border-gray-800"
                    whileHover={{ backgroundColor: "rgba(31, 41, 55, 0.5)" }}
                  >
                    <td className="py-3 text-white">{feature.title}</td>
                    <td className="py-3 text-center">
                      {feature.free === "✓" ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : feature.free === "✕" ? (
                        <X className="h-5 w-5 text-gray-600 mx-auto" />
                      ) : (
                        <span className="text-gray-400 text-sm">{feature.free}</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {feature.pro === "✓" ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : feature.pro === "✕" ? (
                        <X className="h-5 w-5 text-gray-600 mx-auto" />
                      ) : (
                        <span className="text-primary-400 text-sm font-medium">{feature.pro}</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {feature.business === "✓" ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : feature.business === "✕" ? (
                        <X className="h-5 w-5 text-gray-600 mx-auto" />
                      ) : (
                        <span className="text-primary-400 text-sm font-medium">{feature.business}</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        
        <div className="flex items-center justify-center gap-8 mt-10">
          <a 
            href="#signup-free" 
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg"
          >
            Start Free
          </a>
          <a 
            href="#checkout" 
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg"
          >
            Get Pro
          </a>
          <a 
            href="#business" 
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg"
          >
            Contact Sales
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default PricingSection;