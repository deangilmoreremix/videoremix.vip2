import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useLandingPageContent } from "../context/LandingPageContext";

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { faqs, isLoading } = useLandingPageContent();

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Default FAQs in case data hasn't loaded yet
  const defaultFaqs = [
    {
      question: "What is VideoRemix VIP?",
      answer:
        "VideoRemix VIP is an AI-powered business app ecosystem with 113 apps across marketing, sales, video, hiring, and productivity. It unifies content creation, automation, and AI agents in one platform so teams can move from idea to outcome faster.",
    },
    {
      question: "How does VideoRemix VIP work?",
      answer:
        "VideoRemix VIP gives you access to 113 apps organized by workflow — content and video, sales funnels, hiring and profiles, productivity, and voice/agents. Apps share context across the platform, so outputs from one workflow can feed into the next.",
    },
    {
      question: "Do I need technical skills to use it?",
      answer:
        "No. The platform is designed for creators, operators, recruiters, and business owners. Most apps use guided prompts, templates, and agentic workflows so you can produce work without specialized training.",
    },
    {
      question: "What kinds of tasks can it handle?",
      answer:
        "It covers a wide range of business workflows: video editing and personalization, AI image and visual generation, funnel and sales automation, resume and profile creation, email and document productivity, voice agents, and AI workforce automations.",
    },
    {
      question: "What pricing options are available?",
      answer:
        "VideoRemix VIP offers tiered access so you can start free and grow into higher plans. The full app library is included with your plan, and upgrades unlock more usage, storage, team seats, and advanced AI features.",
    },
    {
      question: "Can teams and agencies use this?",
      answer:
        "Yes. Higher plans support multiple team members, shared workspaces, and client-ready outputs. Many teams use the platform to replace disjointed toolchains with one connected app ecosystem.",
    },
  ];

  // Use faqs from Supabase if available, otherwise use default
  const displayFaqs =
    !isLoading && faqs && faqs.length > 0 ? faqs : defaultFaqs;

  return (
    <section
      id="faq"
      className="py-20 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden"
    >
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Frequently Asked Questions
          </h2>

          <p className="text-xl text-gray-300 mb-0">
            Everything you need to know about the VideoRemix VIP ecosystem
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {displayFaqs.map((faq, index) => {
              const faqId = `faq-section-${index}`;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.05 }}
                  whileHover={{
                    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
                    y: -4,
                    transition: { duration: 0.2 },
                  }}
                  className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
                >
                  <button
                    className="flex justify-between items-center w-full text-left px-6 py-5 focus:outline-none"
                    onClick={() => toggleFaq(index)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleFaq(index);
                      }
                    }}
                    aria-expanded={openIndex === index}
                    aria-controls={faqId}
                    tabIndex={0}
                  >
                  <h3 className="text-lg font-medium text-white">
                    {faq.question}
                  </h3>
                  <div
                    className={`flex-shrink-0 ml-2 p-1 rounded-full transition-colors duration-200 ${
                      openIndex === index
                        ? "bg-primary-500/20 text-primary-400"
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    <motion.div
                      animate={{ rotate: openIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="h-5 w-5" />
                    </motion.div>
                    </div>
                  </button>

                  <motion.div
                    id={faqId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: openIndex === index ? "auto" : 0,
                      opacity: openIndex === index ? 1 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-gray-300">{faq.answer}</div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 text-center"
          >
            <p className="text-gray-300 mb-6">
              Still have questions? Our support team is here to help.
            </p>

            <motion.a
              href="#contact"
              className="inline-flex items-center bg-gray-800 hover:bg-gray-700 text-white font-medium px-6 py-3 rounded-lg border border-gray-700"
              whileHover={{
                scale: 1.05,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                borderColor: "rgba(99, 102, 241, 0.4)",
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              Contact Support
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
