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
    id: "content-creation",
    name: "Marketing Content Creation",
    description: "Create personalized marketing videos and images",
    color: "from-purple-500 to-indigo-600",
    icon: <VideoIcon className="h-5 w-5" />,
  },
  {
    id: "visual-styles",
    name: "Visual Marketing",
    description: "Apply personalized visual treatments to marketing",
    color: "from-pink-500 to-rose-600",
    icon: <Palette className="h-5 w-5" />,
  },
  {
    id: "sales-tools",
    name: "Sales & Marketing Tools",
    description: "Close more deals with personalization",
    color: "from-green-500 to-emerald-600",
    icon: <ShoppingCart className="h-5 w-5" />,
  },
  {
    id: "communication",
    name: "Marketing Communication",
    description: "Personalized marketing outreach tools",
    color: "from-blue-500 to-cyan-600",
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    id: "advanced-ai",
    name: "Advanced AI Marketing",
    description: "Cutting edge AI marketing personalization",
    color: "from-yellow-500 to-amber-600",
    icon: <Bot className="h-5 w-5" />,
  },
];

// Tools data for carousel
const personalizationTools = [
  // Content Creation tools
  {
    id: "ai-creative-studio",
    name: "Marketing AI Creative Studio",
    description:
      "Create AI-generated marketing content tailored to your audience",
    category: "content-creation",
    icon: <Sparkles className="h-6 w-6" />,
    url: "https://ai-personalized-content.videoremix.vip",
    popular: true,
    new: false,
  },
  {
    id: "video-generator",
    name: "Marketing Video Generator",
    description: "Generate marketing videos based on audience data",
    category: "content-creation",
    icon: <VideoIcon className="h-6 w-6" />,
    url: "https://ai-personalized-content.videoremix.vip",
    popular: true,
    new: false,
  },
  {
    id: "gif-editor",
    name: "Marketing GIF Editor",
    description: "Create and customize animated GIFs for marketing campaigns",
    category: "content-creation",
    icon: <FileImage className="h-6 w-6" />,
    url: "https://ai-personalized-content.videoremix.vip",
    popular: false,
    new: true,
  },
  {
    id: "ai-image",
    name: "Marketing AI Image Generation",
    description: "Generate images for targeted marketing campaigns",
    category: "content-creation",
    icon: <Palette className="h-6 w-6" />,
    url: "https://ai-personalized-content.videoremix.vip",
    popular: true,
    new: false,
  },

  // Visual Styles
  {
    id: "action-figures",
    name: "Marketing Action Figures",
    description: "Create custom action figures for marketing campaigns",
    category: "visual-styles",
    icon: <Palette className="h-6 w-6" />,
    url: "https://ai-personalized-content.videoremix.vip",
    popular: true,
    new: false,
  },
  {
    id: "ghibli-style",
    name: "Marketing Studio Ghibli Style",
    description: "Transform marketing images into Ghibli-inspired artwork",
    category: "visual-styles",
    icon: <Palette className="h-6 w-6" />,
    url: "https://ai-personalized-content.videoremix.vip",
    popular: true,
    new: false,
  },
  {
    id: "retro-action-figures",
    name: "Retro Marketing Figures",
    description: "Generate nostalgic figures for marketing campaigns",
    category: "visual-styles",
    icon: <Palette className="h-6 w-6" />,
    url: "https://ai-personalized-content.videoremix.vip",
    popular: false,
    new: false,
  },
  {
    id: "cartoon-style",
    name: "Marketing Cartoon Style",
    description:
      "Convert marketing images into personalized cartoon illustrations",
    category: "visual-styles",
    icon: <Palette className="h-6 w-6" />,
    url: "https://ai-personalized-content.videoremix.vip",
    popular: false,
    new: true,
  },

  // Sales Tools
  {
    id: "proposal-generator",
    name: "Marketing Proposal Generator",
    description: "Create tailored proposals for specific market segments",
    category: "sales-tools",
    icon: <ShoppingCart className="h-6 w-6" />,
    url: "https://proposal-ai.videoremix.vip",
    popular: true,
    new: false,
  },
  {
    id: "client-research",
    name: "Marketing Audience Research",
    description: "Research audience segments to create personalized marketing",
    category: "sales-tools",
    icon: <Users className="h-6 w-6" />,
    url: "https://sales-assistant-ai.videoremix.vip",
    popular: true,
    new: false,
  },
  {
    id: "smart-pricing",
    name: "Marketing Smart Pricing",
    description: "Generate segment-specific pricing recommendations",
    category: "sales-tools",
    icon: <ShoppingCart className="h-6 w-6" />,
    url: "https://proposal-ai.videoremix.vip",
    popular: false,
    new: false,
  },
  {
    id: "objection-handler",
    name: "Marketing Objection Handler",
    description: "Generate tailored responses to potential customer objections",
    category: "sales-tools",
    icon: <MessageSquare className="h-6 w-6" />,
    url: "https://sales-assistant-ai.videoremix.vip",
    popular: false,
    new: false,
  },

  // Communication Tools
  {
    id: "follow-up-emails",
    name: "Marketing Follow-Up Emails",
    description: "Generate segment-specific follow-up communications",
    category: "communication",
    icon: <MessageSquare className="h-6 w-6" />,
    url: "https://sales-assistant-ai.videoremix.vip",
    popular: true,
    new: false,
  },
  {
    id: "multi-language",
    name: "Multi-Language Marketing",
    description: "Translate marketing content while preserving key messaging",
    category: "communication",
    icon: <Globe className="h-6 w-6" />,
    url: "https://ai-personalized-content.videoremix.vip",
    popular: true,
    new: false,
  },
  {
    id: "streaming-translation",
    name: "Real-Time Marketing Translation",
    description:
      "Character-by-character translation preserving marketing terminology",
    category: "communication",
    icon: <Globe className="h-6 w-6" />,
    url: "https://ai-personalized-content.videoremix.vip",
    popular: false,
    new: true,
  },

  // Advanced AI Tools
  {
    id: "multimodal-creator",
    name: "Multimodal Marketing Creator",
    description: "Create marketing with cutting-edge multimodal AI models",
    category: "advanced-ai",
    icon: <Bot className="h-6 w-6" />,
    url: "https://ai-personalized-content.videoremix.vip",
    popular: true,
    new: true,
  },
  {
    id: "hybrid-ai",
    name: "Hybrid Marketing AI Studio",
    description: "Leverage multiple AI models in a single marketing workflow",
    category: "advanced-ai",
    icon: <Wand2 className="h-6 w-6" />,
    url: "https://ai-personalized-content.videoremix.vip",
    popular: false,
    new: true,
  },
  {
    id: "gemini-features",
    name: "Advanced Marketing AI Features",
    description: "Use the latest AI capabilities for marketing personalization",
    category: "advanced-ai",
    icon: <Sparkles className="h-6 w-6" />,
    url: "https://ai-personalized-content.videoremix.vip",
    popular: false,
    new: true,
  },
];

