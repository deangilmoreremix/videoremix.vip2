import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Star from 'lucide-react/dist/esm/icons/star.js';
import Quote from 'lucide-react/dist/esm/icons/quote.js';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  image: string;
  rating: number;
  metrics: { label: string; value: string }[];
}

interface AnimatedTestimonialCardProps {
  testimonials: Testimonial[];
  className?: string;
  autoPlay?: boolean;
  interval?: number;
}

const AnimatedTestimonialCard: React.FC<AnimatedTestimonialCardProps> = ({
  testimonials,
  className = '',
  autoPlay = true,
  interval = 6000,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const next = () => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, x: direction * 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -direction * 100 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700"
        >
          <Quote className="h-8 w-8 text-primary-500/30 mb-4" />
          <p className="text-xl text-white mb-6 italic">
            "{testimonials[activeIndex].quote}"
          </p>

          <div className="flex items-center mb-4">
            <img
              src={testimonials[activeIndex].image}
              alt={testimonials[activeIndex].name}
              className="w-12 h-12 rounded-full object-cover mr-4"
            />
            <div>
              <div className="text-white font-bold">{testimonials[activeIndex].name}</div>
              <div className="text-gray-400 text-sm">
                {testimonials[activeIndex].role}, {testimonials[activeIndex].company}
              </div>
            </div>
          </div>

          <div className="flex gap-1 mb-4">
            {[...Array(testimonials[activeIndex].rating)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {testimonials[activeIndex].metrics.map((metric, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="text-center bg-black/30 rounded-lg p-3"
              >
                <div className="text-lg font-bold text-primary-400">{metric.value}</div>
                <div className="text-xs text-gray-400">{metric.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-center gap-2 mt-6">
        {testimonials.map((_, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setDirection(i > activeIndex ? 1 : -1);
              setActiveIndex(i);
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              i === activeIndex ? 'w-8 bg-primary-500' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default AnimatedTestimonialCard;
