import React, { useState, useEffect, useRef } from "react";
import {
  Check,
  ArrowRight,
  Clock,
  Gift,
  ChevronDown,
  Sparkles,
  Shield,
  Play,
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

// Additional components for this file
const Star: React.FC<{ className?: string }> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

const Users: React.FC<{ className?: string }> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const Download: React.FC<{ className?: string }> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

interface CountdownTimerProps {
  hours: number;
  minutes: number;
  seconds: number;
  onComplete?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  hours,
  minutes,
  seconds,
  onComplete,
}) => {
  const [timeLeft, setTimeLeft] = useState({
    hours,
    minutes,
    seconds,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newSeconds = prev.seconds - 1;

        if (newSeconds >= 0) {
          return { ...prev, seconds: newSeconds };
        }

        const newMinutes = prev.minutes - 1;

        if (newMinutes >= 0) {
          return { ...prev, minutes: newMinutes, seconds: 59 };
        }

        const newHours = prev.hours - 1;

        if (newHours >= 0) {
          return { hours: newHours, minutes: 59, seconds: 59 };
        }

        clearInterval(interval);
        if (onComplete) onComplete();
        return { hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onComplete]);

  // Derive time percentage for circular progress
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const currentSeconds =
    timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds;
  const percentage = (currentSeconds / totalSeconds) * 100;

  return (
    <div className="flex flex-col items-center mb-6">
      <div className="relative w-32 h-32 mb-4">
        {/* Background circle */}
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="8"
          />
          {/* Progress circle with stroke-dasharray animation */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 2.83}, 283`} // 283 is approximately 2πr where r=45
            style={{ transformOrigin: "center", transform: "rotate(-90deg)" }}
            animate={{
              strokeDasharray: [`${percentage * 2.83}, 283`],
            }}
            transition={{ duration: 0.5 }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>
        </svg>

        {/* Time display in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <motion.div
            className="text-3xl font-mono font-bold flex"
            whileHover={{
              scale: 1.1,
              textShadow: "0 0 8px rgba(255, 255, 255, 0.5)",
            }}
          >
            <span>{String(timeLeft.hours).padStart(2, "0")}</span>
            <span className="mx-1">:</span>
            <span>{String(timeLeft.minutes).padStart(2, "0")}</span>
            <span className="mx-1">:</span>
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              {String(timeLeft.seconds).padStart(2, "0")}
            </motion.span>
          </motion.div>
          <div className="text-xs opacity-70 mt-1">REMAINING</div>
        </div>
      </div>
    </div>
  );
};

const reasons = [
  "Unlimited AI-powered video creation",
  "Professional templates and effects",
  "Time-saving automation features",
  "Cloud storage and collaboration tools",
  "Regular feature updates and enhancements",
  "24/7 customer support",
  "14-day money-back guarantee",
];

const benefits = [
  {
    icon: <Clock />,
    title: "Save 15+ Hours Weekly",
    description: "Reduce video editing time by 90% with our AI-powered tools",
  },
  {
    icon: <Star />,
    title: "Professional Results",
    description:
      "Create studio-quality videos regardless of your experience level",
  },
  {
    icon: <Users />,
    title: "Grow Your Audience",
    description:
      "Consistently publish engaging content that attracts followers",
  },
  {
    icon: <Download />,
    title: "Export Anywhere",
    description:
      "Share directly to all major platforms or download in any format",
  },
  {
    icon: <Shield />,
    title: "Secure & Private",
    description:
      "Enterprise-grade security keeps your content safe and private",
  },
];

const FinalCTA: React.FC = () => {
  const [urgency, setUrgency] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    [0.5, 1, 1, 0.5],
  );
  const scale = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    [0.95, 1, 1, 0.95],
  );
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [50, 0, 0, 50]);

  useEffect(() => {
    // Generate random urgency message
    const urgencyMessages = [
      "Only 7 discount codes remaining!",
      "53 people viewing this offer now",
      "15 people signed up in the last hour",
    ];
    setUrgency(
      urgencyMessages[Math.floor(Math.random() * urgencyMessages.length)],
    );
  }, []);

  return (
    <section
      className="py-20 bg-gradient-to-b from-primary-600 to-primary-800 text-white overflow-hidden relative z-10"
      ref={containerRef}
    >
      <div style={{ opacity, scale, y }} className="container-custom relative">
        {/* Background elements */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 bg-secondary-500 opacity-10 rounded-full blur-3xl"></div>

        <div className="text-center mb-8 max-w-3xl mx-auto">
          <div className="inline-flex items-center px-4 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-4">
            <motion.div
              animate={{
                rotate: [0, 360],
                transition: { duration: 8, repeat: Infinity, ease: "linear" },
              }}
            >
              <Sparkles className="h-4 w-4 mr-2 text-yellow-300" />
            </motion.div>
            <span>JOIN VIDEOREMIX TODAY</span>
          </div>

          <motion.h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            whileHover={{
              scale: 1.03,
              textShadow: "0 0 8px rgba(255, 255, 255, 0.3)",
            }}
          >
            <motion.span
              className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              Ready to Start Personalizing Your Marketing?
            </motion.span>
          </motion.h2>
          <motion.div
            className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6 border border-white/20"
            whileHover={{
              borderColor: "rgba(255, 255, 255, 0.4)",
              y: -5,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <motion.div
              className="flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                className="mr-2"
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                  transition: {
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 5,
                  },
                }}
              >
                <Sparkles className="h-5 w-5 text-yellow-300" />
              </motion.div>
              <p className="text-xl">
                <span className="font-bold">Get Started:</span> Choose from
                Free, Pro, or Lifetime plans
              </p>
            </motion.div>
          </motion.div>

          <p className="text-xl">
            Join thousands of creators and businesses who are transforming their
            video content and seeing real results.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-16">
          {/* Main offer */}
          <motion.div
            className="lg:col-span-7 bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 relative overflow-hidden"
            whileHover={{
              y: -10,
              borderColor: "rgba(255, 255, 255, 0.3)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            {/* Decorative corner accent */}
            <motion.div
              className="absolute -top-8 -left-8 w-16 h-16 bg-secondary-500 opacity-20 rounded-full blur-xl transform rotate-45"
              animate={{
                rotate: [45, 90, 45],
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.3, 0.2],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            ></motion.div>

            <div className="relative z-10">
              <motion.h3
                className="text-2xl font-bold mb-6 relative z-10"
                whileHover={{ x: 5 }}
              >
                Why Choose VideoRemix for Personalized Marketing
              </motion.h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/10"
                    whileHover={{
                      scale: 1.05,
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      y: -5,
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <motion.div
                      className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg p-2 inline-block mb-3"
                      whileHover={{
                        rotate: [0, 10, -10, 0],
                        scale: 1.1,
                        transition: { duration: 0.5 },
                      }}
                    >
                      {React.cloneElement(benefit.icon, {
                        className: "h-5 w-5",
                      })}
                    </motion.div>
                    <h4 className="font-semibold text-lg mb-1">
                      {benefit.title}
                    </h4>
                    <p className="text-sm text-white/80">
                      {benefit.description}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="space-y-4 mb-8">
                {reasons.map((reason, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start"
                    whileHover={{
                      x: 10,
                      transition: { duration: 0.2 },
                    }}
                  >
                    <motion.div
                      className="bg-secondary-500 rounded-full p-1 mr-3 mt-0.5 flex-shrink-0"
                      whileHover={{
                        rotate: [0, 10, -10, 0],
                        scale: 1.2,
                        transition: { duration: 0.5 },
                      }}
                    >
                      <Check className="h-4 w-4" />
                    </motion.div>
                    <span className="text-lg">{reason}</span>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <motion.a
                  href="#pricing"
                  className="btn bg-white text-primary-600 hover:bg-gray-100 font-semibold text-lg px-8 py-4 rounded-lg flex items-center justify-center"
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 20px 25px -5px rgba(255, 255, 255, 0.2)",
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  Try Free For 14 Days
                  <motion.div
                    animate={{
                      x: [0, 5, 0],
                      transition: { repeat: Infinity, duration: 1.5 },
                    }}
                  >
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </motion.div>
                </motion.a>
                <motion.a
                  href="#watch-demo"
                  className="btn bg-transparent border border-white text-white hover:bg-white/10 text-lg px-8 py-4 rounded-lg flex items-center justify-center group"
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  <motion.div
                    className="mr-2 relative"
                    whileHover={{
                      rotate: [0, 10, -10, 0],
                      transition: { duration: 0.5 },
                    }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-white/30 rounded-full blur-md"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0, 0.3],
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    ></motion.div>
                    <Play className="h-5 w-5 relative z-10" />
                  </motion.div>
                  Watch Demo First
                </motion.a>
              </div>
            </div>
          </motion.div>

          {/* Pricing offer */}
          <motion.div
            className="lg:col-span-5 bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 flex flex-col h-full"
            whileHover={{
              y: -10,
              borderColor: "rgba(255, 255, 255, 0.3)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <motion.div
              className="bg-gradient-to-r from-secondary-500 to-pink-500 p-1 rounded-full inline-flex items-center justify-center mb-4 self-center"
              whileHover={{ scale: 1.1 }}
            >
              <div className="bg-primary-700 px-4 py-1 rounded-full">
                <motion.span
                  className="text-white font-bold text-sm"
                  animate={{
                    scale: [1, 1.1, 1],
                    transition: { repeat: Infinity, duration: 1.5 },
                  }}
                >
                  PRO PLAN
                </motion.span>
              </div>
            </motion.div>

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">VideoRemix Pro Plan</h3>
              <div className="flex items-center justify-center mb-2">
                <motion.span
                  className="text-5xl font-bold"
                  whileHover={{
                    scale: 1.1,
                    textShadow: "0 0 8px rgba(255, 255, 255, 0.5)",
                  }}
                >
                  $29
                </motion.span>
                <span className="ml-1 text-lg">/month</span>
              </div>

              <motion.div
                className="text-white/80 mt-2"
                animate={{
                  opacity: [0.8, 1, 0.8],
                  transition: { duration: 3, repeat: Infinity },
                }}
              >
                Full access to all personalized marketing tools
              </motion.div>
            </div>

            <motion.div
              className="bg-secondary-500/20 rounded-lg p-3 mb-6"
              whileHover={{
                scale: 1.03,
                backgroundColor: "rgba(236, 72, 153, 0.3)",
                boxShadow: "0 10px 15px -3px rgba(236, 72, 153, 0.2)",
              }}
            >
              <motion.div
                className="flex items-center mb-3"
                whileHover={{ x: 5 }}
              >
                <motion.div
                  whileHover={{
                    rotate: [0, 10, -10, 0],
                    scale: 1.2,
                    transition: { duration: 0.5 },
                  }}
                >
                  <Gift className="h-4 w-4 text-secondary-300 mr-2" />
                </motion.div>
                <span className="font-medium">Full Feature Access</span>
              </motion.div>
              <p className="text-white/80 pl-7">
                Get unlimited access to 20+ personalized marketing apps and
                AI-powered features
              </p>
            </motion.div>

            <motion.a
              href="#claim-offer"
              className="block w-full btn bg-white text-primary-600 hover:bg-gray-100 font-semibold text-lg px-8 py-4 rounded-lg text-center"
              whileHover={{
                scale: 1.03,
                boxShadow: "0 20px 25px -5px rgba(255, 255, 255, 0.2)",
              }}
              whileTap={{ scale: 0.97 }}
            >
              <motion.span
                animate={{
                  scale: [1, 1.03, 1],
                  transition: { repeat: Infinity, duration: 2, repeatDelay: 1 },
                }}
              >
                Start with VideoRemix Pro
              </motion.span>
            </motion.a>

            <motion.p
              className="text-center text-white/80 text-sm mt-4"
              whileHover={{
                scale: 1.05,
                textShadow: "0 0 8px rgba(255, 255, 255, 0.5)",
              }}
            >
              Get started today. No credit card required.
            </motion.p>
          </motion.div>
        </div>

        <div className="text-center max-w-3xl mx-auto">
          <motion.h3
            className="text-2xl font-bold mb-4"
            whileHover={{
              scale: 1.05,
              textShadow: "0 0 8px rgba(255, 255, 255, 0.5)",
            }}
          >
            Join Our Community of 10,000+ Video Creators
          </motion.h3>
          <p className="text-lg mb-8">
            Don't miss this opportunity to transform your video creation process
            and start producing professional content that drives real results
            for your business or brand.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <motion.a
              href="#signup"
              className="btn bg-white text-primary-600 hover:bg-gray-100 font-semibold text-lg px-10 py-4 rounded-lg"
              whileHover={{
                scale: 1.05,
                boxShadow: "0 20px 25px -5px rgba(255, 255, 255, 0.2)",
              }}
              whileTap={{ scale: 0.97 }}
            >
              Start Free Trial
            </motion.a>
            <motion.a
              href="#questions"
              className="btn bg-transparent border border-white text-white hover:bg-white/10 text-lg px-10 py-4 rounded-lg"
              whileHover={{
                scale: 1.05,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                borderColor: "rgba(255, 255, 255, 0.5)",
              }}
              whileTap={{ scale: 0.97 }}
            >
              Have Questions?
            </motion.a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;

export { FinalCTA };
