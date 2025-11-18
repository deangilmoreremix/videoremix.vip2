import React from 'react';
import { motion } from 'framer-motion';
import { Video, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CreateFirstVideoCTA = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="max-w-xl bg-gradient-to-r from-primary-600/20 to-primary-400/20 backdrop-blur-sm mx-auto mt-7 rounded-xl p-6 border border-primary-500/20"
    >
      <div className="flex items-center justify-center mb-3">
        <div className="bg-gradient-to-r from-primary-500 to-primary-400 p-2.5 rounded-full">
          <Video className="h-5 w-5 text-white" />
        </div>
      </div>
      <h3 className="text-center text-xl font-bold text-white mb-3">Create Your First Personalized Marketing Campaign</h3>
      <p className="text-center text-gray-300 mb-4">
        Launch your first personalized marketing campaign in minutes with our AI-powered personalization platform.
      </p>
      <div className="flex justify-center">
        <Link
          to="/help/create-first-video"
          className="flex items-center bg-white text-primary-600 hover:bg-gray-100 font-semibold px-6 py-2.5 rounded-lg shadow-lg transition-all duration-200"
        >
          <Video className="h-5 w-5 mr-2" />
          Start Personalizing Content
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </motion.div>
  );
};

export default CreateFirstVideoCTA;