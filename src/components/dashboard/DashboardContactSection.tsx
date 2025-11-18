import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, MessageSquare, ChevronRight, User, LifeBuoy, CreditCard, Settings } from 'lucide-react';
import MagicSparkles from '../MagicSparkles';
import ContactForm from '../ContactForm';
import NewsletterSignup from '../NewsletterSignup';

const DashboardContactSection: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary-600/10 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-primary-600/10 rounded-full blur-[100px] -z-10"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto mb-16 text-center"
        >
          <MagicSparkles minSparkles={5} maxSparkles={8}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Need Help or Support?
            </h2>
          </MagicSparkles>
          
          <p className="text-xl text-gray-300 mb-8">
            We're here to help you make the most of VideoRemix.vip
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="md:col-span-8"
          >
            <ContactForm />
          </motion.div>
          
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="md:col-span-4"
          >
            <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
              <h3 className="text-xl font-bold text-white mb-6">Contact Information</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-primary-900/50 p-2 rounded-lg mr-4">
                    <Mail className="h-5 w-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <a href="mailto:support@videoremix.vip" className="text-white hover:text-primary-400">support@videoremix.vip</a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-primary-900/50 p-2 rounded-lg mr-4">
                    <Phone className="h-5 w-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Phone</p>
                    <a href="tel:+1-555-123-4567" className="text-white hover:text-primary-400">+1 (555) 123-4567</a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-primary-900/50 p-2 rounded-lg mr-4">
                    <MapPin className="h-5 w-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Address</p>
                    <address className="not-italic text-white">
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
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          {[
            {
              title: "Account Support",
              description: "Manage your account settings and preferences",
              link: "/account",
              icon: <User className="h-6 w-6 text-primary-400" />
            },
            {
              title: "Technical Help",
              description: "Get help with technical issues and bugs",
              link: "/help",
              icon: <LifeBuoy className="h-6 w-6 text-primary-400" />
            },
            {
              title: "Billing Questions",
              description: "Questions about your subscription and billing",
              link: "/billing",
              icon: <CreditCard className="h-6 w-6 text-primary-400" />
            },
            {
              title: "Feature Requests",
              description: "Suggest new features for VideoRemix.vip",
              link: "/feature-requests",
              icon: <Settings className="h-6 w-6 text-primary-400" />
            }
          ].map((item, index) => (
            <motion.a
              key={index}
              href={item.link}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
              whileHover={{ 
                y: -5,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                borderColor: "rgba(99, 102, 241, 0.4)"
              }}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700 transition-all duration-200"
            >
              <div className="flex items-center mb-3">
                <div className="bg-primary-900/50 p-2 rounded-lg mr-4 flex-shrink-0">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-white">{item.title}</h3>
              </div>
              <p className="text-gray-300 mb-4">{item.description}</p>
              <div className="flex items-center text-primary-400 hover:text-primary-300 text-sm font-medium">
                Get help
                <ChevronRight className="ml-1 h-4 w-4" />
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default DashboardContactSection;