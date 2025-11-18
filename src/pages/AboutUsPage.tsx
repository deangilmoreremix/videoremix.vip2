import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Sparkles, Video, ChevronRight, Users, Star, Clock, Award, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import MagicSparkles from '../components/MagicSparkles';

const AboutUsPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>About VideoRemix.vip | Our Story, Mission & Team</title>
        <meta 
          name="description"
          content="Learn about VideoRemix.vip's mission to democratize marketing personalization with AI-powered tools. Meet our team and discover the story behind our platform."
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
                    About <span className="text-primary-400">VideoRemix.vip</span>
                  </h1>
                </MagicSparkles>
                
                <p className="text-xl text-gray-300 mb-8">
                  We're on a mission to democratize marketing personalization and empower marketers with AI-powered tools.
                </p>
              </motion.div>
            </div>
            
            {/* Our Story */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
              >
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg blur opacity-25"></div>
                  <div className="relative">
                    <img 
                      src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80" 
                      alt="VideoRemix.vip Team" 
                      className="rounded-lg shadow-xl"
                    />
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <h2 className="text-3xl font-bold text-white mb-6">Our Story</h2>
                <p className="text-gray-300 mb-4">
                  VideoRemix.vip was born from a simple observation: marketing personalization was still too complex, time-consuming, and technical for most businesses. Despite the growing importance of personalized marketing, the tools remained stuck in the past.
                </p>
                <p className="text-gray-300 mb-4">
                  Founded in 2022 by a team of AI engineers and marketing experts, we set out to build a platform that would make professional marketing personalization accessible to everyone, regardless of technical skill or budget constraints.
                </p>
                <p className="text-gray-300">
                  Today, VideoRemix.vip serves thousands of marketers and businesses worldwide, helping them create personalized marketing campaigns in a fraction of the time it would traditionally take.
                </p>
              </motion.div>
            </div>
            
            {/* Our Mission */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="max-w-4xl mx-auto text-center mb-20"
            >
              <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
              
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-xl border border-gray-700">
                <div className="inline-block mb-6">
                  <Sparkles className="h-10 w-10 text-primary-400" />
                </div>
                <p className="text-2xl text-gray-100 italic mb-4">
                  "To empower everyone to create personalized marketing that converts without the technical barriers, democratizing marketing personalization through AI and intuitive design."
                </p>
                <p className="text-gray-400">
                  This mission guides everything we do, from feature development to customer support.
                </p>
              </div>
            </motion.div>
            
            {/* Our Values */}
            <div className="mb-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl font-bold text-white mb-6">Our Values</h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  These core principles guide our decisions and shape the way we build our product.
                </p>
              </motion.div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    title: "Innovation First",
                    description: "We continuously push the boundaries of what's possible with AI and marketing personalization technology.",
                    icon: <Sparkles className="h-8 w-8 text-primary-400" />
                  },
                  {
                    title: "Empowering Creativity",
                    description: "We build tools that enable creative expression without technical limitation.",
                    icon: <Video className="h-8 w-8 text-primary-400" />
                  },
                  {
                    title: "User-Centered Design",
                    description: "We prioritize intuitive experiences that make powerful technology accessible to everyone.",
                    icon: <Users className="h-8 w-8 text-primary-400" />
                  },
                  {
                    title: "Quality & Excellence",
                    description: "We're committed to delivering professional-quality results and exceptional experiences.",
                    icon: <Star className="h-8 w-8 text-primary-400" />
                  },
                  {
                    title: "Efficiency & Time-Saving",
                    description: "We value your time and build features that maximize productivity.",
                    icon: <Clock className="h-8 w-8 text-primary-400" />
                  },
                  {
                    title: "Continuous Improvement",
                    description: "We listen, learn, and constantly evolve our platform based on user feedback.",
                    icon: <Award className="h-8 w-8 text-primary-400" />
                  }
                ].map((value, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                    className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700"
                  >
                    <div className="bg-primary-900/50 p-3 rounded-lg inline-block mb-4">
                      {value.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
                    <p className="text-gray-300">{value.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Meet the Team */}
            <div className="mb-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl font-bold text-white mb-6">Meet Our Leadership Team</h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  The passionate people behind VideoRemix.vip working to transform marketing personalization.
                </p>
              </motion.div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  {
                    name: "Alex Morgan",
                    role: "Founder & CEO",
                    bio: "Former AI Research Lead at Google, Alex founded VideoRemix.vip to democratize marketing personalization.",
                    image: "https://randomuser.me/api/portraits/men/32.jpg"
                  },
                  {
                    name: "Sarah Chen",
                    role: "Chief Technology Officer",
                    bio: "Machine learning expert with over 15 years of experience in computer vision and AI systems.",
                    image: "https://randomuser.me/api/portraits/women/44.jpg"
                  },
                  {
                    name: "James Wilson",
                    role: "Head of Product",
                    bio: "Former filmmaker turned product leader, focused on creating intuitive creative tools.",
                    image: "https://randomuser.me/api/portraits/men/68.jpg"
                  },
                  {
                    name: "Priya Sharma",
                    role: "Chief Marketing Officer",
                    bio: "Digital marketing strategist who has helped scale multiple SaaS startups to success.",
                    image: "https://randomuser.me/api/portraits/women/65.jpg"
                  }
                ].map((member, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                    className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden"
                  >
                    <div className="aspect-square">
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    
                    <div className="p-5">
                      <h4 className="text-xl font-bold text-white mb-1">{member.name}</h4>
                      <p className="text-primary-400 text-sm mb-3">{member.role}</p>
                      <p className="text-gray-400 text-sm">{member.bio}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* CTA section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center bg-gradient-to-r from-primary-900/40 to-primary-700/40 p-8 rounded-xl border border-primary-500/30"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Join Us on Our Mission
              </h2>
              
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Experience firsthand how our platform is transforming marketing personalization for businesses worldwide.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link 
                    to="/get-started" 
                    className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold py-4 px-8 rounded-lg w-full sm:w-auto inline-flex items-center justify-center"
                  >
                    Try VideoRemix.vip Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link 
                    to="/careers" 
                    className="bg-gray-800 hover:bg-gray-700 text-white font-medium py-4 px-8 rounded-lg border border-gray-700 w-full sm:w-auto inline-flex items-center justify-center"
                  >
                    Join Our Team
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
};

export default AboutUsPage;