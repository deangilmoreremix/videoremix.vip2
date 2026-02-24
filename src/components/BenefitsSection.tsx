import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Star,
  Clock,
  Zap,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import CountUp from "react-countup";
import { useLandingPageContent } from "../context/LandingPageContext";
import MagicSparkles from "./MagicSparkles";

const BenefitsSection: React.FC = () => {
  // Get benefits data from context
  const { benefitsFeatures, isLoading } = useLandingPageContent();

  // Default benefits in case data isn't loaded yet
  const defaultBenefits = [
    {
      icon: <Clock className="h-10 w-10 text-primary-400" />,
      title: "Create Personalized Marketing in Minutes",
      description:
        "Our AI tools analyze your audience and automatically personalize marketing content that resonates with each segment.",
      stats: [
        {
          label: "Time saved vs manual marketing personalization",
          value: "92%",
        },
        { label: "Average marketing personalization time", value: "5 mins" },
      ],
    },
    {
      icon: <Users className="h-10 w-10 text-primary-400" />,
      title: "Segment Your Audience Automatically",
      description:
        "Let AI identify and group your prospects into segments for highly targeted personalized marketing.",
      stats: [
        { label: "Increase in engagement with segmentation", value: "215%" },
        {
          label: "Higher conversion with personalized marketing",
          value: "183%",
        },
      ],
    },
    {
      icon: <Star className="h-10 w-10 text-primary-400" />,
      title: "Personalized Marketing That Converts",
      description:
        "Customize marketing to each prospect's needs, preferences, and position in the buyer journey.",
      stats: [
        { label: "Personalized marketing conversion rate", value: "48%" },
        { label: "Marketing ROI increase with personalization", value: "267%" },
      ],
    },
    {
      icon: <Zap className="h-10 w-10 text-primary-400" />,
      title: "Scale Your Marketing Personalization",
      description:
        "Create thousands of personalized marketing video variations without additional work using our automation tools.",
      stats: [
        { label: "Marketing variations from one video", value: "100+" },
        { label: "Audience segments supported", value: "Unlimited" },
      ],
    },
  ];

  // Transform the data from Supabase to match the component's expectations
  const benefits =
    isLoading || !benefitsFeatures || benefitsFeatures.length === 0
      ? defaultBenefits
      : benefitsFeatures.map((benefit) => {
          // Convert icon name string to actual component
          let iconComponent;
          switch (benefit.icon_name) {
            case "Clock":
              iconComponent = <Clock className="h-10 w-10 text-primary-400" />;
              break;
            case "Star":
              iconComponent = <Star className="h-10 w-10 text-primary-400" />;
              break;
            case "Users":
              iconComponent = <Users className="h-10 w-10 text-primary-400" />;
              break;
            case "Zap":
              iconComponent = <Zap className="h-10 w-10 text-primary-400" />;
              break;
            default:
              iconComponent = (
                <Sparkles className="h-10 w-10 text-primary-400" />
              );
          }

          return {
            icon: iconComponent,
            title: benefit.title,
            description: benefit.description,
            stats: Array.isArray(benefit.stats) ? benefit.stats : [],
          };
        });

  // State for testimonials carousel
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Testimonial data - VideoRemix platform user experiences
  const marketingTestimonials = [
    {
      quote:
        "VideoRemix makes personalized marketing so easy. The AI tools help us create segment-specific content in minutes. The platform is intuitive and powerful.",
      name: "Alex Rodriguez",
      role: "Marketing Director",
      company: "TechGrowth Solutions",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      metrics: {
        conversion: "Fast Setup",
        engagement: "Easy to Use",
        roi: "Great Support",
      },
    },
    {
      quote:
        "The platform has everything we need for personalized marketing. Templates are professional, the AI features save us hours, and the team collaboration tools work great.",
      name: "Sarah Johnson",
      role: "Email Marketing Lead",
      company: "Retail Innovations Inc.",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
      metrics: {
        conversion: "Time Saver",
        engagement: "50+ Tools",
        roi: "Worth It",
      },
    },
    {
      quote:
        "VideoRemix has become our go-to platform for all personalized marketing content. The ability to create custom content for each segment quickly is game-changing for our team.",
      name: "Michael Chen",
      role: "VP of Sales",
      company: "Enterprise Solutions",
      image: "https://randomuser.me/api/portraits/men/65.jpg",
      metrics: {
        conversion: "Powerful AI",
        engagement: "Reliable",
        roi: "5 Stars",
      },
    },
    {
      quote:
        "The VideoRemix platform streamlines our entire personalized marketing workflow. From creation to delivery, everything is in one place. Highly recommend for any marketing team.",
      name: "Emily Drake",
      role: "Customer Success Director",
      company: "CloudTools Pro",
      image: "https://randomuser.me/api/portraits/women/68.jpg",
      metrics: {
        conversion: "All-in-One",
        engagement: "Efficient",
        roi: "Recommended",
      },
    },
    {
      quote:
        "Our healthcare marketing campaigns now deliver custom content to patients, physicians, and administrators simultaneously. The ROI has been phenomenal with 4.2x better results.",
      name: "Dr. James Wilson",
      role: "Marketing Director",
      company: "MedTech Innovations",
      image: "https://randomuser.me/api/portraits/men/54.jpg",
      metrics: {
        conversion: "+320%",
        engagement: "4.5x",
        roi: "7.1x",
      },
    },
    {
      quote:
        "Real estate marketing needs personalization, and VideoRemix.vip delivers. We create neighborhood-specific videos that increased property inquiries by 214% in the first month.",
      name: "Jessica Martinez",
      role: "Digital Marketing Manager",
      company: "Premier Properties",
      image: "https://randomuser.me/api/portraits/women/45.jpg",
      metrics: {
        conversion: "+214%",
        engagement: "3.2x",
        roi: "5.4x",
      },
    },
    {
      quote:
        "As an e-commerce brand, we struggled with generic marketing. Now we create dynamic product videos customized to each customer segment increasing AOV by 37%.",
      name: "Ryan Thompson",
      role: "E-commerce Director",
      company: "Fashion Forward",
      image: "https://randomuser.me/api/portraits/men/33.jpg",
      metrics: {
        conversion: "+187%",
        engagement: "2.8x",
        roi: "4.5x",
      },
    },
    {
      quote:
        "Higher education marketing is highly competitive. Personalized video content for different prospect segments increased our application submissions by 176% year-over-year.",
      name: "Olivia Parker",
      role: "University Marketing Lead",
      company: "Global Education Institute",
      image: "https://randomuser.me/api/portraits/women/52.jpg",
      metrics: {
        conversion: "+176%",
        engagement: "3.9x",
        roi: "6.7x",
      },
    },
    {
      quote:
        "Our financial services firm now delivers personalized investment advice videos to different client segments. Client acquisition costs decreased by 58% while conversions surged.",
      name: "Daniel Morgan",
      role: "Client Acquisition Head",
      company: "Precision Financial Group",
      image: "https://randomuser.me/api/portraits/men/75.jpg",
      metrics: {
        conversion: "+249%",
        engagement: "3.7x",
        roi: "5.9x",
      },
    },
    {
      quote:
        "For our nonprofit, personalized donor videos based on previous giving patterns increased recurring donations by 194% and major gifts by over 300%. Game-changing technology.",
      name: "Amelia Washington",
      role: "Donor Relations Director",
      company: "Global Hope Initiative",
      image: "https://randomuser.me/api/portraits/women/33.jpg",
      metrics: {
        conversion: "+194%",
        engagement: "4.1x",
        roi: "8.3x",
      },
    },
  ];

  // Auto-advance testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % marketingTestimonials.length);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="benefits"
      className="py-20 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated particles */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary-500/30"
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.3,
            }}
            animate={{
              y: [0, -Math.random() * 100],
              opacity: [0, Math.random() * 0.5, 0],
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <div className="inline-block mb-4">
            <div className="bg-gradient-to-r from-primary-600 to-primary-400 text-white px-4 py-1.5 rounded-full text-sm font-semibold">
              MARKETING PERSONALIZATION BENEFITS
            </div>
          </div>

          <MagicSparkles minSparkles={3} maxSparkles={6}>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Transform Your Marketing Results With Personalization
            </h2>
          </MagicSparkles>

          <p className="text-xl text-gray-300">
            Personalization isn't just a nice-to-have feature—it's the
            difference between marketing that converts and marketing that gets
            ignored.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden hover:border-primary-500/50 border border-gray-700 transition-colors"
              whileHover={{
                y: -10,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
                borderColor: "rgba(99, 102, 241, 0.5)",
              }}
            >
              <div className="p-6">
                <motion.div
                  className="flex items-start mb-4"
                  whileHover={{ x: 5, transition: { duration: 0.2 } }}
                >
                  <motion.div
                    className="bg-primary-900/50 p-3 rounded-lg mr-4 flex-shrink-0"
                    whileHover={{
                      rotate: [0, 5, -5, 0],
                      transition: { duration: 0.5 },
                    }}
                  >
                    {benefit.icon}
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 break-words">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-400 break-words">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  {benefit.stats &&
                    benefit.stats.map((stat, i) => (
                      <motion.div
                        key={i}
                        className="bg-black/30 p-3 rounded-lg"
                        whileHover={{
                          y: -5,
                          backgroundColor: "rgba(0, 0, 0, 0.4)",
                          transition: { duration: 0.2 },
                        }}
                      >
                        <motion.div
                          className="text-xl font-bold text-primary-400 break-words"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          <CountUp
                            end={parseInt(stat.value) || 0}
                            suffix={
                              isNaN(parseInt(stat.value)) ? stat.value : ""
                            }
                            duration={2}
                          />
                        </motion.div>
                        <div className="text-sm text-gray-500 break-words">
                          {stat.label}
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Testimonial Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-4xl mx-auto mt-16 overflow-hidden relative"
        >
          <h3 className="text-2xl font-bold text-white text-center mb-10">
            Success Stories
          </h3>

          {/* Navigation Arrows */}
          {marketingTestimonials.length > 1 && (
            <>
              <motion.button
                onClick={() =>
                  setActiveTestimonial((prev) =>
                    prev === 0 ? marketingTestimonials.length - 1 : prev - 1,
                  )
                }
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white p-2 rounded-full"
                whileHover={{ scale: 1.1, x: -5 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-6 w-6" />
              </motion.button>

              <motion.button
                onClick={() =>
                  setActiveTestimonial(
                    (prev) => (prev + 1) % marketingTestimonials.length,
                  )
                }
                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white p-2 rounded-full"
                whileHover={{ scale: 1.1, x: 5 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-6 w-6" />
              </motion.button>
            </>
          )}

          {/* Carousel Content */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {marketingTestimonials.map(
                (testimonial, index) =>
                  activeTestimonial === index && (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.5 }}
                      className="bg-gradient-to-br from-primary-900/40 to-primary-700/40 p-8 rounded-xl border border-primary-500/30"
                      whileHover={{
                        y: -10,
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        borderColor: "rgba(99, 102, 241, 0.5)",
                      }}
                    >
                      <div className="flex flex-col md:flex-row items-center">
                        <motion.div
                          className="md:w-1/3 mb-6 md:mb-0 md:pr-8"
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-primary-400 rounded-full opacity-75 blur-md group-hover:opacity-100 transition duration-200"></div>
                            <img
                              src={testimonial.image}
                              alt={testimonial.name}
                              className="relative w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-2 border-white/20"
                            />
                          </div>
                          <div className="mt-4 text-center">
                            <div className="flex items-center justify-center">
                              {[...Array(5)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  whileHover={{
                                    scale: 1.2,
                                    y: -2,
                                    rotate: [-5, 5, 0],
                                    transition: { duration: 0.3 },
                                  }}
                                >
                                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                        <div className="md:w-2/3">
                          <motion.p
                            className="text-xl text-white mb-4 italic"
                            whileHover={{ x: 5 }}
                          >
                            "{testimonial.quote}"
                          </motion.p>

                          <motion.div className="mb-6" whileHover={{ x: 5 }}>
                            <div className="text-white font-bold text-lg">
                              {testimonial.name}
                            </div>
                            <div className="text-gray-400">
                              {testimonial.role}, {testimonial.company}
                            </div>
                          </motion.div>

                          <div className="grid grid-cols-3 gap-4">
                            <motion.div
                              className="bg-primary-900/30 p-3 rounded-lg text-center border border-primary-800/30"
                              whileHover={{
                                y: -5,
                                borderColor: "rgba(99, 102, 241, 0.4)",
                              }}
                            >
                              <div className="text-primary-400 font-bold text-xl">
                                {testimonial.metrics.conversion}
                              </div>
                              <div className="text-gray-400 text-sm">
                                Conversion
                              </div>
                            </motion.div>
                            <motion.div
                              className="bg-primary-900/30 p-3 rounded-lg text-center border border-primary-800/30"
                              whileHover={{
                                y: -5,
                                borderColor: "rgba(99, 102, 241, 0.4)",
                              }}
                            >
                              <div className="text-primary-400 font-bold text-xl">
                                {testimonial.metrics.engagement}
                              </div>
                              <div className="text-gray-400 text-sm">
                                Engagement
                              </div>
                            </motion.div>
                            <motion.div
                              className="bg-primary-900/30 p-3 rounded-lg text-center border border-primary-800/30"
                              whileHover={{
                                y: -5,
                                borderColor: "rgba(99, 102, 241, 0.4)",
                              }}
                            >
                              <div className="text-primary-400 font-bold text-xl">
                                {testimonial.metrics.roi}
                              </div>
                              <div className="text-gray-400 text-sm">
                                Marketing ROI
                              </div>
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ),
              )}
            </AnimatePresence>

            {/* Pagination Dots */}
            <div className="flex justify-center mt-6 space-x-2">
              {marketingTestimonials.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  whileHover={{ scale: 1.5 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    activeTestimonial === i
                      ? "w-6 bg-primary-500"
                      : "bg-gray-600"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <motion.a
            whileHover={{
              scale: 1.05,
              boxShadow: "0 20px 25px -5px rgba(79, 70, 229, 0.4)",
            }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold px-8 py-4 rounded-lg shadow-lg shadow-primary-600/20"
            href="#tools"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            <span>Explore Marketing Personalization Tools</span>
            <motion.div
              animate={{
                x: [0, 5, 0],
                transition: {
                  repeat: Infinity,
                  duration: 1.5,
                  repeatType: "loop",
                },
              }}
            >
              <ArrowRight className="ml-2 h-5 w-5" />
            </motion.div>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default BenefitsSection;
