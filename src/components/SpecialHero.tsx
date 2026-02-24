import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Shield,
  Star,
  ArrowRight,
  Sparkles,
  Award,
  CheckCircle,
  Clock,
} from "lucide-react";
import { TypeAnimation } from "react-type-animation";
import CountUp from "react-countup";
import { Link } from "react-router-dom";
import MagicSparkles from "./MagicSparkles";
import { useLandingPageContent } from "../context/LandingPageContext";
import CountdownTimer from "./SpecialHero/CountdownTimer";
import VideoPreview from "./SpecialHero/VideoPreview";
import KeyBenefits from "./SpecialHero/KeyBenefits";
import ActiveUsers from "./SpecialHero/ActiveUsers";
import CreateFirstVideoCTA from "./SpecialHero/CreateFirstVideoCTA";

const SpecialHero: React.FC = () => {
  const { hero } = useLandingPageContent();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [showCreateFirstVideo, setShowCreateFirstVideo] = useState(true);

  const testimonials = [
    {
      name: "David Chen",
      role: "Marketing Director",
      quote:
        "The personalization tools helped us achieve a 215% increase in marketing engagement and 3X more campaign leads.",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150",
    },
    {
      name: "Sarah Wilson",
      role: "Digital Marketing Lead",
      quote:
        "I create custom marketing content for different audience segments in minutes. My conversion rates have doubled since using VideoRemix.",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  // Check if user has seen the Create First Video CTA before
  useEffect(() => {
    const hasSeenCTA = localStorage.getItem("hasSeenFirstVideoCTA");
    if (hasSeenCTA) {
      setShowCreateFirstVideo(false);
    } else {
      // After 1 minute, save that user has seen the CTA
      const timeout = setTimeout(() => {
        localStorage.setItem("hasSeenFirstVideoCTA", "true");
      }, 60000);

      return () => clearTimeout(timeout);
    }
  }, []);

  return (
    <section className="relative pt-32 pb-16 overflow-hidden bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-left mb-6"
            >
              <div className="mb-4 inline-flex items-center rounded-full bg-primary-600 px-3 py-1">
                <Award className="h-4 w-4 text-white mr-2" />
                <span className="text-sm font-medium text-white">
                  THE NEW VIDEOREMIX PLATFORM
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-none md:leading-tight relative">
                Welcome to <span className="text-primary-400">VideoRemix</span>{" "}
                - Your Complete Personalized Marketing Platform
              </h1>

              <p className="text-xl md:text-2xl text-gray-300 mb-8">
                The professional platform for creating personalized marketing at
                scale. 50+ AI-powered tools help you deliver the right message
                to the right audience segment.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  "AI-powered personalization for marketing content and campaigns",
                  "50+ marketing personalization tools for marketers and businesses",
                  "Create personalized campaigns in minutes, not hours",
                  "Increase marketing ROI with audience-specific content",
                ].map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                    className="flex items-center"
                  >
                    <div className="mr-3 text-primary-400">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <p className="text-white text-lg">{benefit}</p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="mb-6"
              >
                <MagicSparkles
                  minSparkles={2}
                  maxSparkles={5}
                  minSize={5}
                  maxSize={10}
                >
                  <a
                    href="/signup"
                    className="block w-full md:w-auto md:inline-block text-center bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold text-xl px-8 py-5 rounded-lg shadow-lg"
                  >
                    <span className="flex items-center justify-center">
                      GET STARTED WITH VIDEOREMIX
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </span>
                  </a>
                </MagicSparkles>
              </motion.div>

              <p className="text-gray-400 text-sm">
                <span className="text-yellow-400">⚡</span> Start free. No
                credit card required.
              </p>
            </motion.div>

            {/* Create First Personalized Video banner */}
            {showCreateFirstVideo && <CreateFirstVideoCTA />}
          </div>

          {/* Video Content - Right Side */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 p-1.5 rounded-xl overflow-hidden shadow-2xl"
            >
              <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                <img
                  src={
                    hero?.background_image_url ||
                    "https://images.unsplash.com/photo-1556155092-490a1ba16284?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
                  }
                  alt="Personalized Marketing Demo"
                  className="w-full h-full object-cover"
                />

                <Link
                  to="/signup"
                  className="absolute inset-0 bg-black/50 flex items-center justify-center group"
                >
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {/* Pulsing animation */}
                    <motion.div
                      className="absolute -inset-4 rounded-full bg-primary-500/20 blur-md"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "loop",
                      }}
                    />

                    <MagicSparkles minSparkles={3} maxSparkles={6} speed="fast">
                      <div className="bg-primary-600 group-hover:bg-primary-500 transition-colors rounded-full p-5 relative flex items-center justify-center">
                        <Sparkles className="h-8 w-8 text-white" />
                      </div>
                    </MagicSparkles>
                  </motion.div>
                </Link>

                <div className="absolute top-3 left-3 bg-primary-600/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm text-white font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>AI-Powered Personalization</span>
                </div>
              </div>
            </motion.div>

            {/* Testimonial mini slider */}
            <div className="mt-6 relative">
              <AnimatePresence mode="wait">
                {testimonials.map(
                  (testimonial, index) =>
                    activeTestimonial === index && (
                      <motion.div
                        key={testimonial.name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10"
                      >
                        <div className="flex items-center">
                          <img
                            src={testimonial.image}
                            alt={testimonial.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-primary-500"
                          />
                          <div className="ml-4">
                            <div className="text-white font-medium">
                              {testimonial.name}
                            </div>
                            <div className="text-gray-400 text-sm">
                              {testimonial.role}
                            </div>
                            <div className="flex mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className="w-4 h-4 text-yellow-500 fill-yellow-500"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="mt-3 text-gray-300 italic text-sm">
                          "{testimonial.quote}"
                        </p>
                      </motion.div>
                    ),
                )}
              </AnimatePresence>

              {/* Dots indicator */}
              <div
                className="flex justify-center mt-4 space-x-2"
                role="tablist"
                aria-label="Testimonials"
              >
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx === activeTestimonial
                        ? "bg-primary-500 w-6"
                        : "bg-gray-500"
                    }`}
                    onClick={() => setActiveTestimonial(idx)}
                    role="tab"
                    aria-selected={idx === activeTestimonial}
                    aria-controls={`testimonial-panel-${idx}`}
                    aria-label={`View testimonial ${idx + 1} of ${testimonials.length}: ${testimonials[idx].name}`}
                  />
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 text-center">
                <div className="text-2xl font-bold text-white">
                  <CountUp end={12467} separator="," duration={2.5} />+
                </div>
                <div className="text-xs text-gray-400">
                  Marketing Professionals
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 text-center">
                <div className="flex justify-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-yellow-500 fill-yellow-500"
                    />
                  ))}
                </div>
                <div className="text-xl font-bold text-white mt-1">4.9/5</div>
                <div className="text-xs text-gray-400">
                  Marketing ROI Rating
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 pt-6 border-t border-white/10"
        >
          <p className="text-center text-gray-400 text-sm mb-4">
            TRUSTED BY MARKETING TEAMS WORLDWIDE
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {["Microsoft", "Google", "YouTube", "Instagram", "Twitter"].map(
              (brand, i) => (
                <motion.img
                  key={i}
                  whileHover={{ scale: 1.05, filter: "brightness(1.2)" }}
                  src={
                    [
                      "https://cdn.pixabay.com/photo/2013/02/12/09/07/microsoft-80658_960_720.png",
                      "https://cdn.pixabay.com/photo/2015/12/11/11/43/google-1088003_960_720.png",
                      "https://cdn.pixabay.com/photo/2017/03/30/17/42/youtube-2189041_960_720.png",
                      "https://cdn.pixabay.com/photo/2018/06/05/13/24/instagram-3456027_960_720.png",
                      "https://cdn.pixabay.com/photo/2017/06/22/14/23/twitter-2430933_960_720.png",
                    ][i]
                  }
                  alt={brand}
                  className="h-8 sm:h-10 brightness-[2]"
                />
              ),
            )}
          </div>
        </motion.div>

        {/* Key benefits icons */}
        <KeyBenefits />

        {/* Active users counter */}
        <ActiveUsers />

        {/* Video preview section */}
        <VideoPreview />

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{
            opacity: 1,
            y: [0, 10, 0],
          }}
          transition={{
            y: {
              duration: 1.5,
              repeat: Infinity,
              repeatType: "mirror",
            },
          }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
        >
          <button
            onClick={() => {
              const problemSection = document.getElementById("problem");
              if (problemSection) {
                problemSection.scrollIntoView({ behavior: "smooth" });
                problemSection.focus(); // Focus for screen readers
              }
            }}
            className="flex flex-col items-center text-white/70 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded-md p-2"
            aria-label="Scroll to problem section and discover more about marketing personalization"
          >
            <span className="text-sm mb-2" aria-hidden="true">
              Discover more
            </span>
            <ChevronDown className="h-6 w-6" aria-hidden="true" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default SpecialHero;
