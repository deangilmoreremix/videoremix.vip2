import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useLandingPageContent } from '../context/LandingPageContext';

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { faqs, isLoading } = useLandingPageContent();

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Default FAQs in case data hasn't loaded yet
  const defaultFaqs = [
    {
      question: "What is VideoRemix.vip?",
      answer: "VideoRemix.vip is an AI-powered marketing personalization platform with 37+ tools designed to help solopreneurs, agencies, and businesses create personalized marketing content that drives results. Our platform combines audience segmentation, AI-powered personalization, and integrated marketing tools to help you achieve 3x higher engagement and conversion rates compared to generic marketing approaches."
    },
    {
      question: "How does VideoRemix.vip work?",
      answer: "VideoRemix.vip provides 37+ AI-powered marketing tools across Video, AI Image, Lead Generation, Branding, and Creative categories. Choose the tools you need, define your audience segments, and our AI automatically personalizes content, messaging, and calls-to-action for each segment. You can create personalized marketing campaigns—from videos to landing pages to CRM sequences—in minutes instead of days."
    },
    {
      question: "Do I need any technical skills to use VideoRemix.vip?",
      answer: "Not at all! VideoRemix.vip is designed for solopreneurs, marketers, and business owners with no technical background. Our intuitive interface and AI-powered personalization features make it easy for anyone to create professional marketing content, segment audiences, and launch personalized campaigns without technical skills or marketing expertise."
    },
    {
      question: "What types of marketing content can I create?",
      answer: "You can create personalized videos, landing pages, promotional content, email campaigns, social media posts, lead generation funnels, CRM sequences, branding materials, and more. With 37+ tools including AI Video Creator, Landing Page Creator, Smart CRM Closer, FunnelCraft AI, and Interactive Shopping, you can create virtually any type of personalized marketing content for your business or clients."
    },
    {
      question: "How much does VideoRemix.vip cost?",
      answer: "VideoRemix.vip offers a Free plan with basic features (5 video exports per month, 2 audience segments), a Pro plan at $29/month with unlimited access to all tools and segments, and a Business plan at $79/month with advanced features, team collaboration, and white-label options. We also offer annual and lifetime pricing options."
    },
    {
      question: "Can I use VideoRemix.vip for my agency or multiple clients?",
      answer: "Absolutely! Business plans support up to 10 team members and allow you to manage multiple client accounts with separate branding, campaigns, and analytics. Many agencies use our platform to offer personalized marketing services that would typically require multiple specialized tools and larger teams."
    }
  ];

  // Use faqs from Supabase if available, otherwise use default
  const displayFaqs = (!isLoading && faqs && faqs.length > 0) ? faqs : defaultFaqs;

  return (
    <section id="faq" className="py-20 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
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
            Everything you need to know about our marketing personalization platform
          </p>
        </motion.div>
        
        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {displayFaqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.05 }}
                whileHover={{ 
                  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
                  y: -4, 
                  transition: { duration: 0.2 }
                }}
                className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
              >
                <button
                  className="flex justify-between items-center w-full text-left px-6 py-5 focus:outline-none"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={openIndex === index}
                >
                  <h3 className="text-lg font-medium text-white">{faq.question}</h3>
                  <div className={`flex-shrink-0 ml-2 p-1 rounded-full transition-colors duration-200 ${
                    openIndex === index ? 'bg-primary-500/20 text-primary-400' : 'bg-gray-700 text-gray-400'
                  }`}>
                    <motion.div
                      animate={{ rotate: openIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="h-5 w-5" />
                    </motion.div>
                  </div>
                </button>
                
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ 
                    height: openIndex === index ? 'auto' : 0,
                    opacity: openIndex === index ? 1 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-5 text-gray-300">
                    {faq.answer}
                  </div>
                </motion.div>
              </motion.div>
            ))}
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
                borderColor: "rgba(99, 102, 241, 0.4)"
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