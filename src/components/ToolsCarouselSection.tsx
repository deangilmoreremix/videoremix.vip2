import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Palette,
  FileImage,
  Video as VideoIcon,
  MessageSquare,
  ShoppingCart,
  Users,
  Globe,
  Bot,
  Wand2,
} from "lucide-react";

import MagicSparkles from "./MagicSparkles";

// Tool categories
const toolCategories = [
  {
    id: "content-video",
    name: "Content & Video",
     description: "Create personalized videos, images, and audio",
    color: "from-purple-500 to-indigo-600",
    icon: <VideoIcon className="h-5 w-5" />,
  },
  {
    id: "sales-funnels",
    name: "Sales & Funnels",
     description: "Close more deals with AI-powered sales tools",
    color: "from-green-500 to-emerald-600",
    icon: <ShoppingCart className="h-5 w-5" />,
  },
  {
    id: "hiring-profiles",
    name: "Hiring & Profiles",
     description: "Screen resumes, enrich profiles, and automate hiring",
    color: "from-blue-500 to-cyan-600",
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: "productivity",
    name: "Productivity",
     description: "Signatures, templates, and workflow automation",
    color: "from-pink-500 to-rose-600",
    icon: <Palette className="h-5 w-5" />,
  },
  {
    id: "voice-agents",
    name: "Voice & Agents",
     description: "Voice agents, automation, and agent routing",
    color: "from-yellow-500 to-amber-600",
    icon: <Bot className="h-5 w-5" />,
  },
];

// Tools data for carousel
const personalizationTools = [
  // Content & Video tools
  {
    id: "ai-personalized-content",
    name: "AI Personalized Content Hub",
    description:
      "Generate on-brand personalized content at scale across email, ads, and landing pages",
    category: "content-video",
    icon: <Sparkles className="h-6 w-6" />,
    url: "https://ai-personalized-content.videoremix.vip",
    popular: true,
    new: false,
  },
  {
     id: "ai-video-editor",
     name: "AI Video Editor",
     description: "Edit and enhance videos with AI-powered tools",
    category: "content-video",
    icon: <VideoIcon className="h-6 w-6" />,
    url: "https://ai-videoeditor.videoremix.vip",
    popular: true,
    new: false,
  },
  {
    id: "ai-screen-recorder",
    name: "AI Screen Recorder",
    description: "Record and personalize screen captures automatically",
    category: "content-video",
    icon: <FileImage className="h-6 w-6" />,
    url: "https://ai-screenrecorder.videoremix.vip",
    popular: false,
    new: true,
  },
  {
    id: "ai-personalization-studio",
    name: "AI Personalization Studio",
    description: "Design and generate personalized images and visuals",
    category: "content-video",
    icon: <Palette className="h-6 w-6" />,
    url: "https://ai-personalizationstudio.videoremix.vip",
    popular: true,
    new: false,
  },

  // Sales & Funnels
  {
    id: "funnelcraft-ai",
    name: "FunnelCraft AI",
    description: "Build high-converting sales funnels with AI-generated copy and layouts",
    category: "sales-funnels",
    icon: <ShoppingCart className="h-6 w-6" />,
    url: "https://ai-funnelcraft.videoremix.vip",
    popular: true,
    new: false,
  },
  {
     id: "sales-assistant-pro",
     name: "Sales Assistant Pro",
     description: "AI-powered sales intelligence and outreach automation",
    category: "sales-funnels",
    icon: <Users className="h-6 w-6" />,
    url: "https://ai-salesassistant.videoremix.vip",
    popular: true,
    new: false,
  },
  {
    id: "smart-crm-closer",
    name: "Smart CRM Closer Pro",
    description: "Automate CRM follow-ups and closing sequences",
    category: "sales-funnels",
    icon: <ShoppingCart className="h-6 w-6" />,
    url: "https://smartcrmcloser.netlify.app",
    popular: false,
    new: false,
  },
  {
    id: "sales-page-builder",
    name: "Sales Page Builder",
    description: "Build high-converting sales pages in minutes",
    category: "sales-funnels",
    icon: <MessageSquare className="h-6 w-6" />,
    url: "https://ai-salespage.videoremix.vip",
    popular: false,
    new: true,
  },

  // Hiring & Profiles
  {
    id: "ai-skills-resume",
    name: "AI Skills & Resume",
    description: "Generate tailored resumes and cover letters",
    category: "hiring-profiles",
    icon: <Users className="h-6 w-6" />,
    url: "https://ai-skills.videoremix.vip",
    popular: true,
    new: false,
  },
  {
    id: "profile-gen",
    name: "Profile Gen",
    description: "Create optimized LinkedIn and social profiles",
    category: "hiring-profiles",
    icon: <Users className="h-6 w-6" />,
    url: "https://ai-profilegen.videoremix.vip",
    popular: false,
    new: false,
  },
  {
    id: "ai-recruitment-agent-team",
    name: "AI Recruitment Agent Team",
    description: "Automate candidate screening and interview scheduling",
    category: "hiring-profiles",
    icon: <Bot className="h-6 w-6" />,
    url: "https://ai-runner/ai-recruitment-agent-team",
    popular: false,
    new: true,
  },
  {
    id: "ai-skills-monetizer",
    name: "AI Skills Monetizer",
    description: "Turn skills into profitable income streams",
    category: "hiring-profiles",
    icon: <Wand2 className="h-6 w-6" />,
    url: "https://ai-skills.videoremix.vip",
    popular: false,
    new: false,
  },

  // Productivity
  {
    id: "ai-signature",
    name: "AI Signature",
    description: "Generate professional email signatures with AI design",
    category: "productivity",
    icon: <Palette className="h-6 w-6" />,
    url: "https://ai-signature.videoremix.vip",
    popular: true,
    new: false,
  },
  {
    id: "ai-referral-maximizer",
    name: "AI Referral Maximizer Pro",
    description: "Maximize referral conversions with AI automation",
    category: "productivity",
    icon: <MessageSquare className="h-6 w-6" />,
    url: "https://referrals.smartcrm.vip",
    popular: false,
    new: false,
  },
  {
    id: "ai-sales-maximizer",
    name: "AI Sales Maximizer",
    description: "Boost sales with intelligent AI-driven strategies",
    category: "productivity",
    icon: <ShoppingCart className="h-6 w-6" />,
    url: "https://salesmax.smartcrm.vip",
    popular: false,
    new: false,
  },
  {
    id: "ai-documentation-writer",
    name: "AI Documentation Writer",
    description: "Generate comprehensive documentation from notes",
    category: "productivity",
    icon: <FileImage className="h-6 w-6" />,
    url: "https://ai-personalizer.videoremix.vip",
    popular: false,
    new: false,
  },
];

