import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  ChevronLeft,
  ChevronRight,
  Quote,
  Users,
  ArrowRight,
  Award,
  BadgeCheck,
  Globe,
  TrendingUp,
  Video,
} from "lucide-react";
import { useLandingPageContent } from "../context/LandingPageContext";
import { testimonialsData as staticTestimonials } from "../data/testimonialsData";
import MagicSparkles from "./MagicSparkles";

const TestimonialsSection: React.FC = () => {
  const { testimonials: dbTestimonials, isLoading } = useLandingPageContent();
  const [activeIndex, setActiveIndex] = useState(0);
  const [videoModal, setVideoModal] = useState<{ open: boolean; url: string }>({
    open: false,
    url: "",
  });
  const [activeFilter, setActiveFilter] = useState("all");

  // Use DB testimonials if available, otherwise fallback to static data
  const allTestimonials =
    !isLoading && dbTestimonials && dbTestimonials.length > 0
      ? dbTestimonials
      : staticTestimonials;

  // Filter testimonials based on active filter
  const testimonials =
    activeFilter === "all"
      ? allTestimonials.filter((t) => t.featured)
      : allTestimonials.filter((t) => t.category === activeFilter);

  useEffect(() => {
    if (!testimonials || testimonials.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [testimonials]);

  // Prevent errors with empty testimonials
  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  const nextTestimonial = () => {
    if (testimonials.length > 1) {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }
  };

  const prevTestimonial = () => {
    if (testimonials.length > 1) {
      setActiveIndex(
        (prev) => (prev - 1 + testimonials.length) % testimonials.length,
      );
    }
  };

  // Company logos for social proof
  const companyLogos = [
    {
      name: "Microsoft",
      url: "https://cdn.worldvectorlogo.com/logos/microsoft-1.svg",
    },
    { name: "Adobe", url: "https://cdn.worldvectorlogo.com/logos/adobe-1.svg" },
    {
      name: "Spotify",
      url: "https://cdn.worldvectorlogo.com/logos/spotify-2.svg",
    },
    {
      name: "Shopify",
      url: "https://cdn.worldvectorlogo.com/logos/shopify.svg",
    },
    { name: "Slack", url: "https://cdn.worldvectorlogo.com/logos/slack-1.svg" },
    { name: "Airbnb", url: "https://cdn.worldvectorlogo.com/logos/airbnb.svg" },
  ];

  // Testimonial categories for filtering
  const categories = [
    { id: "all", name: "All Stories" },
    { id: "content-creation", name: "Content Creators" },
    { id: "marketing", name: "Marketing" },
    { id: "enterprise", name: "Enterprise" },
    { id: "small-business", name: "Small Business" },
    { id: "education", name: "Education" },
  ];

  // Success metrics
  const metrics = [
    {
      value: "5M+",
      label: "Videos Created",
      icon: <Video className="h-5 w-5 text-primary-400" />,
    },
    {
      value: "83%",
      label: "Time Saved",
      icon: <TrendingUp className="h-5 w-5 text-primary-400" />,
    },
    {
      value: "12K+",
      label: "Active Users",
      icon: <Users className="h-5 w-5 text-primary-400" />,
    },
    {
      value: "150+",
      label: "Countries",
      icon: <Globe className="h-5 w-5 text-primary-400" />,
    },
  ];

  // Case studies for more detailed testimonials
  const caseStudies = [
    {
      company: "TechGrowth Marketing",
      logo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&q=80",
      metrics: {
        engagement: "+215%",
        production: "10x",
        conversion: "+157%",
      },
      story:
        "TechGrowth scaled their video marketing from 5 to 50 videos per month without hiring additional team members.",
    },
    {
      company: "Global Learning Academy",
      logo: "https://images.unsplash.com/photo-1577641992252-1e9b3f789732?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&q=80",
      metrics: {
        engagement: "+186%",
        production: "7x",
        conversion: "+92%",
      },
      story:
        "This online learning platform increased student engagement by generating personalized educational videos.",
    },
  ];

  return (
    <section
      id="testimonials"
      className="py-32 bg-gradient-to-b from-[#050505] via-gray-900/40 to-[#050505] relative overflow-hidden"
    >
      {/* Background decorations */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary-600/15 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-accent-500/10 rounded-full blur-[100px] -z-10"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-5xl mx-auto text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mb-6"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary-900/40 to-accent-900/30 border border-primary-500/20 text-primary-300 text-sm font-semibold">
              <Award className="h-4 w-4" />
              SUCCESS STORIES
            </div>
          </motion.div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
            style={{ fontFamily: 'var(--font-display)' }}>
            Don't Take Our Word <span className="text-transparent bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text">For It</span>
          </h2>

          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Hear directly from creators and businesses who've transformed their
            video production with VideoRemix.vip
          </p>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto flex flex-wrap justify-center items-center gap-8 mb-16 opacity-70"
        >
          {companyLogos.map((company, idx) => (
            <motion.img
              key={idx}
              src={company.url}
              alt={company.name}
              className="h-10 md:h-12 object-contain dark:invert grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
              whileHover={{
                scale: 1.15,
                filter: "brightness(1.3) grayscale(0%)",
                transition: { duration: 0.3 },
              }}
            />
          ))}
        </motion.div>

        {/* Filter buttons */}
        <div className="max-w-5xl mx-auto mb-12">
          <div className="flex justify-center flex-wrap gap-3">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                whileHover={{
                  scale: 1.05,
                  y: -2,
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveFilter(category.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeFilter === category.id
                    ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-600/30 border border-primary-400/20"
                    : "bg-gray-800/80 text-gray-300 hover:bg-gray-700 border border-gray-700/50"
                }`}
              >
                {category.name}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Main testimonial carousel */}
        <div className="relative max-w-4xl mx-auto mb-20">
          {testimonials.length > 1 && (
            <>
              <motion.button
                onClick={prevTestimonial}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-20 bg-gray-900/80 hover:bg-gray-800 text-white p-3 rounded-full shadow-lg backdrop-blur-sm border border-gray-700"
                aria-label="Previous testimonial"
                whileHover={{
                  scale: 1.1,
                  x: -5,
                }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronLeft className="h-5 w-5" />
              </motion.button>

              <motion.button
                onClick={nextTestimonial}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-20 bg-gray-900/80 hover:bg-gray-800 text-white p-3 rounded-full shadow-lg backdrop-blur-sm border border-gray-700"
                aria-label="Next testimonial"
                whileHover={{
                  scale: 1.1,
                  x: 5,
                }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronRight className="h-5 w-5" />
              </motion.button>
            </>
          )}

          {/* Carousel */}
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              {testimonials.map(
                (testimonial, index) =>
                  activeIndex === index && (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.95, y: 30 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -30 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="relative bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-xl rounded-2xl overflow-hidden border border-gray-700/50 p-8 md:p-10 group hover:border-primary-500/40 transition-all duration-500"
                      whileHover={{
                        boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.15)",
                      }}
                    >
                      {/* Ambient glow on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-600/5 via-transparent to-accent-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                      <div className="relative z-10 flex flex-col md:flex-row gap-8">
                        {/* Author */}
                        <div className="md:w-1/4 flex flex-col items-center">
                          <motion.div
                            className="relative mb-4"
                            whileHover={{ scale: 1.08 }}
                            transition={{ type: "spring", stiffness: 300, damping: 10 }}
                          >
                            {/* Glowing ring */}
                            <div className="absolute -inset-2 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full opacity-40 blur-md"></div>
                            <motion.img
                              src={testimonial.image_url || testimonial.image}
                              alt={testimonial.name}
                              className="relative w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-3 border-primary-500/50 shadow-xl"
                              whileHover={{
                                rotate: [0, -3, 3, 0],
                                borderWidth: "4px",
                                transition: { duration: 0.5 },
                              }}
                            />
                          </motion.div>

                          <div className="text-center">
                            <h4 className="text-white font-bold text-lg mb-1">
                              {testimonial.name}
                            </h4>
                            <p className="text-gray-400 text-sm">
                              {testimonial.role}
                              {testimonial.company ? `, ${testimonial.company}` : ""}
                            </p>

                            {/* Verified badge */}
                            <motion.div
                              className="flex items-center justify-center mt-3 gap-1.5 text-primary-400"
                              whileHover={{ scale: 1.1, x: 3 }}
                            >
                              <BadgeCheck className="h-4 w-4" />
                              <span className="text-xs font-semibold">Verified Customer</span>
                            </motion.div>
                          </div>
                        </div>

                        {/* Quote */}
                        <div className="md:w-3/4">
                          {/* Quote start */}
                          <div className="relative mb-6">
                            <Quote className="absolute -top-2 -left-2 h-10 w-10 text-primary-600 opacity-20" />
                            <div className="flex mb-4 ml-4">
                              {[...Array(testimonial.rating || 5)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  whileHover={{
                                    scale: 1.3,
                                    rotate: [-5, 5, 0],
                                    y: -3,
                                    transition: { duration: 0.3 },
                                  }}
                                >
                                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 mr-1" />
                                </motion.div>
                              ))}
                            </div>
                          </div>

                          {/* Quote text */}
                          <motion.p
                            className="text-xl md:text-2xl text-gray-100 leading-relaxed italic mb-8"
                            whileHover={{ x: 5 }}
                          >
                            "{testimonial.content || testimonial.quote}"
                          </motion.p>

                          {/* Results box */}
                          <motion.div
                            className="bg-gradient-to-r from-gray-900/50 to-gray-800/30 rounded-xl p-5 border border-gray-700/50 mb-6"
                            whileHover={{
                              y: -5,
                              backgroundColor: "rgba(17, 24, 39, 0.7)",
                              borderColor: "rgba(99, 102, 241, 0.3)",
                            }}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <TrendingUp className="h-4 w-4 text-green-400" />
                              <span className="text-sm font-medium text-gray-300">Results after using VideoRemix.vip:</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              {[
                                { value: "+210%", label: "Video Output" },
                                { value: "-75%", label: "Production Time" },
                                { value: "+186%", label: "Engagement" },
                              ].map((metric, i) => (
                                <motion.div
                                  key={i}
                                  className="text-center"
                                  whileHover={{
                                    scale: 1.1,
                                    y: -3,
                                    transition: { duration: 0.2 },
                                  }}
                                >
                                  <div className="text-xl md:text-2xl font-bold text-green-400">
                                    {metric.value}
                                  </div>
                                  <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">
                                    {metric.label}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>

                          {/* Video testimonial link */}
                          <div className="text-right">
                            <motion.button
                              onClick={() =>
                                setVideoModal({
                                  open: true,
                                  url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                                })
                              }
                              className="inline-flex items-center text-primary-400 hover:text-primary-300 text-sm font-medium"
                              whileHover={{
                                x: 5,
                                scale: 1.05,
                                textShadow: "0 0 8px rgba(99, 102, 241, 0.3)",
                              }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Video className="h-4 w-4 mr-1.5" />
                              Watch video testimonial
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ),
              )}
            </AnimatePresence>

            {/* Dots */}
            {testimonials.length > 1 && (
              <div className="flex justify-center mt-8 space-x-2">
                {testimonials.map((_, idx) => (
                  <motion.button
                    key={idx}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === activeIndex
                        ? "bg-primary-500 w-8"
                        : "bg-gray-700 w-2 hover:bg-gray-600"
                    }`}
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`Go to testimonial ${idx + 1}`}
                    whileHover={{
                      scale: 1.3,
                      backgroundColor:
                        idx === activeIndex
                          ? "rgb(99, 102, 241)"
                          : "rgb(75, 85, 99)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Metrics cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-5 mb-20"
        >
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.08 }}
              whileHover={{
                y: -12,
                transition: { duration: 0.2 }
              }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-accent-500/5 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50 group-hover:border-primary-500/40 transition-all text-center">
                <div className="bg-gradient-to-br from-primary-900/40 to-primary-800/20 w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3 border border-primary-500/20 group-hover:border-primary-500/40 transition-colors">
                  {metric.icon}
                </div>
                <motion.div
                  className="text-3xl md:text-4xl font-bold text-white mb-2"
                  whileHover={{
                    scale: 1.1,
                    backgroundImage: "linear-gradient(to right, #818cf8, #c084fc)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {metric.value}
                </motion.div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">{metric.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Case studies */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-6xl mx-auto mb-20"
        >
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-2xl md:text-3xl font-bold text-white">Success Stories</h3>
            <motion.a
              href="#case-studies"
              className="text-primary-400 hover:text-primary-300 flex items-center text-sm font-semibold group"
              whileHover={{ x: 5 }}
            >
              View all stories
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </motion.a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {caseStudies.map((study, idx) => (
              <div
                key={idx}
                className="relative group"
              >
                <div className="absolute -inset-1 bg-gradient-to-br from-primary-600/20 to-accent-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-xl rounded-xl overflow-hidden border border-gray-700/50 group-hover:border-primary-500/30 transition-all">
                  <div className="p-6 md:p-8">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-5">
                      <motion.img
                        src={study.logo}
                        alt={study.company}
                        className="w-14 h-14 rounded-xl object-cover border-2 border-gray-700 group-hover:border-primary-500/50 transition-colors"
                        whileHover={{ scale: 1.08, rotate: 2 }}
                      />
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-white mb-1">{study.company}</h4>
                        <div className="inline-flex items-center gap-1.5 text-primary-400 text-xs font-semibold">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Verified Case Study
                        </div>
                      </div>
                    </div>

                    {/* Story */}
                    <p className="text-gray-300 mb-6 leading-relaxed">{study.story}</p>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4">
              { Object.entries(study.metrics).map(([key, value], i) => {
                const labels = {
                  engagement: "Engagement",
                  production: "Production",
                  conversion: "Conversion",
                };
                const colors = {
                  engagement: "text-blue-400",
                  production: "text-green-400",
                  conversion: "text-emerald-400",
                };
                return (
                  <motion.div
                    key={i}
                    className="text-center"
                    whileHover={{
                      y: -5,
                      scale: 1.1,
                    }}
                  >
                    <div className={`text-xl md:text-2xl font-bold ${colors[key as keyof typeof colors]}`}>
                      {value}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">
                      {labels[key as keyof typeof labels]}
                    </div>
                  </motion.div>
                );
              })}
            </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        {/* Awards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-5xl mx-auto text-center mb-16"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-10">
            Award-Winning Platform
          </h3>

          <div className="flex flex-wrap justify-center gap-5">
            {[
              "Video Innovation Award 2024",
              "Best AI-Driven Product",
              "Top Creator Tool",
              "Most User-Friendly",
            ].map((award, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{
                  y: -10,
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
                className="bg-gradient-to-br from-gray-900/90 to-gray-800/70 backdrop-blur-xl rounded-xl p-5 border border-gray-700/50 hover:border-yellow-500/30 transition-all"
              >
                <motion.div
                  whileHover={{
                    rotate: [0, 15, -15, 0],
                    scale: 1.25,
                    transition: { duration: 0.5 },
                  }}
                >
                  <Award className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                </motion.div>
                <div className="text-white font-bold text-sm mb-0.5">{award}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Join Thousands of Happy Customers
          </h3>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Experience the platform that creators and businesses trust for their
            video content
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.a
              href="#get-started"
              whileHover={{
                scale: 1.05,
                boxShadow: "0 20px 25px -5px rgba(99, 102, 241, 0.3)",
              }}
              whileTap={{ scale: 0.97 }}
              className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold px-8 py-4 rounded-xl flex items-center justify-center shadow-lg"
            >
              Get Started Free
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  repeatType: "loop",
                }}
              >
                <ArrowRight className="ml-2 h-5 w-5" />
              </motion.span>
            </motion.a>
            <motion.a
              href="#view-all-testimonials"
              whileHover={{
                scale: 1.05,
                backgroundColor: "rgba(31, 41, 55, 0.8)",
              }}
              whileTap={{ scale: 0.97 }}
              className="bg-gray-800/80 hover:bg-gray-700 text-white px-8 py-4 rounded-xl border border-gray-700 flex items-center justify-center backdrop-blur-sm"
            >
              View All Testimonials
            </motion.a>
          </div>
        </motion.div>
      </div>

      {/* Video Testimonial Modal */}
      {videoModal.open && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setVideoModal({ open: false, url: "" })}
        >
          <motion.div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <motion.button
              onClick={() => setVideoModal({ open: false, url: "" })}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 flex items-center gap-2 font-medium"
              whileHover={{ scale: 1.1, x: 3 }}
              whileTap={{ scale: 0.9 }}
            >
              <span>Close</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </motion.button>
            <div
              className="bg-black rounded-2xl overflow-hidden relative"
              style={{ paddingBottom: "56.25%" }}
            >
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={videoModal.url}
                title="Video Testimonial"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
};

export default TestimonialsSection;
