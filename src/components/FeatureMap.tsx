import React from "react";
import { motion } from "framer-motion";
import MagicSparkles from "./MagicSparkles";

interface FeatureMapProps {
  title?: string;
  subtitle?: string;
}

// This component maps all the functionality areas from the information provided
const FeatureMap: React.FC<FeatureMapProps> = ({
  title = "113 AI Apps Across Every Business Function",
  subtitle = "Explore the full VideoRemix.vip ecosystem — from marketing and sales to hiring, video, and AI workforce",
}) => {
  const featureCategories = [
    {
      title: "Content & Video",
      features: [
        "Personalized content at scale across email, ads, and landing pages",
        "AI video editing, screen recording, and audio tools",
        "Dynamic video personalization for every audience segment",
        "Brand-consistent templates and visual assets",
        "Multi-format content repurposing",
        "AI-powered thumbnails, signatures, and design",
      ],
    },
    {
      title: "Sales & Funnels",
      features: [
        "AI-powered sales intelligence and lead scoring",
        "Automated outreach sequences and follow-ups",
        "High-converting landing pages and funnel builders",
        "CRM integration with SmartCRM and Salesforce",
        "Referral tracking and maximization tools",
        "Proposal generation and sales page optimization",
      ],
    },
    {
      title: "Hiring & Profiles",
      features: [
        "AI resume screening and candidate matching",
        "Profile enrichment and LinkedIn optimization",
        "Interview scheduling and follow-up automation",
        "Job description generation and skill verification",
        "Onboarding content and training material creation",
        "Diversity analytics and hiring analytics",
      ],
    },
    {
      title: "Productivity",
      features: [
        "AI signature generation and email templates",
        "Meeting notes, summaries, and action items",
        "Project planning and task automation",
        "Document creation, editing, and translation",
        "Email drafting and response suggestions",
        "Workflow automation and scheduling",
      ],
    },
    {
      title: "Voice & Agents",
      features: [
        "Customer support voice agents for 24/7 coverage",
        "AI audio tours and guided experiences",
        "Voice-enabled RAG for hands-free knowledge access",
        "Browser automation and task execution",
        "Multi-language voice and transcription",
        "Agent routing and escalation management",
      ],
    },
    {
      title: "Knowledge & RAG",
      features: [
        "Chat with PDFs, GitHub, Gmail, and YouTube",
        "Agentic RAG with reasoning and citations",
        "Local and hybrid search for private documents",
        "Knowledge graphs and multimodal retrieval",
        "Document Q&A and research assistants",
        "RAG diagnostics and failure analysis",
      ],
    },
    {
      title: "AI Workforce",
      features: [
        "Sales intelligence agent teams for outbound",
        "Legal, recruitment, and real estate agent teams",
        "Teaching, coding, and design agent teams",
        "Self-improving agent skills and orchestration",
        "Multi-agent research and due diligence",
        "Finance, health, and productivity agent teams",
      ],
    },
  ];

  return (
    <section className="py-20 bg-black relative overflow-hidden">
      {/* Background elements */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      ></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-block mb-3">
              <div className="bg-primary-500/20 text-primary-400 px-4 py-1.5 rounded-full text-sm font-semibold">
                FULL APP ECOSYSTEM
              </div>
          </div>

          <MagicSparkles minSparkles={3} maxSparkles={6}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 break-words">
              {title}
            </h2>
          </MagicSparkles>

          <p className="text-xl text-gray-300 break-words">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featureCategories.map((category, categoryIndex) => (
            <motion.div
              key={categoryIndex}
              whileHover={{
                y: -8,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
                borderColor: "rgba(99, 102, 241, 0.4)",
              }}
              transition={{ duration: 0.2 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-primary-600/30"
            >
              <div className="flex items-center mb-4">
                <h3 className="text-lg font-bold text-white break-words">
                  {category.title}
                </h3>
              </div>

              <ul className="space-y-3">
                {category.features.map((feature, featureIndex) => (
                  <motion.li
                    key={featureIndex}
                    className="flex items-start"
                    whileHover={{
                      x: 5,
                      color: "#a5b4fc",
                      transition: { duration: 0.2 },
                    }}
                  >
                    <div className="bg-primary-500/20 p-1 rounded-full mr-2 mt-1 flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 text-primary-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-gray-300 text-sm break-words">
                      {feature}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureMap;
