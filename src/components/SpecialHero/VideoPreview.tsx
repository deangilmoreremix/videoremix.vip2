import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Sparkles } from 'lucide-react';
import { Tilt } from 'react-tilt';
import MagicSparkles from '../MagicSparkles';

const VideoPreview = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  // Update slider position based on mouse/touch position
  const startProgress = () => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
    }

    setProgressWidth(0);

    progressRef.current = setInterval(() => {
      setProgressWidth((prev) => {
        if (prev >= 100) {
          if (progressRef.current) {
            clearInterval(progressRef.current);
          }
          setIsPlaying(false);
          return 0;
        }
        return prev + 0.5;
      });
    }, 50);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      startProgress();
    } else if (progressRef.current) {
      clearInterval(progressRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (progressRef.current) {
        clearInterval(progressRef.current);
      }
    };
  }, []);

  // Convert progress to time format
  const progressToTime = (progress: number) => {
    const totalSeconds = 150; // 2:30 in seconds
    const currentSeconds = (progress / 100) * totalSeconds;
    const minutes = Math.floor(currentSeconds / 60);
    const seconds = Math.floor(currentSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Tilt
      options={{
        max: 10,
        scale: 1.05,
        speed: 1000,
        perspective: 1000
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="relative mt-10 max-w-4xl mx-auto z-10"
      >
        <div className="relative rounded-xl overflow-hidden border-4 border-white/10 shadow-2xl">
          {/* Video thumbnail with play button overlay */}
          <div className="aspect-video bg-gray-900 relative">
            <img
              src="https://images.unsplash.com/photo-1556155092-490a1ba16284?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
              alt="Personalized Marketing Video Demo"
              className="w-full h-full object-cover opacity-60"
            />

            {/* Animated overlay effects */}
            {isPlaying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full bg-white/30 w-20 h-20 blur-2xl"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      opacity: [0, 0.3, 0],
                      scale: [0, 1, 0],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 3,
                      repeat: Infinity,
                      delay: Math.random() * 5,
                    }}
                  />
                ))}
              </motion.div>
            )}

            {/* Personalization Elements Overlay */}
            <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm flex items-center">
              <Sparkles className="h-4 w-4 mr-1 text-primary-400" />
              <span>Personalized Marketing</span>
            </div>

            {/* Play button */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
            >
              <motion.button
                className="relative group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause video preview' : 'Play video preview'}
                aria-pressed={isPlaying}
              >
                {/* Pulsing animation */}
                <motion.div
                  className="absolute -inset-4 rounded-full bg-primary-500/20 blur-md"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "loop"
                  }}
                />

                <div className="bg-primary-600 hover:bg-primary-500 rounded-full p-5 relative">
                  <Play className={`h-8 w-8 text-white ${isPlaying ? 'opacity-0' : 'ml-1'}`} />

                  {isPlaying && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-4 w-4 bg-white rounded relative"
                    ></motion.div>
                  )}
                </div>
              </motion.button>
            </motion.div>

            {/* Video control bar mockup */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-3 flex items-center">
              <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary-500"
                  style={{ width: `${progressWidth}%` }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${isPlaying ? progressWidth : 0}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <div className="text-white text-xs ml-3 whitespace-nowrap">
                {progressToTime(progressWidth)} / 02:30
              </div>
            </div>
          </div>

          {/* Video reflection effect */}
          <div className="h-8 bg-gradient-to-b from-gray-900 to-transparent opacity-50 transform scale-y-[-1] relative">
            <div className="absolute inset-0 bg-gray-900/80"></div>
            <img
              src="https://images.unsplash.com/photo-1556155092-490a1ba16284?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
              alt=""
              className="w-full h-16 object-cover opacity-20 transform scale-y-[-1]"
            />
          </div>
        </div>

        {/* Video caption */}
        <motion.div
          className="absolute -bottom-4 -right-4 bg-primary-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium"
          animate={isPlaying ? {
            x: [0, -5, 0],
            boxShadow: ["0 10px 25px rgba(79, 70, 229, 0.2)", "0 10px 25px rgba(79, 70, 229, 0.4)", "0 10px 25px rgba(79, 70, 229, 0.2)"]
          } : {
            x: 0,
            boxShadow: "0 10px 25px rgba(79, 70, 229, 0.2)"
          }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          See personalized marketing content in action
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute -top-4 -left-4 w-8 h-8 bg-secondary-500 rounded-full blur-md opacity-70"></div>
        <div className="absolute -bottom-4 -right-20 w-16 h-16 bg-primary-500 rounded-full blur-xl opacity-40"></div>

        {/* Additional floating elements */}
        <motion.div
          className="absolute -top-8 right-1/4 bg-secondary-300/30 w-8 h-8 rounded-full blur-lg"
          animate={{
            y: [-10, 10, -10],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            repeat: Infinity,
            duration: 4,
            ease: "easeInOut"
          }}
        />

        <motion.div
          className="absolute -left-10 top-1/3 bg-primary-300/30 w-12 h-12 rounded-full blur-lg"
          animate={{
            y: [-15, 5, -15],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            repeat: Infinity,
            duration: 5,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </motion.div>
    </Tilt>
  );
};

export default VideoPreview;