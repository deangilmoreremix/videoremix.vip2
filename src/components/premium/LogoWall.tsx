import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface LogoWallProps {
  className?: string;
  title?: string;
  logos: { name: string; url: string }[];
}

const LogoWall: React.FC<LogoWallProps> = ({
  className = '',
  title = 'Trusted by innovative companies worldwide',
  logos,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });
  const [startAnimation, setStartAnimation] = useState(false);

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => setStartAnimation(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isInView]);

  return (
    <div ref={ref} className={className}>
      {title && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center text-sm text-gray-500 uppercase tracking-widest mb-8"
        >
          {title}
        </motion.p>
      )}
      <div className="flex flex-wrap justify-center gap-8 items-center">
        {logos.map((logo, index) => (
          <motion.div
            key={logo.name}
            initial={{ opacity: 0, filter: 'grayscale(100%)' }}
            animate={
              startAnimation
                ? { opacity: 1, filter: 'grayscale(0%)' }
                : { opacity: 0.3, filter: 'grayscale(100%)' }
            }
            transition={{ duration: 0.8, delay: index * 0.1 }}
            whileHover={{ scale: 1.1, filter: 'grayscale(0%) brightness(1.2)' }}
            className="relative"
          >
            <img
              src={logo.url}
              alt={logo.name}
              className="h-8 md:h-10 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LogoWall;
