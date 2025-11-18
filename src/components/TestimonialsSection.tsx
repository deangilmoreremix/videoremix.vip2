import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote, Users, ArrowRight, Award, BadgeCheck, Globe, TrendingUp, Video } from 'lucide-react';
import { useLandingPageContent } from '../context/LandingPageContext';
import { testimonialsData as staticTestimonials } from '../data/testimonialsData';
import MagicSparkles from './MagicSparkles';

const TestimonialsSection: React.FC = () => {
  const { testimonials: dbTestimonials, isLoading } = useLandingPageContent();
  const [activeIndex, setActiveIndex] = useState(0);
  const [videoModal, setVideoModal] = useState<{open: boolean, url: string}>({open: false, url: ''});
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Use DB testimonials if available, otherwise fallback to static data
  const allTestimonials = (!isLoading && dbTestimonials && dbTestimonials.length > 0) 
    ? dbTestimonials 
    : staticTestimonials;
    
  // Filter testimonials based on active filter
  const testimonials = activeFilter === 'all' 
    ? allTestimonials.filter(t => t.featured)
    : allTestimonials.filter(t => t.category === activeFilter);
  
  useEffect(() => {
    if (!testimonials || testimonials.length <= 1) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, [testimonials]);
  
  // Prevent errors with empty testimonials
  if (!testimonials || testimonials.length === 0) {
    return null;
  }
  
  const nextTestimonial = () => {
    if (testimonials.length > 1) {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }
  };
  
  const prevTestimonial = () => {
    if (testimonials.length > 1) {
      setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    }
  };

  // Company logos for social proof
  const companyLogos = [
    { name: "Microsoft", url: "https://cdn.worldvectorlogo.com/logos/microsoft-1.svg" },
    { name: "Adobe", url: "https://cdn.worldvectorlogo.com/logos/adobe-1.svg" },
    { name: "Spotify", url: "https://cdn.worldvectorlogo.com/logos/spotify-2.svg" },
    { name: "Shopify", url: "https://cdn.worldvectorlogo.com/logos/shopify.svg" },
    { name: "Slack", url: "https://cdn.worldvectorlogo.com/logos/slack-1.svg" },
    { name: "Airbnb", url: "https://cdn.worldvectorlogo.com/logos/airbnb.svg" }
  ];
  
  // Testimonial categories for filtering
  const categories = [
    { id: 'all', name: 'All Stories' },
    { id: 'content-creation', name: 'Content Creators' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'enterprise', name: 'Enterprise' },
    { id: 'small-business', name: 'Small Business' },
    { id: 'education', name: 'Education' }
  ];

  // Success metrics
  const metrics = [
    { value: "5M+", label: "Videos Created", icon: <Video className="h-5 w-5 text-primary-400" /> },
    { value: "83%", label: "Time Saved", icon: <TrendingUp className="h-5 w-5 text-primary-400" /> },
    { value: "12K+", label: "Active Users", icon: <Users className="h-5 w-5 text-primary-400" /> },
    { value: "150+", label: "Countries", icon: <Globe className="h-5 w-5 text-primary-400" /> },
  ];

  // Case studies for more detailed testimonials
  const caseStudies = [
    {
      company: "TechGrowth Marketing",
      logo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&q=80",
      metrics: {
        engagement: "+215%",
        production: "10x",
        conversion: "+157%"
      },
      story: "TechGrowth scaled their video marketing from 5 to 50 videos per month without hiring additional team members."
    },
    {
      company: "Global Learning Academy",
      logo: "https://images.unsplash.com/photo-1577641992252-1e9b3f789732?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&q=80",
      metrics: {
        engagement: "+186%",
        production: "7x",
        conversion: "+92%"
      },
      story: "This online learning platform increased student engagement by generating personalized educational videos."
    }
  ];

  return (
    <section id="testimonials" className="py-20 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-500/10 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-primary-700/10 rounded-full blur-[100px] -z-10"></div>
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
            <div className="bg-primary-500/20 text-primary-400 px-4 py-1.5 rounded-full text-sm font-semibold flex items-center">
              <Award className="mr-2 h-4 w-4" />
              SUCCESS STORIES
            </div>
          </div>
          
          <MagicSparkles minSparkles={3} maxSparkles={6}>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Don't Take Our Word For It
            </h2>
          </MagicSparkles>
          
          <p className="text-xl text-gray-300">
            Hear directly from creators and businesses who've transformed their video production with VideoRemix.vip
          </p>
        </motion.div>
        
        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto flex flex-wrap justify-center items-center gap-3 md:gap-6 mb-16 opacity-80"
        >
          {companyLogos.map((company, idx) => (
            <motion.img 
              key={idx}
              src={company.url} 
              alt={company.name}
              className="h-8 md:h-10 object-contain dark:invert"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
              whileHover={{ 
                scale: 1.2, 
                filter: "brightness(1.3)",
                transition: { duration: 0.3 } 
              }}
            />
          ))}
        </motion.div>
        
        {/* Testimonial filters */}
        <div className="max-w-5xl mx-auto mb-10">
          <div className="flex justify-center flex-wrap gap-3">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ 
                  scale: 1.05, 
                  y: -2,
                  backgroundColor: category.id === activeFilter ? 
                    "rgb(79, 70, 229)" : 
                    "rgb(55, 65, 81)"
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveFilter(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === category.id
                    ? 'bg-primary-600 text-white shadow'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category.name}
              </motion.button>
            ))}
          </div>
        </div>
        
        {/* Main Testimonial Carousel */}
        <div className="relative max-w-4xl mx-auto mb-16">
          {/* Navigation arrows */}
          {testimonials.length > 1 && (
            <>
              <motion.button
                onClick={prevTestimonial}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-0 md:-translate-x-12 z-20 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg"
                aria-label="Previous testimonial"
                whileHover={{ 
                  scale: 1.1,
                  x: "-5px",
                  backgroundColor: "rgb(55, 65, 81)",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2)"
                }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronLeft className="h-5 w-5" />
              </motion.button>
              
              <motion.button
                onClick={nextTestimonial}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-0 md:translate-x-12 z-20 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg"
                aria-label="Next testimonial"
                whileHover={{ 
                  scale: 1.1,
                  x: "5px",
                  backgroundColor: "rgb(55, 65, 81)",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2)"
                }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronRight className="h-5 w-5" />
              </motion.button>
            </>
          )}
          
          {/* Testimonial Slider */}
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              {testimonials.map((testimonial, index) => (
                activeIndex === index && (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 p-8"
                    whileHover={{ 
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                      borderColor: "rgba(99, 102, 241, 0.3)"
                    }}
                  >
                    <div className="flex flex-col md:flex-row items-start gap-8">
                      {/* Author image - larger and more prominent */}
                      <div className="md:w-1/4 flex flex-col items-center">
                        <motion.div 
                          className="relative"
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="absolute -inset-1 bg-gradient-to-br from-primary-400 to-primary-600 opacity-50 blur-md rounded-full"></div>
                          <motion.img
                            src={testimonial.image_url || testimonial.image}
                            alt={testimonial.name}
                            className="relative w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-2 border-primary-500 shadow-lg"
                            whileHover={{ 
                              rotate: [0, -5, 5, 0],
                              borderWidth: "3px",
                              transition: { duration: 0.5 }
                            }}
                          />
                        </motion.div>
                        
                        <div className="text-center mt-4">
                          <motion.div 
                            className="text-white font-bold text-lg"
                            whileHover={{ scale: 1.05 }}
                          >
                            {testimonial.name}
                          </motion.div>
                          <div className="text-gray-400">
                            {testimonial.role}
                            {testimonial.company ? 
                              `, ${testimonial.company}` : ''}
                          </div>
                          
                          {/* Verification badge */}
                          <motion.div 
                            className="flex items-center justify-center mt-2 text-xs text-primary-400"
                            whileHover={{ 
                              scale: 1.1,
                              x: 3,
                              color: "rgb(129, 140, 248)"
                            }}
                          >
                            <BadgeCheck className="h-4 w-4 mr-1" />
                            <span>Verified Customer</span>
                          </motion.div>
                        </div>
                      </div>
                      
                      {/* Quote and content */}
                      <div className="md:w-3/4">
                        {/* Quote and rating */}
                        <div className="mb-6">
                          <div className="relative">
                            <Quote className="absolute -top-1 -left-1 h-8 w-8 text-primary-600 opacity-20" />
                            <div className="flex mb-4 ml-6">
                              {[...Array(testimonial.rating || 5)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  whileHover={{ 
                                    scale: 1.2, 
                                    rotate: [-5, 5, 0],
                                    y: -3,
                                    transition: { duration: 0.3 }
                                  }}
                                >
                                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 mr-1" />
                                </motion.div>
                              ))}
                            </div>
                          </div>
                          <motion.p 
                            className="text-xl md:text-2xl text-gray-100 italic leading-relaxed mb-6"
                            whileHover={{ x: 5 }}
                          >
                            "{testimonial.content || testimonial.quote}"
                          </motion.p>
                        </div>
                        
                        {/* Results and metrics */}
                        <motion.div 
                          className="bg-gray-900/50 rounded-lg p-4 border border-gray-800 mb-4"
                          whileHover={{ 
                            y: -5,
                            backgroundColor: "rgba(17, 24, 39, 0.7)",
                            borderColor: "rgba(99, 102, 241, 0.3)"
                          }}
                        >
                          <div className="text-sm text-gray-400 mb-2 flex items-center">
                            <TrendingUp className="h-4 w-4 mr-1 text-green-400" />
                            <span>Results after using VideoRemix.vip:</span>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <motion.div 
                              className="text-center"
                              whileHover={{ 
                                scale: 1.05,
                                y: -2,
                                transition: { duration: 0.2 }
                              }}
                            >
                              <div className="text-xl font-bold text-green-400">+210%</div>
                              <div className="text-xs text-gray-500">Video Output</div>
                            </motion.div>
                            <motion.div 
                              className="text-center"
                              whileHover={{ 
                                scale: 1.05,
                                y: -2,
                                transition: { duration: 0.2 }
                              }}
                            >
                              <div className="text-xl font-bold text-green-400">-75%</div>
                              <div className="text-xs text-gray-500">Production Time</div>
                            </motion.div>
                            <motion.div 
                              className="text-center"
                              whileHover={{ 
                                scale: 1.05,
                                y: -2,
                                transition: { duration: 0.2 }
                              }}
                            >
                              <div className="text-xl font-bold text-green-400">+186%</div>
                              <div className="text-xs text-gray-500">Engagement</div>
                            </motion.div>
                          </div>
                        </motion.div>
                        
                        {/* Video testimonial button */}
                        <div className="text-right">
                          <motion.button 
                            onClick={() => setVideoModal({open: true, url: 'https://www.youtube.com/embed/dQw4w9WgXcQ'})} 
                            className="inline-flex items-center text-primary-400 hover:text-primary-300 text-sm"
                            whileHover={{ 
                              x: 5, 
                              scale: 1.05,
                              textShadow: "0 0 8px rgba(99, 102, 241, 0.3)"
                            }}
                            whileTap={{ scale: 0.97 }}
                          >
                            <Video className="h-4 w-4 mr-1" />
                            Watch video testimonial
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              ))}
            </AnimatePresence>
            
            {/* Dots indicator */}
            {testimonials.length > 1 && (
              <div className="flex justify-center mt-6 space-x-2">
                {testimonials.map((_, idx) => (
                  <motion.button
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx === activeIndex ? "bg-primary-500 w-6" : "bg-gray-600"
                    }`}
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`Go to testimonial ${idx + 1}`}
                    whileHover={{ 
                      scale: 1.5,
                      backgroundColor: idx === activeIndex ? 
                        "rgb(99, 102, 241)" : 
                        "rgb(107, 114, 128)"
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Customer types showcase */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center"
              whileHover={{ 
                y: -10,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
                borderColor: "rgba(99, 102, 241, 0.4)",
              }}
            >
              <motion.div 
                className="bg-primary-900/50 w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3"
                whileHover={{ 
                  rotate: [0, 10, -10, 0],
                  scale: 1.1,
                  transition: { duration: 0.5 }
                }}
              >
                {metric.icon}
              </motion.div>
              <motion.div 
                className="text-3xl font-bold text-white mb-2"
                whileHover={{ 
                  scale: 1.1,
                  color: "rgb(165, 180, 252)",
                  transition: { duration: 0.3 }
                }}
              >
                {metric.value}
              </motion.div>
              <div className="text-gray-400">{metric.label}</div>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Case Studies */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto mb-12"
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-white">Success Stories</h3>
            <motion.a 
              href="#case-studies" 
              className="text-primary-400 hover:text-primary-300 flex items-center text-sm font-medium"
              whileHover={{ 
                x: 5,
                textShadow: "0 0 8px rgba(99, 102, 241, 0.3)" 
              }}
            >
              View all case studies
              <ArrowRight className="ml-1 h-4 w-4" />
            </motion.a>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {caseStudies.map((study, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700"
                whileHover={{ 
                  y: -10,
                  borderColor: "rgba(99, 102, 241, 0.4)",
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
                }}
              >
                <div className="p-6">
                  <motion.div 
                    className="flex items-start mb-5"
                    whileHover={{ x: 5 }}
                  >
                    <motion.img 
                      src={study.logo} 
                      alt={study.company} 
                      className="w-12 h-12 rounded-lg object-cover mr-4"
                      whileHover={{ scale: 1.1 }}
                    />
                    <div>
                      <h4 className="text-white font-bold text-lg">{study.company}</h4>
                      <motion.div 
                        className="flex items-center text-sm text-primary-400"
                        whileHover={{ 
                          x: 3,
                          color: "rgb(129, 140, 248)" 
                        }}
                      >
                        <BadgeCheck className="h-4 w-4 mr-1" />
                        <span>Verified Case Study</span>
                      </motion.div>
                    </div>
                  </motion.div>
                  
                  <p className="text-gray-300 mb-5">{study.story}</p>
                  
                  <motion.div 
                    className="grid grid-cols-3 gap-3 bg-black/30 rounded-lg p-4"
                    whileHover={{ 
                      backgroundColor: "rgba(0, 0, 0, 0.4)",
                    }}
                  >
                    <motion.div 
                      className="text-center"
                      whileHover={{ 
                        y: -5,
                        scale: 1.05 
                      }}
                    >
                      <div className="text-xl font-bold text-green-400">{study.metrics.engagement}</div>
                      <div className="text-xs text-gray-500">Engagement</div>
                    </motion.div>
                    <motion.div 
                      className="text-center"
                      whileHover={{ 
                        y: -5,
                        scale: 1.05 
                      }}
                    >
                      <div className="text-xl font-bold text-purple-400">{study.metrics.production}</div>
                      <div className="text-xs text-gray-500">Production</div>
                    </motion.div>
                    <motion.div 
                      className="text-center"
                      whileHover={{ 
                        y: -5,
                        scale: 1.05 
                      }}
                    >
                      <div className="text-xl font-bold text-blue-400">{study.metrics.conversion}</div>
                      <div className="text-xs text-gray-500">Conversion</div>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Awards and Recognition */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-5xl mx-auto text-center mb-10"
        >
          <h3 className="text-2xl font-bold text-white mb-6">
            Award-Winning Platform
          </h3>
          
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { award: "Video Innovation Award 2024", organization: "Digital Media Alliance" },
              { award: "Best AI-Driven Product", organization: "Tech Innovator Awards" },
              { award: "Top Creator Tool", organization: "Content Creator Summit" },
              { award: "Most User-Friendly Video Platform", organization: "UX Design Awards" }
            ].map((award, idx) => (
              <motion.div 
                key={idx} 
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 flex flex-col items-center border border-gray-700"
                whileHover={{ 
                  y: -8,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
                  borderColor: "rgba(234, 179, 8, 0.4)",
                }}
              >
                <motion.div
                  whileHover={{ 
                    rotate: [0, 10, -10, 0],
                    scale: 1.2,
                    transition: { duration: 0.5 }
                  }}
                >
                  <Award className="h-8 w-8 text-yellow-500 mb-2" />
                </motion.div>
                <div className="text-white font-bold text-sm">{award.award}</div>
                <div className="text-gray-400 text-xs">{award.organization}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h3 className="text-2xl font-bold text-white mb-4">Join Thousands of Happy Customers</h3>
          <p className="text-xl text-gray-300 mb-8">
            Experience the platform that creators and businesses trust for their video content
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.a
              href="#get-started"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 25px -5px rgba(79, 70, 229, 0.3)"
              }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold px-8 py-4 rounded-lg flex items-center justify-center"
            >
              Get Started Free
              <motion.span
                animate={{
                  x: [0, 5, 0],
                  transition: { repeat: Infinity, duration: 1.5, repeatType: "loop" }
                }}
              >
                <ArrowRight className="ml-2 h-5 w-5" />
              </motion.span>
            </motion.a>
            <motion.a
              href="#view-all-testimonials"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
                borderColor: "rgba(99, 102, 241, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
              className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-lg border border-gray-700 flex items-center justify-center"
            >
              View All Testimonials
            </motion.a>
          </div>
        </motion.div>
      </div>
      
      {/* Video Testimonial Modal */}
      {videoModal.open && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setVideoModal({open: false, url: ''})}
        >
          <motion.div 
            className="relative w-full max-w-4xl" 
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <motion.button 
              onClick={() => setVideoModal({open: false, url: ''})}
              className="absolute -top-12 right-0 text-white hover:text-gray-300"
              whileHover={{ scale: 1.1, rotate: [0, 15, -15, 0] }}
              whileTap={{ scale: 0.9 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
            <div className="bg-black rounded-xl overflow-hidden relative" style={{ paddingBottom: '56.25%' }}>
              <iframe 
                className="absolute top-0 left-0 w-full h-full"
                src={videoModal.url} 
                title="Video Testimonial" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
};

export default TestimonialsSection;