// Example featured collections of tools
const featuredCollections = [
  {
    title: "Content & Video",
    description: "Generate videos, images, audio, and personalized content with AI",
    tools: ["ai-personalized-content", "ai-video-editor", "ai-screen-recorder", "ai-personalization-studio"],
    icon: <Palette className="h-10 w-10 text-purple-400" />,
  },
  {
    title: "Sales & Funnels",
    description: "Build funnels, automate outreach, and close deals faster",
    tools: [
      "funnelcraft-ai",
      "sales-assistant-pro",
      "smart-crm-closer",
      "sales-page-builder",
    ],
    icon: <ShoppingCart className="h-10 w-10 text-green-400" />,
  },
  {
    title: "Hiring & Productivity",
    description: "Automate hiring, resumes, profiles, and daily workflows",
    tools: ["ai-skills-resume", "profile-gen", "ai-recruitment-agent-team", "ai-signature"],
    icon: <Globe className="h-10 w-10 text-blue-400" />,
  },
];

const ToolsCarouselSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState("content-video");
  const [filteredTools, setFilteredTools] = useState(
    personalizationTools.filter((tool) => tool.category === "content-video"),
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Update filtered tools when category changes
  useEffect(() => {
    setFilteredTools(
      personalizationTools.filter((tool) => tool.category === activeCategory),
    );
  }, [activeCategory]);

  // Handle mouse drag for carousel
  const onMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const onMouseLeave = () => {
    setIsDragging(false);
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  // Scroll helpers
  const scrollLeft10Percent = () => {
    if (containerRef.current) {
      const width = containerRef.current.clientWidth;
      containerRef.current.scrollBy({ left: -width * 0.3, behavior: "smooth" });
    }
  };

  const scrollRight10Percent = () => {
    if (containerRef.current) {
      const width = containerRef.current.clientWidth;
      containerRef.current.scrollBy({ left: width * 0.3, behavior: "smooth" });
    }
  };

  // Get a specific tool by ID
  const getToolById = (id: string) => {
    return personalizationTools.find((tool) => tool.id === id);
  };

  return (
    <section id="tools" className="py-20 bg-black relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-grid-pattern"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/10 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-600/10 rounded-full blur-[100px] -z-10"></div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center mb-12"
        >
          <div className="inline-block mb-3">
            <div className="bg-primary-500/20 text-primary-400 px-4 py-1.5 rounded-full text-sm font-semibold">
              PLATFORM TOOLS
            </div>
          </div>

          <MagicSparkles minSparkles={3} maxSparkles={6}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              One Platform.{" "}
              <span className="text-primary-400">
                113 Apps Across Every Business Workflow
              </span>
            </h2>
          </MagicSparkles>

          <p className="text-xl text-gray-300">
            Explore apps for content, video, sales, hiring, productivity, and AI automation — all connected in one ecosystem
          </p>
        </motion.div>

        {/* Categories */}
        <div className="relative mb-10">
          <div className="flex justify-center overflow-x-auto hide-scrollbar">
            <div className="flex space-x-3">
              {toolCategories.map((category) => (
                <motion.button
                  key={category.id}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 min-w-[140px] ${
                    activeCategory === category.id
                      ? `bg-gradient-to-r ${category.color} text-white shadow-md`
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`p-2 rounded-full ${activeCategory === category.id ? "bg-white/20" : "bg-gray-700"} mb-1`}
                    >
                      {category.icon}
                    </div>
                    <span>{category.name}</span>
                    <span className="text-xs opacity-70">
                      {category.description}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Collections */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold text-white mb-8">
            Featured Marketing Collections
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCollections.map((collection, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 group hover:border-primary-500/50 transition-colors"
              >
                <div className="p-6">
                  <div className="bg-gray-700/50 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                    {collection.icon}
                  </div>

                  <h4 className="text-xl font-bold text-white mb-2 group-hover:text-primary-400 transition-colors">
                    {collection.title}
                  </h4>

                  <p className="text-gray-400 mb-4">{collection.description}</p>

                  <div className="space-y-2">
                    {collection.tools.map((toolId, idx) => {
                      const tool = getToolById(toolId);
                      if (!tool) return null;

                      return (
                        <a
                          key={idx}
                          href={tool.url}
                          className="flex items-center bg-black/30 p-2 rounded-lg hover:bg-black/50 transition-colors"
                        >
                          <div className="mr-3 opacity-70">{tool.icon}</div>
                          <div>
                            <div className="text-white text-sm font-medium">
                              {tool.name}
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tools Carousel */}
        <div className="relative mb-8">
          {/* Left/Right controls */}
          <button
            onClick={scrollLeft10Percent}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 z-20 bg-black/80 backdrop-blur-sm p-2 rounded-full text-white shadow-lg hover:bg-black/60"
            aria-label="Scroll left"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <button
            onClick={scrollRight10Percent}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2 z-20 bg-black/80 backdrop-blur-sm p-2 rounded-full text-white shadow-lg hover:bg-black/60"
            aria-label="Scroll right"
          >
            <ArrowRight className="h-5 w-5" />
          </button>

          <h3 className="text-2xl font-bold text-white mb-6">
            {toolCategories.find((cat) => cat.id === activeCategory)?.name}{" "}
            Tools
          </h3>

          {/* Carousel container */}
          <div
            ref={containerRef}
            className="overflow-x-auto py-4 hide-scrollbar"
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
            onMouseDown={onMouseDown}
            onMouseLeave={onMouseLeave}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
          >
            <div
              className="flex space-x-4 px-4"
              style={{ width: "max-content" }}
            >
              {filteredTools.map((tool, index) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 hover:border-primary-500/50 transition-colors group w-[280px] flex-shrink-0"
                >
                  <a href={tool.url} className="block p-6">
                    <div className="flex items-center mb-4">
                      <div className="bg-black/30 p-3 rounded-lg mr-4">
                        {tool.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors">
                            {tool.name}
                          </h3>
                          {tool.new && (
                            <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded">
                              NEW
                            </span>
                          )}
                          {tool.popular && !tool.new && (
                            <span className="bg-green-600/70 text-white text-xs px-2 py-0.5 rounded">
                              POPULAR
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">
                          {
                            toolCategories.find((c) => c.id === tool.category)
                              ?.name
                          }
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-4">{tool.description}</p>
                    <div className="flex justify-end">
                      <div className="text-primary-400 text-sm flex items-center font-medium group-hover:text-primary-300 transition-colors">
                        Try Marketing Tool
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </div>
                    </div>
                  </a>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-primary-900/40 to-primary-700/40 p-8 rounded-xl border border-primary-500/30 relative z-10 text-center"
        >
          <div className="max-w-3xl mx-auto">
            <MagicSparkles minSparkles={3} maxSparkles={6}>
              <h2 className="text-2xl font-bold text-white mb-4">
                Unlock the Full Ecosystem
              </h2>
            </MagicSparkles>

            <p className="text-xl text-gray-300 mb-8">
              Access all 113 apps across marketing, sales, video, hiring, and productivity with a premium subscription
            </p>

            <motion.a
              href="/pricing"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Get Premium Access
              <ArrowRight className="ml-2 h-5 w-5" />
            </motion.a>
          </div>
        </motion.div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
};

export default ToolsCarouselSection;
