import React from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  ChevronRight,
  User,
  LifeBuoy,
  CreditCard,
  Settings,
} from "lucide-react";
import MagicSparkles from "../MagicSparkles";
import ContactForm from "../ContactForm";
import NewsletterSignup from "../NewsletterSignup";

const DashboardContactSection: React.FC = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-[#050505] via-gray-900/20 to-[#050505] relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] -z-10"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto mb-16 text-center"
        >
          <MagicSparkles minSparkles={5} maxSparkles={10}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6"
              style={{ fontFamily: 'var(--font-display)' }}>
              Need Help or <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">Support</span>?
            </h2>
          </MagicSparkles>

          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            We're here to help you get the most out of VideoRemix.vip.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7"
          >
            <ContactForm />
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="lg:col-span-5"
          >
            <div className="bg-gradient-to-br from-gray-900/80 via-gray-800/60 to-gray-900/80 backdrop-blur-xl rounded-2xl p-7 border border-gray-700/50 mb-8 shadow-xl">
              <h3 className="text-2xl font-bold text-white mb-6">Contact Information</h3>

              <div className="space-y-5">
                <div className="flex items-start group">
                  <div className="p-3 bg-gradient-to-br from-primary-900/50 to-primary-800/30 rounded-xl mr-4 flex-shrink-0 border border-primary-500/20 group-hover:border-primary-500/40 transition-colors">
                    <Mail className="h-5 w-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1 uppercase tracking-wider font-medium">Email</p>
                    <a
                      href="mailto:support@videoremix.vip"
                      className="text-white hover:text-primary-400 transition-colors"
                    >
                      support@videoremix.vip
                    </a>
                  </div>
                </div>

                <div className="flex items-start group">
                  <div className="p-3 bg-gradient-to-br from-primary-900/50 to-primary-800/30 rounded-xl mr-4 flex-shrink-0 border border-primary-500/20 group-hover:border-primary-500/40 transition-colors">
                    <Phone className="h-5 w-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1 uppercase tracking-wider font-medium">Phone</p>
                    <a
                      href="tel:+1-555-123-4567"
                      className="text-white hover:text-primary-400 transition-colors"
                    >
                      +1 (555) 123-4567
                    </a>
                  </div>
                </div>

                <div className="flex items-start group">
                  <div className="p-3 bg-gradient-to-br from-primary-900/50 to-primary-800/30 rounded-xl mr-4 flex-shrink-0 border border-primary-500/20 group-hover:border-primary-500/40 transition-colors">
                    <MapPin className="h-5 w-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1 uppercase tracking-wider font-medium">Address</p>
                    <address className="not-italic text-white leading-relaxed">
                      123 Innovation Way<br />
                      San Francisco, CA 94107<br />
                      United States
                    </address>
                  </div>
                </div>
              </div>
            </div>

            {/* Newsletter Signup */}
            <NewsletterSignup variant="card" />
          </motion.div>
        </div>

        {/* Quick Support Links */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-4 gap-5"
        >
          {[
            {
              title: "Account Support",
              description: "Manage settings and preferences",
              link: "/account",
              icon: <User className="h-5 w-5" />,
            },
            {
              title: "Technical Help",
              description: "Issues, bugs, and troubleshooting",
              link: "/help",
              icon: <LifeBuoy className="h-5 w-5" />,
            },
            {
              title: "Billing Questions",
              description: "Subscription and billing support",
              link: "/billing",
              icon: <CreditCard className="h-5 w-5" />,
            },
            {
              title: "Feature Requests",
              description: "Suggest new features",
              link: "/feature-requests",
              icon: <Settings className="h-5 w-5" />,
            },
          ].map((item, index) => (
            <motion.a
              key={index}
              href={item.link}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              whileHover={{
                y: -6,
                transition: { duration: 0.2 }
              }}
              className="group relative bg-gradient-to-br from-gray-900/60 via-gray-800/50 to-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/40 hover:border-primary-500/60 hover:bg-gray-900/80 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-900/10 to-accent-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <div className="p-2.5 bg-gradient-to-br from-primary-900/40 to-primary-800/30 rounded-xl mr-3 border border-primary-500/20 group-hover:border-primary-500/40 transition-colors">
                    <span className="text-primary-400">{item.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors">{item.title}</h3>
                </div>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">{item.description}</p>
                <div className="flex items-center text-primary-400 hover:text-primary-300 text-sm font-semibold group-hover:translate-x-1 transition-transform">
                  Get help
                  <ChevronRight className="ml-1.5 h-4 w-4" />
                </div>
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default DashboardContactSection;
