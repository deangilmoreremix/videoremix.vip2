import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Mail, Phone, MapPin, MessageSquare, ChevronRight } from 'lucide-react';
import MagicSparkles from '../components/MagicSparkles';
import ContactForm from '../components/ContactForm';
import NewsletterSignup from '../components/NewsletterSignup';

const ContactPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Contact Us | VideoRemix.vip</title>
        <meta 
          name="description" 
          content="Have questions about VideoRemix.vip? Contact our team for support, sales inquiries, or partnership opportunities. We're here to help!" 
        />
      </Helmet>
      
      <main className="pt-32 pb-20">
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary-600/10 rounded-full blur-[100px] -z-10"></div>
            <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-primary-600/10 rounded-full blur-[100px] -z-10"></div>
          </div>
          
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto mb-16 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <MagicSparkles minSparkles={5} maxSparkles={8}>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                    Get in Touch
                  </h1>
                </MagicSparkles>
                
                <p className="text-xl text-gray-300 mb-8">
                  Have questions or need help? Our team is ready to assist you.
                </p>
              </motion.div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="md:col-span-8"
              >
                <ContactForm />
              </motion.div>
              
              {/* Contact Information */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
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
            
            {/* Map */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="mt-16 mb-16 rounded-xl overflow-hidden border border-gray-700"
            >
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.0578043587647!2d-122.40282492426872!3d37.78824311639717!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80858085d1d3d8d9%3A0x8a7ff93b9a8a1064!2sSan%20Francisco%2C%20CA%2094107%2C%20USA!5e0!3m2!1sen!2s!4v1697055149398!5m2!1sen!2s"
                width="100%" 
                height="400" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </motion.div>
            
            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {[
                {
                  title: "Technical Support",
                  description: "Get help with technical issues and product questions",
                  link: "/help",
                  icon: <MessageSquare className="h-6 w-6 text-primary-400" />
                },
                {
                  title: "Sales Inquiries",
                  description: "Talk to our sales team about enterprise plans",
                  link: "/pricing",
                  icon: <Mail className="h-6 w-6 text-primary-400" />
                },
                {
                  title: "Partnership Opportunities",
                  description: "Explore partnership and collaboration possibilities",
                  link: "/partners",
                  icon: <Phone className="h-6 w-6 text-primary-400" />
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
                    Learn more
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </div>
                </motion.a>
              ))}
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
};

export default ContactPage;