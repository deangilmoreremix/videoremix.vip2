import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ParallaxSectionProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  direction?: 'vertical' | 'horizontal';
}

const ParallaxSection: React.FC<ParallaxSectionProps> = ({
  children,
  className = '',
  speed = 0.5,
  direction = 'vertical',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const viewHeight = window.innerHeight;
      const elementCenter = rect.top + rect.height / 2;
      const viewCenter = viewHeight / 2;
      const delta = elementCenter - viewCenter;
      setOffset(delta * speed * -1);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div
        animate={{
          y: direction === 'vertical' ? offset : 0,
          x: direction === 'horizontal' ? offset : 0,
        }}
        transition={{ type: 'spring', stiffness: 100, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default ParallaxSection;
