import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Star, Quote } from 'lucide-react';

interface FeatureTestimonialsProps {
  testimonials: {
    quote: string;
    name: string;
    title: string;
    image: string;
  }[];
  category?: string;
}

const FeatureTestimonials: React.FC<FeatureTestimonialsProps> = ({ testimonials, category }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Get category-specific testimonials if available, or use provided ones
  const displayTestimonials = testimonials;

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % displayTestimonials.length);
  };
  
  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + displayTestimonials.length) % displayTestimonials.length);
  };

  return (
    <section className="py-20 bg-black relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>
      <div className="absolute inset-0 opacity-5 bg-grid-pattern"></div>
      
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
              SUCCESS STORIES
            </div>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            What Our Users Say
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Hear from professionals who have transformed their workflow with this feature.
          </p>
        </motion.div>
        
        {/* Testimonial Cards */}
        <div className="relative max-w-4xl mx-auto mb-16">
          {/* Navigation arrows */}
          {displayTestimonials.length > 1 && (
            <>
              <motion.button
                onClick={prevTestimonial}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-0 md:-translate-x-12 z-20 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg"
                aria-label="Previous testimonial"
                whileHover={{ 
                  scale: 1.1, 
                  x: "-10px",
                  backgroundColor: "rgba(55, 65, 81, 0.8)",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)"
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
                  x: "10px",
                  backgroundColor: "rgba(55, 65, 81, 0.8)",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)"
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
              {displayTestimonials.map((testimonial, index) => (
                activeIndex === index && (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5 }}
                    whileHover={{ 
                      y: -5,
                      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
                      borderColor: "rgba(99, 102, 241, 0.4)"
                    }}
                    className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 p-8 transition-all duration-300"
                  >
                    {/* Quote and rating */}
                    <div className="mb-6 relative">
                      <motion.div
                        whileHover={{
                          rotate: [0, 10, -10, 0],
                          scale: 1.1,
                          transition: { duration: 0.5 }
                        }}
                        className="absolute -top-1 -left-1 z-10" 
                      >
                        <Quote className="h-8 w-8 text-primary-600 opacity-20" />
                      </motion.div>
                      <div className="pl-6">
                        <div className="flex mb-4">
                          {[...Array(5)].map((_, i) => (
                            <motion.div
                              key={i}
                              whileHover={{ 
                                scale: 1.3, 
                                rotate: [-5, 5, 0],
                                y: -2,
                                transition: { duration: 0.3 }
                              }}
                              className="mr-1"
                            >
                              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            </motion.div>
                          ))}
                        </div>
                        <motion.p 
                          className="text-xl text-gray-100 italic leading-relaxed"
                          whileHover={{ x: 5, transition: { duration: 0.2 } }}
                        >
                          "{testimonial.quote}"
                        </motion.p>
                      </div>
                    </div>
                    
                    {/* Author info and stats */}
                    <div className="flex flex-col md:flex-row justify-between items-center">
                      <motion.div 
                        className="flex items-center mb-4 md:mb-0"
                        whileHover={{ 
                          x: 5,
                          transition: { duration: 0.2 } 
                        }}
                      >
                        <motion.img
                          src={testimonial.image}
                          alt={testimonial.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-primary-500 mr-4"
                          whileHover={{ 
                            scale: 1.1,
                            borderWidth: "3px", 
                            boxShadow: "0 0 0 2px rgba(99, 102, 241, 0.3)"
                          }}
                        />
                        <div>
                          <motion.div 
                            className="text-white font-bold"
                            whileHover={{ scale: 1.05 }}
                          >
                            {testimonial.name}
                          </motion.div>
                          <div className="text-gray-400 text-sm">
                            {testimonial.title}
                          </div>
                        </div>
                      </motion.div>
                      
                      <div className="flex space-x-4">
                        <motion.div 
                          className="bg-black/30 rounded-lg px-4 py-2 text-center"
                          whileHover={{ 
                            y: -5,
                            backgroundColor: "rgba(0, 0, 0, 0.4)"
                          }}
                        >
                          <div className="text-primary-400 font-bold">85%</div>
                          <div className="text-xs text-gray-400">Time Saved</div>
                        </motion.div>
                        <motion.div 
                          className="bg-black/30 rounded-lg px-4 py-2 text-center"
                          whileHover={{ 
                            y: -5,
                            backgroundColor: "rgba(0, 0, 0, 0.4)"
                          }}
                        >
                          <div className="text-primary-400 font-bold">3x</div>
                          <div className="text-xs text-gray-400">Output</div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                )
              ))}
            </AnimatePresence>
            
            {/* Dots indicator */}
            {displayTestimonials.length > 1 && (
              <div className="flex justify-center mt-6 space-x-2">
                {displayTestimonials.map((_, idx) => (
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
                        "rgb(156, 163, 175)"
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureTestimonials;