import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  BarChart, 
  TrendingUp, 
  Users, 
  Clock, 
  DollarSign, 
  ChevronRight, 
  ChevronLeft, 
  ArrowUpRight, 
  ExternalLink, 
  CheckCircle,
  Target,
  LineChart,
  Video,
  Zap,
  Share,
  MessageSquare 
} from 'lucide-react';
import MagicSparkles from './MagicSparkles';

interface CaseStudyType {
  id: string;
  company: string;
  industry: string;
  logo: string;
  challenge: string;
  solution: string;
  results: {
    metric: string;
    value: string;
    icon: React.ReactNode;
    color: string;
  }[];
  testimonial: {
    quote: string;
    author: string;
    role: string;
    image: string;
  };
  timeline: string;
  featuredImage: string;
}

const caseStudies: CaseStudyType[] = [
  {
    id: 'ecommerce-fashion',
    company: 'StyleTrend',
    industry: 'E-Commerce Fashion',
    logo: 'https://images.unsplash.com/photo-1579762593175-20c9062ccc59?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&q=80',
    challenge: 'StyleTrend was sending the same generic product videos to all customers, resulting in low engagement rates (2.3%) and poor conversion (1.7%). Their marketing team couldn\'t create personalized content at scale.',
    solution: 'Implemented audience segmentation by style preference, browsing history, and purchase behavior. Created personalized marketing videos for each segment using VideoRemix.vip\'s AI personalization tools.',
    results: [
      {
        metric: 'Engagement',
        value: '+347%',
        icon: <BarChart className="h-5 w-5" />,
        color: 'text-primary-400'
      },
      {
        metric: 'Conversion',
        value: '8.4%',
        icon: <TrendingUp className="h-5 w-5" />,
        color: 'text-green-400'
      },
      {
        metric: 'Production Time',
        value: '-85%',
        icon: <Clock className="h-5 w-5" />,
        color: 'text-amber-400'
      },
      {
        metric: 'ROI',
        value: '518%',
        icon: <DollarSign className="h-5 w-5" />,
        color: 'text-blue-400'
      }
    ],
    testimonial: {
      quote: "The difference in our marketing performance is night and day. We now produce segment-specific fashion videos in minutes that connect with each audience perfectly. Our marketing ROI increased over 5x.",
      author: "Emma Richardson",
      role: "Marketing Director",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
    },
    timeline: "3 weeks from implementation to first results",
    featuredImage: "https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 'saas-enterprise',
    company: 'CloudSphere Solutions',
    industry: 'SaaS / Enterprise Software',
    logo: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&q=80',
    challenge: 'CloudSphere\'s generic product demo videos had a 9-minute average view time (only 27% completion rate). Their sales cycle was 92 days, with sales teams spending hours creating custom demos for each prospect.',
    solution: 'Implemented role-based video personalization for different decision-makers (CTO, CFO, end users). Created industry-specific templates with VideoRemix.vip\'s AI personalization that sales teams could customize in minutes.',
    results: [
      {
        metric: 'Demo Completion',
        value: '82%',
        icon: <Video className="h-5 w-5" />,
        color: 'text-primary-400'
      },
      {
        metric: 'Sales Cycle',
        value: '-42%',
        icon: <TrendingUp className="h-5 w-5" />,
        color: 'text-green-400'
      },
      {
        metric: 'Demo Creation',
        value: '8 min',
        icon: <Clock className="h-5 w-5" />,
        color: 'text-amber-400'
      },
      {
        metric: 'Close Rate',
        value: '+68%',
        icon: <Target className="h-5 w-5" />,
        color: 'text-blue-400'
      }
    ],
    testimonial: {
      quote: "Our sales team went from spending days creating custom demos to minutes. The personalized marketing videos have transformed our sales process, helping close enterprise deals in nearly half the time.",
      author: "Michael Chen",
      role: "VP of Global Sales",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
    },
    timeline: "2 months from implementation to company-wide adoption",
    featuredImage: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 'education-platform',
    company: 'EduVista Learning',
    industry: 'Educational Technology',
    logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&q=80',
    challenge: 'EduVista was struggling with high course abandonment rates (72%) and low engagement in their educational content despite high-quality material. Generic course introductions failed to connect with diverse learning styles.',
    solution: 'Implemented personalized course introduction videos based on learning preference profiles and previous course history. Used VideoRemix.vip to create adaptive learning path videos that change based on student progress.',
    results: [
      {
        metric: 'Course Completion',
        value: '+168%',
        icon: <CheckCircle className="h-5 w-5" />,
        color: 'text-primary-400'
      },
      {
        metric: 'Student Engagement',
        value: '+215%',
        icon: <Users className="h-5 w-5" />,
        color: 'text-green-400'
      },
      {
        metric: 'Content Creation',
        value: '4x',
        icon: <Zap className="h-5 w-5" />,
        color: 'text-amber-400'
      },
      {
        metric: 'Referrals',
        value: '+92%',
        icon: <Share className="h-5 w-5" />,
        color: 'text-blue-400'
      }
    ],
    testimonial: {
      quote: "Personalized learning videos have revolutionized our student experience. By tailoring course content to individual learning styles, we've seen extraordinary improvements in completion rates and student satisfaction.",
      author: "Dr. Sarah Williams",
      role: "Chief Education Officer",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
    },
    timeline: "1 semester pilot program, now fully implemented",
    featuredImage: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 'finance-advisory',
    company: 'Meridian Financial',
    industry: 'Financial Services',
    logo: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&q=80',
    challenge: 'Meridian was sending the same investment advice videos to all clients regardless of portfolio size, risk tolerance, or investment goals, resulting in low client satisfaction and high advisor workload explaining strategies.',
    solution: 'Developed a personalized client communication system using VideoRemix.vip that automatically creates portfolio review videos customized to each client\'s specific financial situation, goals, and preferences.',
    results: [
      {
        metric: 'Client Retention',
        value: '+27%',
        icon: <Users className="h-5 w-5" />,
        color: 'text-primary-400'
      },
      {
        metric: 'Assets Under Management',
        value: '+41%',
        icon: <DollarSign className="h-5 w-5" />,
        color: 'text-green-400'
      },
      {
        metric: 'Advisor Productivity',
        value: '3.8x',
        icon: <TrendingUp className="h-5 w-5" />,
        color: 'text-amber-400'
      },
      {
        metric: 'Client Satisfaction',
        value: '96%',
        icon: <MessageSquare className="h-5 w-5" />,
        color: 'text-blue-400'
      }
    ],
    testimonial: {
      quote: "Our clients now receive quarterly video updates that speak directly to their specific financial situation. This personalized approach has strengthened client relationships and dramatically improved retention and referrals.",
      author: "Jonathan Hayes",
      role: "Head of Client Services",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
    },
    timeline: "6 months from concept to full implementation",
    featuredImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 'healthcare-provider',
    company: 'Vitality Health Network',
    industry: 'Healthcare',
    logo: 'https://images.unsplash.com/photo-1612531385446-f7e6d131e1d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&q=80',
    challenge: 'Vitality Health was sending generic pre and post-procedure videos to all patients, resulting in low compliance with preparation instructions (68%) and post-care guidelines (72%).',
    solution: 'Implemented personalized patient education videos based on procedure type, patient age, medical history, and learning preferences using VideoRemix.vip\'s healthcare personalization features.',
    results: [
      {
        metric: 'Prep Compliance',
        value: '94%',
        icon: <CheckCircle className="h-5 w-5" />,
        color: 'text-primary-400'
      },
      {
        metric: 'Recovery Rates',
        value: '+32%',
        icon: <TrendingUp className="h-5 w-5" />,
        color: 'text-green-400'
      },
      {
        metric: 'Patient Satisfaction',
        value: '+47%',
        icon: <Users className="h-5 w-5" />,
        color: 'text-amber-400'
      },
      {
        metric: 'Readmissions',
        value: '-38%',
        icon: <LineChart className="h-5 w-5" />,
        color: 'text-blue-400'
      }
    ],
    testimonial: {
      quote: "The personalized patient education videos have transformed our care delivery. Patients are better prepared for procedures and more compliant with post-care instructions, leading to significantly improved outcomes.",
      author: "Dr. Rebecca Martinez",
      role: "Chief Medical Officer",
      image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
    },
    timeline: "Pilot program of 3 months, full rollout in 9 months",
    featuredImage: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  }
];

