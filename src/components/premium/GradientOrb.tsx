import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface GradientOrbProps {
  className?: string;
  size?: number;
  colorFrom?: string;
  colorTo?: string;
  blur?: number;
  mouseFollow?: boolean;
  pulseSpeed?: number;
}

const GradientOrb: React.FC<GradientOrbProps> = ({
  className = '',
  size = 400,
  colorFrom = 'primary-600',
  colorTo = 'accent-500',
  blur = 100,
  mouseFollow = true,
  pulseSpeed = 4,
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mouseFollow) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 50,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 50,
      });
    };

    const container = containerRef.current;
    container?.addEventListener('mousemove', handleMouseMove);
    return () => container?.removeEventListener('mousemove', handleMouseMove);
  }, [mouseFollow]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      <motion.div
        className={`absolute rounded-full bg-gradient-to-br from-${colorFrom} to-${colorTo} opacity-30`}
        style={{
          width: size,
          height: size,
          filter: `blur(${blur}px)`,
          left: '50%',
          top: '50%',
          marginLeft: -size / 2,
          marginTop: -size / 2,
        }}
        animate={{
          x: mouseFollow ? mousePosition.x : 0,
          y: mouseFollow ? mousePosition.y : 0,
          scale: [1, 1.1, 1],
        }}
        transition={{
          x: { type: 'spring', stiffness: 50, damping: 30 },
          y: { type: 'spring', stiffness: 50, damping: 30 },
          scale: {
            duration: pulseSpeed,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      />
    </div>
  );
};

export default GradientOrb;
