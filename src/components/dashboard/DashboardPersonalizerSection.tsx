import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Video, FileText, Sparkles, ArrowRight, Wand2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import usePurchases from "../../hooks/usePurchases";
import { useApps } from "../../hooks/useApps";
import MagicSparkles from "../MagicSparkles";

// The 17 AI Marketing Apps as specified
const newAppsList = [
  "ai-personalized-content",
  "funnelcraft-ai",
  "ai-skills-monetizer",
  "resume-amplifier",
  "landing-page",
  "sales-assistant-app",
  "ai-art",
  "personalizer-profile",
  "personalizer-video-image-transformer",
  "personalizer-recorder",
  "ai-signature",
  "thumbnail-generator",
  "personalizer-profile-generator",
  "video-ai-editor",
  "ai-referral-maximizer-pro",
  "ai-sales-maximizer",
  "ai-content",
  "product-research-ai",
];

// Helper function to get app URL
const getAppUrl = (appId: string, apps: any[]) => {
  const app = apps.find((a) => a.id === appId);
  return app?.url || `/app/${appId}`;
};

const DashboardPersonalizerSection: React.FC = () => {
  const { user } = useAuth();
  const { purchasedApps, hasAnyPurchases } = usePurchases();
  const { apps: appsData, loading: appsLoading } = useApps();

  const personalizerApps = appsData.filter(
    (app) =>
      newAppsList.includes(app.id) &&
      (!user || purchasedApps.includes(app.id)),
  );

  if (!user || !hasAnyPurchases || personalizerApps.length === 0) {
    return null;
  }

  return (
    <section className="py-24 bg-gradient-to-b from-[#050505] via-gray-900/20 to-[#050505] relative overflow-hidden">
      {/* Background ambient effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-primary-600/15 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] bg-accent-500/10 rounded-full blur-[90px]"></div>
        <div className="absolute inset-0 opacity-20 bg-gradient-to-b from-primary-900/10 via-transparent to-accent-900/10"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-6xl mx-auto mb-16 text-center"
        >
          <MagicSparkles minSparkles={6} maxSparkles={12}>
            <div className="inline-block mb-5">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-500 rounded-full blur-lg opacity-60 group-hover:opacity-80 transition-opacity"></div>
                <div className="relative bg-gradient-to-r from-primary-600 to-accent-500 text-white font-bold px-8 py-3 rounded-full flex items-center gap-3 shadow-lg shadow-primary-600/30">
                  <Wand2 className="h-5 w-5" />
                  <span className="text-sm tracking-wide uppercase">AI Marketing Tools</span>
                </div>
              </div>
            </div>
          </MagicSparkles>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}>
            Your <span className="bg-gradient-to-r from-primary-400 via-accent-400 to-primary-300 bg-clip-text text-transparent">AI Arsenal</span>
          </h2>

          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto font-light">
            Powerful AI tools that transform your marketing, automate workflows, and accelerate growth.
          </p>
        </motion.div>

        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {personalizerApps.slice(0, 9).map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * index, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -10, transition: { duration: 0.2 } }}
                className="group relative bg-gradient-to-br from-gray-900/90 via-gray-800/70 to-gray-900/90 backdrop-blur-xl rounded-2xl overflow-hidden border border-gray-700/40 hover:border-primary-500/60 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-primary-900/20"
              >
                <a href={`/app/${app.id}`} className="block">
                  <div className="relative h-[200px] overflow-hidden">
                    <img
                      src={app.image}
                      alt={app.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none"></div>

                    <div className="absolute top-3 left-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm shadow-md">
                      <Sparkles className="h-3 w-3" />
                      AI Tool
                    </div>

                    {app.popular && (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        POPULAR
                      </div>
                    )}

                    {app.new && (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        NEW
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h4 className="text-white font-bold text-xl mb-2 group-hover:text-primary-400 transition-colors line-clamp-1">
                      {app.name}
                    </h4>
                    <p className="text-gray-400 text-sm mb-5 leading-relaxed line-clamp-2">
                      {app.description}
                    </p>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {React.isValidElement(app.icon) ? (
                          React.cloneElement(app.icon as React.ReactElement, {
                            className: "h-4 w-4 text-primary-400 mr-2",
                          })
                        ) : (
                          <Sparkles className="h-4 w-4 text-primary-400 mr-2" />
                        )}
                        <span className="text-gray-500 text-xs uppercase tracking-wider">
                          AI Tool
                        </span>
                      </div>

                      <span className="text-primary-400 text-sm font-semibold flex items-center group-hover:translate-x-1 transition-transform">
                        Use Tool
                        <ArrowRight className="h-4 w-4 ml-1.5" />
                      </span>
                    </div>
                  </div>
                </a>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-900/30 via-transparent to-accent-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Hover action button */}
                <div className="absolute inset-0 bg-primary-950/80 opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex flex-col justify-center items-center rounded-2xl backdrop-blur-sm">
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-primary-600 to-accent-500 text-white font-bold py-3 px-8 rounded-xl flex items-center shadow-xl shadow-primary-900/50"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = getAppUrl(app.id, appsData);
                    }}
                  >
                    <Wand2 className="h-5 w-5 mr-2" />
                    Open Tool
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {personalizerApps.length > 9 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-10"
          >
            <Link
              to="/tools"
              className="inline-flex items-center bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold px-8 py-4 rounded-lg shadow-lg shadow-primary-600/20"
            >
              View All AI Marketing Tools
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default DashboardPersonalizerSection;
