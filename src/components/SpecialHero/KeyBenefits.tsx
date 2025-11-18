import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Shield, Star, Award } from 'lucide-react';
import { useMediaQuery } from 'react-responsive';

const KeyBenefits = () => {
  const isSmallScreen = useMediaQuery({ maxWidth: 768 });
  const benefits = [
    { icon: <Clock className="h-5 w-5 text-primary-400" />, text: "90% faster marketing creation" },
    { icon: <Shield className="h-5 w-5 text-primary-400" />, text: "Enterprise-grade security" },
    { icon: <Star className="h-5 w-5 text-primary-400" />, text: "Professional marketing results" },
    { icon: <Award className="h-5 w-5 text-primary-400" />, text: "350% higher conversions" }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className="flex flex-wrap justify-center gap-4 mt-8 z-10 relative"
    >
      {benefits.map((benefit, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
          whileHover={{ scale: 1.1, boxShadow: "0 10px 25px rgba(79, 70, 229, 0.3)" }}
          className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 flex items-center transition-all border border-white/10 shadow-sm"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="mr-2"
          >
            {benefit.icon}
          </motion.div>
          <span className="text-white">{benefit.text}</span>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default KeyBenefits;