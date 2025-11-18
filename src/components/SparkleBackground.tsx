import React from 'react';

interface SparkleBackgroundProps {
  children?: React.ReactNode;
  density?: 'low' | 'medium' | 'high';
  interactive?: boolean;
  speed?: 'slow' | 'medium' | 'fast';
  className?: string;
  includeStars?: boolean;
  includeMagicSparkles?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
}

const SparkleBackground: React.FC<SparkleBackgroundProps> = ({
  children,
  density = 'medium',
  interactive = false,
  speed = 'medium',
  className = '',
  includeStars = true,
  includeMagicSparkles = true,
  primaryColor = 'primary',
  secondaryColor = 'secondary'
}) => {
  // Convert color values to CSS-safe strings
  const getPrimaryColorValue = (): string => {
    return typeof primaryColor === 'string' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.1)';
  };
  
  const getSecondaryColorValue = (): string => {
    return typeof secondaryColor === 'string' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(236, 72, 153, 0.1)';
  };

  // Fixed background with no animations
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Static background elements */}
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: -10 }}>
        {/* Primary gradient */}
        <div 
          className={`absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full`}
          style={{ 
            backgroundColor: getPrimaryColorValue(), 
            filter: 'blur(100px)',
            zIndex: -10
          }}
        />
        
        {/* Secondary gradient */}
        <div 
          className={`absolute bottom-[10%] -left-[10%] w-[50%] h-[50%] rounded-full`}
          style={{ 
            backgroundColor: getSecondaryColorValue(), 
            filter: 'blur(100px)',
            zIndex: -10
          }}
        />
      </div>
      
      {/* Film grain texture overlay */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
          opacity: 0.03,
          mixBlendMode: 'overlay'
        }}
      />
      
      {/* Content */}
      {children}
    </div>
  );
};

export default SparkleBackground;