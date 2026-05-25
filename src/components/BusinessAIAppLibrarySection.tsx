import React from "react";
import { motion } from "framer-motion";
import { Briefcase } from "lucide-react";

const BusinessAIAppLibrarySection: React.FC = () => {
  return (
    <section className="py-20 bg-gray-900/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-900/40 border border-primary-500/30 text-primary-300 text-sm font-medium mb-4">
            <Briefcase className="h-4 w-4" />
            Business AI Tools
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            VideoRemix VIP Business AI App Library
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Access our complete library of AI-powered business applications designed to transform your video content workflow.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {[
            {
              title: "Content Analysis",
              description: "AI-powered video content analysis and optimization",
              icon: "📊",
            },
            {
              title: "Auto Editing",
              description: "Intelligent automated video editing and enhancement",
              icon: "✂️",
            },
            {
              title: "Brand Kit",
              description: "Consistent branding across all video content",
              icon: "🎨",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -8 }}
              className="p-6 rounded-2xl bg-gray-800/60 border border-gray-700/50 hover:border-primary-500/50 transition-all duration-300"
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">
                {item.title}
              </h3>
              <p className="text-gray-400">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default BusinessAIAppLibrarySection;