// Example featured collections of tools
const featuredCollections = [
  {
    title: "Visual Marketing",
    description: "Transform ideas into stunning personalized marketing visuals",
    tools: ["ai-creative-studio", "ai-image", "action-figures", "ghibli-style"],
    icon: <Palette className="h-10 w-10 text-purple-400" />,
  },
  {
    title: "Sales Acceleration",
    description: "Close more deals with personalized marketing tools",
    tools: [
      "proposal-generator",
      "client-research",
      "smart-pricing",
      "objection-handler",
    ],
    icon: <ShoppingCart className="h-10 w-10 text-green-400" />,
  },
  {
    title: "Global Marketing",
    description: "Supercharge your international marketing efforts",
    tools: ["multi-language", "streaming-translation", "follow-up-emails"],
    icon: <Globe className="h-10 w-10 text-blue-400" />,
  },
];

const ToolsCarouselSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState("content-creation");
  const [filteredTools, setFilteredTools] = useState(
    personalizationTools.filter((tool) => tool.category === "content-creation"),
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
              MARKETING PERSONALIZATION TOOLS
            </div>
          </div>

          <MagicSparkles minSparkles={3} maxSparkles={6}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              One Platform.{" "}
              <span className="text-primary-400">
                20+ Marketing Personalization Apps
              </span>
            </h2>
          </MagicSparkles>

          <p className="text-xl text-gray-300">
            Explore our comprehensive suite of personalized marketing tools
            designed for every campaign need
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
                Unlock the Full Power of Marketing Personalization
              </h2>
            </MagicSparkles>

            <p className="text-xl text-gray-300 mb-8">
              Access all our professional marketing personalization tools with a
              premium subscription
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