// Industry-specific success metrics
const industryMetrics = [
  { 
    industry: 'E-commerce', 
    metrics: [
      { label: 'Average Conversion Lift', value: '+183%' },
      { label: 'Customer Engagement', value: '+215%' },
      { label: 'Return Customer Rate', value: '+47%' }
    ] 
  },
  { 
    industry: 'B2B Software', 
    metrics: [
      { label: 'Lead Qualification', value: '+156%' },
      { label: 'Sales Cycle Length', value: '-42%' },
      { label: 'Close Rate', value: '+68%' }
    ] 
  },
  { 
    industry: 'Financial Services', 
    metrics: [
      { label: 'Client Acquisition Cost', value: '-53%' },
      { label: 'Assets Under Management', value: '+41%' },
      { label: 'Referral Rate', value: '+87%' }
    ] 
  },
  { 
    industry: 'Healthcare', 
    metrics: [
      { label: 'Patient Compliance', value: '+94%' },
      { label: 'Education Effectiveness', value: '+126%' },
      { label: 'Patient Satisfaction', value: '+47%' }
    ] 
  },
];

const CaseStudiesSection: React.FC = () => {
  const [activeCaseStudy, setActiveCaseStudy] = useState(0);
  const [activeIndustry, setActiveIndustry] = useState(0);

  return (
    <section className="py-20 bg-black relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-10 bg-grid-pattern"></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-[100px]"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-600/10 rounded-full blur-[100px]"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-block mb-3">
            <div className="bg-primary-500/20 text-primary-400 px-4 py-1.5 rounded-full text-sm font-semibold">
              MARKETING PERSONALIZATION SUCCESS
            </div>
          </div>
          
          <MagicSparkles minSparkles={3} maxSparkles={6}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Real Results From Real Businesses
            </h2>
          </MagicSparkles>
          
          <p className="text-xl text-gray-300 mb-8">
            See how companies across industries have transformed their marketing performance with personalized content
          </p>
        </div>
        
        {/* Case study selector tabs */}
        <div className="max-w-6xl mx-auto mb-12 overflow-x-auto hide-scrollbar">
          <div className="flex space-x-4">
            {caseStudies.map((study, index) => (
              <motion.button
                key={study.id}
                whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveCaseStudy(index)}
                className={`flex-shrink-0 min-w-[200px] max-w-xs p-4 rounded-xl border ${
                  activeCaseStudy === index 
                    ? 'bg-gradient-to-br from-primary-600 to-primary-800 border-primary-500'
                    : 'bg-gray-800 border-gray-700 hover:border-primary-500/50'
                } transition-all duration-300`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-black/30 rounded-lg p-2 mr-3">
                    <img 
                      src={study.logo} 
                      alt={study.company}
                      className="w-8 h-8 object-cover rounded"
                    />
                  </div>
                  <div className="text-left">
                    <h4 className={`font-bold truncate ${activeCaseStudy === index ? 'text-white' : 'text-gray-300'}`}>
                      {study.company}
                    </h4>
                    <p className="text-xs text-gray-400 truncate">
                      {study.industry}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
        
        {/* Active case study details */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={caseStudies[activeCaseStudy].id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto p-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 mb-16"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Case study details */}
              <div>
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <div className="bg-primary-900/50 p-2 rounded-lg mr-3 flex-shrink-0">
                      {caseStudies[activeCaseStudy].industry === 'Financial Services' ? (
                        <DollarSign className="h-6 w-6 text-primary-400" />
                      ) : caseStudies[activeCaseStudy].industry === 'E-Commerce Fashion' ? (
                        <TrendingUp className="h-6 w-6 text-primary-400" />
                      ) : caseStudies[activeCaseStudy].industry === 'Educational Technology' ? (
                        <Users className="h-6 w-6 text-primary-400" />
                      ) : caseStudies[activeCaseStudy].industry === 'SaaS / Enterprise Software' ? (
                        <BarChart className="h-6 w-6 text-primary-400" />
                      ) : (
                        <CheckCircle className="h-6 w-6 text-primary-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        {caseStudies[activeCaseStudy].company}
                      </h3>
                      <p className="text-gray-400">
                        {caseStudies[activeCaseStudy].industry}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Challenge & Solution */}
                <div className="mb-8">
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-primary-400 mb-2">The Challenge</h4>
                    <motion.p 
                      className="text-gray-300"
                      whileHover={{ x: 5 }}
                    >
                      {caseStudies[activeCaseStudy].challenge}
                    </motion.p>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-primary-400 mb-2">The Solution</h4>
                    <motion.p 
                      className="text-gray-300"
                      whileHover={{ x: 5 }}
                    >
                      {caseStudies[activeCaseStudy].solution}
                    </motion.p>
                  </div>
                </div>
                
                {/* Testimonial */}
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-primary-900/30 border border-primary-800/40 p-6 rounded-xl mb-6"
                >
                  <div className="flex items-start">
                    <div className="relative flex-shrink-0 mr-4">
                      <div className="absolute -inset-1 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full opacity-70 blur-sm"></div>
                      <img 
                        src={caseStudies[activeCaseStudy].testimonial.image} 
                        alt={caseStudies[activeCaseStudy].testimonial.author}
                        className="w-12 h-12 rounded-full relative z-10 object-cover"
                      />
                    </div>
                    <div>
                      <motion.p 
                        className="text-gray-200 italic mb-3"
                        whileHover={{ x: 3 }}
                      >
                        "{caseStudies[activeCaseStudy].testimonial.quote}"
                      </motion.p>
                      <div className="text-white font-medium">
                        {caseStudies[activeCaseStudy].testimonial.author}
                        <span className="text-gray-400 font-normal ml-2">
                          • {caseStudies[activeCaseStudy].testimonial.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                {/* Timeline */}
                <div className="text-sm text-gray-400">
                  <span className="text-primary-400 font-medium">Implementation Timeline:</span> {caseStudies[activeCaseStudy].timeline}
                </div>
              </div>
              
              {/* Results and metrics */}
              <div>
                {/* Featured image */}
                <motion.div
                  whileHover={{ scale: 1.02, borderColor: "rgba(99, 102, 241, 0.5)" }}
                  className="rounded-xl overflow-hidden border border-gray-700 mb-8"
                >
                  <div className="relative aspect-video">
                    <img 
                      src={caseStudies[activeCaseStudy].featuredImage} 
                      alt={`${caseStudies[activeCaseStudy].company} implementation`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                    
                    {/* Call-to-action overlay */}
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                      <span className="text-white font-medium">VideoRemix.vip Solution</span>
                      <motion.a 
                        href="https://ai-personalized-content.videoremix.vip"
                        className="flex items-center bg-primary-600/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm"
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(99, 102, 241, 0.9)" }}
                      >
                        Watch Case Study Video
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </motion.a>
                    </div>
                  </div>
                </motion.div>
                
                {/* Results cards */}
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-primary-400 mb-4">The Results</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {caseStudies[activeCaseStudy].results.map((result, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ 
                          y: -5,
                          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)", 
                          backgroundColor: "rgba(31, 41, 55, 0.8)",
                          borderColor: "rgba(99, 102, 241, 0.4)"
                        }}
                        className="bg-gray-800/60 rounded-xl border border-gray-700 p-5"
                      >
                        <div className="flex items-start">
                          <div className={`bg-gray-900 p-2 rounded-lg mr-3 ${result.color}`}>
                            {result.icon}
                          </div>
                          <div>
                            <motion.div 
                              className={`text-2xl font-bold ${result.color}`}
                              whileHover={{ scale: 1.1 }}
                              transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                              {result.value}
                            </motion.div>
                            <div className="text-sm text-gray-400">
                              {result.metric}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Before/After comparison */}
                <motion.div
                  whileHover={{ 
                    borderColor: "rgba(99, 102, 241, 0.5)",
                    backgroundColor: "rgba(31, 41, 55, 0.8)"
                  }}
                  className="bg-gray-800/60 border border-gray-700 rounded-xl p-6"
                >
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 text-primary-400 mr-2" />
                    Marketing Performance Transformation
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm font-medium text-gray-400 mb-2">BEFORE</div>
                      <div className="p-4 bg-gray-900 rounded-lg">
                        <div className="h-5 w-1/4 bg-red-900/40 rounded mb-2"></div>
                        <div className="h-5 w-1/6 bg-red-900/40 rounded-r mb-2"></div>
                        <div className="h-5 w-1/3 bg-red-900/40 rounded-r"></div>
                        <div className="flex justify-between mt-2 text-xs">
                          <span className="text-gray-500">Generic Marketing</span>
                          <span className="text-red-400">Low Performance</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-400 mb-2">AFTER</div>
                      <div className="p-4 bg-gray-900 rounded-lg">
                        <div className="h-5 w-3/4 bg-green-900/40 rounded mb-2"></div>
                        <div className="h-5 w-4/5 bg-green-900/40 rounded-r mb-2"></div>
                        <div className="h-5 w-2/3 bg-green-900/40 rounded-r"></div>
                        <div className="flex justify-between mt-2 text-xs">
                          <span className="text-gray-500">Personalized Marketing</span>
                          <span className="text-green-400">High Performance</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center mt-4">
                    <motion.a
                      href="https://ai-personalized-content.videoremix.vip"
                      className="text-primary-400 text-sm font-medium inline-flex items-center"
                      whileHover={{ scale: 1.05, x: 5 }}
                    >
                      Explore the complete case study
                      <ArrowUpRight className="ml-1 h-3 w-3" />
                    </motion.a>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Case study navigation */}
        <div className="flex justify-center space-x-3 mb-16">
          <motion.button
            onClick={() => setActiveCaseStudy((prev) => (prev === 0 ? caseStudies.length - 1 : prev - 1))}
            whileHover={{ scale: 1.1, x: -3 }}
            whileTap={{ scale: 0.9 }}
            className="bg-gray-800 p-3 rounded-full text-white hover:bg-gray-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </motion.button>
          
          <div className="flex space-x-2">
            {caseStudies.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setActiveCaseStudy(index)}
                whileHover={{ scale: 1.2 }}
                className={`w-2 h-2 rounded-full transition-all ${
                  activeCaseStudy === index ? 'w-8 bg-primary-500' : 'bg-gray-600'
                }`}
                aria-label={`Go to case study ${index + 1}`}
              />
            ))}
          </div>
          
          <motion.button
            onClick={() => setActiveCaseStudy((prev) => (prev + 1) % caseStudies.length)}
            whileHover={{ scale: 1.1, x: 3 }}
            whileTap={{ scale: 0.9 }}
            className="bg-gray-800 p-3 rounded-full text-white hover:bg-gray-700"
          >
            <ChevronRight className="h-5 w-5" />
          </motion.button>
        </div>
        
        {/* Industry-specific metrics */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-2xl font-bold text-white mb-4 sm:mb-0">
              Industry-Specific Results
            </h3>
            
            <div className="flex space-x-3 overflow-x-auto hide-scrollbar pb-2">
              {industryMetrics.map((industry, index) => (
                <motion.button
                  key={index}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveIndustry(index)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    activeIndustry === index 
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {industry.industry}
                </motion.button>
              ))}
            </div>
          </div>
          
          <motion.div
            key={activeIndustry}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-6"
          >
            <h4 className="text-lg font-bold text-white mb-6 flex items-center">
              <LineChart className="h-5 w-5 text-primary-400 mr-2" />
              Marketing Personalization Impact in {industryMetrics[activeIndustry].industry}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {industryMetrics[activeIndustry].metrics.map((metric, index) => (
                <motion.div
                  key={index}
                  whileHover={{ 
                    y: -8,
                    backgroundColor: "rgba(31, 41, 55, 0.8)",
                    borderColor: "rgba(99, 102, 241, 0.4)"
                  }}
                  className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-lg border border-gray-700 p-6 text-center"
                >
                  <motion.div 
                    className="text-2xl md:text-3xl font-bold text-primary-400 mb-2"
                    whileHover={{ 
                      scale: 1.1,
                      textShadow: "0 0 8px rgba(99, 102, 241, 0.5)"
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {metric.value}
                  </motion.div>
                  <div className="text-gray-300">{metric.label}</div>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <motion.a
                href="https://ai-personalized-content.videoremix.vip"
                className="inline-flex items-center text-primary-400 font-medium"
                whileHover={{ scale: 1.05, x: 5 }}
              >
                Download the complete {industryMetrics[activeIndustry].industry} benchmark report
                <ExternalLink className="ml-1 h-4 w-4" />
              </motion.a>
            </div>
          </motion.div>
        </div>
        
        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center bg-gradient-to-r from-primary-900/40 to-primary-700/40 p-8 rounded-xl border border-primary-500/30"
          whileHover={{ 
            y: -10,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            borderColor: "rgba(99, 102, 241, 0.4)"
          }}
        >
          <h3 className="text-2xl font-bold text-white mb-4">
            Ready to Create Your Success Story?
          </h3>
          
          <p className="text-xl text-gray-300 mb-8">
            Join these businesses and achieve breakthrough results with personalized marketing videos
          </p>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <a 
              href="https://ai-personalized-content.videoremix.vip" 
              className="inline-flex items-center bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold px-8 py-4 rounded-lg shadow-lg"
            >
              Start Your Personalization Journey
              <motion.div
                animate={{
                  x: [0, 5, 0],
                  transition: { repeat: Infinity, duration: 1.5 }
                }}
              >
                <ArrowRight className="ml-2 h-5 w-5" />
              </motion.div>
            </a>
          </motion.div>
          
          <p className="text-gray-400 mt-4 text-sm">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </motion.div>
      </div>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
};

export default CaseStudiesSection;