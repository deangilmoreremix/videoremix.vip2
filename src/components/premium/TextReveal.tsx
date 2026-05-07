import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  staggerChildren?: number;
  as?: keyof JSX.IntrinsicElements;
}

const TextReveal: React.FC<TextRevealProps> = ({
  text,
  className = '',
  delay = 0,
  duration = 0.05,
  staggerChildren = 0.03,
  as: Component = 'h2',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const words = text.split(' ');

  return (
    <div ref={ref}>
      <Component className={className}>
        <AnimatePresence>
          {words.map((word, wordIndex) => (
            <span key={wordIndex} className="inline-block">
              {word.split('').map((char, charIndex) => (
                <motion.span
                  key={`${wordIndex}-${charIndex}`}
                  initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                  animate={
                    isVisible
                      ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                      : { opacity: 0, y: 20, filter: 'blur(10px)' }
                  }
                  transition={{
                    duration: duration * 10,
                    delay: delay + (wordIndex * staggerChildren * 10) + charIndex * 0.01,
                    ease: 'easeOut',
                  }}
                  className="inline-block"
                >
                  {char}
                </motion.span>
              ))}
              <span className="inline-block">&nbsp;</span>
            </span>
          ))}
        </AnimatePresence>
      </Component>
    </div>
  );
};

export default TextReveal;
