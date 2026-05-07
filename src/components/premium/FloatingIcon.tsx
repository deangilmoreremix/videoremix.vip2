import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface FloatingIconProps {
  icon: React.ReactNode;
  className?: string;
  containerClassName?: string;
  speed?: number;
  amplitude?: number;
  delay?: number;
  mouseRepulsion?: boolean;
  onClick?: () => void;
  tooltip?: string;
}

const FloatingIcon: React.FC<FloatingIconProps> = ({
  icon,
  className = '',
  containerClassName = '',
  speed = 3,
  amplitude = 15,
  delay = 0,
  mouseRepulsion = true,
  onClick,
  tooltip,
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mouseRepulsion) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      });
    };

    const container = containerRef.current;
    container?.addEventListener('mousemove', handleMouseMove);
    return () => container?.removeEventListener('mousemove', handleMouseMove);
  }, [mouseRepulsion]);

  const repulsionX = mouseRepulsion ? -mousePosition.x * 0.1 : 0;
  const repulsionY = mouseRepulsion ? -mousePosition.y * 0.1 : 0;

  return (
    <motion.div
      ref={containerRef}
      className={`relative ${containerClassName}`}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -amplitude, 0],
      }}
      transition={{
        opacity: { duration: 0.5, delay },
        scale: { type: 'spring', stiffness: 260, damping: 20, delay },
        y: {
          duration: speed,
          repeat: Infinity,
          ease: 'easeInOut',
          delay,
        },
      }}
      whileHover={{
        scale: 1.2,
        transition: { type: 'spring', stiffness: 400, damping: 10 },
      }}
      onHoverStart={() => {
        if (onClick) onClick();
      }}
    >
      <motion.div
        animate={{
          x: repulsionX,
          y: repulsionY,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`p-3 rounded-xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 cursor-pointer ${className}`}
        whileTap={{ scale: 0.9 }}
      >
        {icon}
      </motion.div>
      {tooltip && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-xs px-2 py-1 rounded pointer-events-none"
        >
          {tooltip}
        </motion.div>
      )}
    </motion.div>
  );
};

export default FloatingIcon;
