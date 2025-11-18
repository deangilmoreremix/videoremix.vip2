import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video } from 'lucide-react';
import useMeasure from 'react-use-measure';
import CountUp from 'react-countup';

const ActiveUsers = () => {
  const [countRef, { height }] = useMeasure();
  const [count, setCount] = useState(9721);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: 1 }}
      className="mt-6 flex items-center justify-center z-10 relative"
    >
      <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10 shadow-md">
        <div className="flex items-center">
          <motion.div
            animate={{
              scale: [1, 1.2, 1]
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              repeatType: "reverse"
            }}
          >
            <Video className="h-4 w-4 text-green-400 mr-2" />
          </motion.div>
          <div className="text-white text-sm">
            <span ref={countRef} className="font-bold">
              <CountUp
                start={count - 5}
                end={count}
                duration={3}
                separator=","
              />
            </span> marketers using personalization now

            {/* Animated indicator dot */}
            <motion.span
              className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full ml-1"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </div>
      </div>

      {/* Connection lines animation */}
      <AnimatePresence>
        {height > 0 && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 0,
                  scale: 0,
                  x: -50 + (i * 50),
                  y: -height * 2
                }}
                animate={{
                  opacity: [0, 0.8, 0],
                  scale: [0, 1, 0],
                  x: [-50 + (i * 50), 0, 50 - (i * 50)],
                  y: [-height * 2, -height/2, 0]
                }}
                transition={{
                  duration: 2 + i * 0.5,
                  repeat: Infinity,
                  repeatDelay: i * 1,
                }}
                className="absolute w-0.5 h-8 bg-gradient-to-b from-green-500/80 to-green-500/0 rounded-full"
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ActiveUsers;