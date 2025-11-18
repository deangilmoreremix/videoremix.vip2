import React from 'react';
import { motion } from 'framer-motion';
import { Video, ArrowRight, FileVideo, Wand2, LayoutTemplate, Play, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CreateFirstVideoCTAProps {
  variant?: 'hero' | 'sidebar' | 'popup' | 'inline';
  className?: string;
}

const CreateFirstVideoCTA: React.FC<CreateFirstVideoCTAProps> = ({ 
  variant = 'inline',
  className = '' 
}) => {
  // Style variations based on placement
  const getContainerClasses = () => {
    switch (variant) {
      case 'hero':
        return 'max-w-xl bg-gradient-to-r from-primary-600/20 to-primary-400/20 backdrop-blur-sm mx-auto rounded-xl p-6 border border-primary-500/20';
      case 'sidebar':
        return 'bg-gradient-to-r from-primary-900/40 to-primary-800/40 rounded-lg p-4 border border-primary-500/30 shadow-lg';
      case 'popup':
        return 'bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-xl max-w-md w-full';
      case 'inline':
      default:
        return 'bg-gradient-to-r from-primary-600/20 to-primary-400/20 backdrop-blur-sm rounded-xl p-6 border border-primary-500/20';
    }
  };
  
  // Button style variations
  const getButtonClasses = () => {
    switch (variant) {
      case 'hero':
        return 'flex items-center bg-white text-primary-600 hover:bg-gray-100 font-semibold px-6 py-2.5 rounded-lg shadow-lg';
      case 'sidebar':
        return 'flex items-center w-full justify-center bg-white text-primary-600 hover:bg-gray-100 font-semibold px-4 py-2 rounded-lg shadow-lg text-sm';
      case 'popup':
        return 'flex items-center w-full justify-center bg-primary-600 text-white hover:bg-primary-700 font-semibold px-6 py-3 rounded-lg shadow-lg';
      case 'inline':
      default:
        return 'flex items-center bg-white text-primary-600 hover:bg-gray-100 font-semibold px-6 py-2.5 rounded-lg shadow-lg';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`${getContainerClasses()} ${className}`}
    >
      <div className="flex items-center justify-center mb-3">
        <div className="bg-gradient-to-r from-primary-500 to-primary-400 p-2.5 rounded-full">
          <Video className="h-5 w-5 text-white" />
        </div>
      </div>
      
      <h3 className="text-center text-xl font-bold text-white mb-3">Create Your First Personalized Marketing Content</h3>
      
      <p className="text-center text-gray-300 mb-4">
        Follow our simple step-by-step guide to create personalized marketing content in minutes, no experience needed.
      </p>
      
      {variant === 'sidebar' || variant === 'popup' ? (
        <div className="space-y-3 mb-4">
          <div className="flex items-center text-gray-300 text-sm">
            <div className="bg-primary-900/50 p-1.5 rounded-full mr-2 flex-shrink-0">
              <Clock className="h-3.5 w-3.5 text-primary-400" />
            </div>
            <span>Takes just 5-15 minutes</span>
          </div>
          <div className="flex items-center text-gray-300 text-sm">
            <div className="bg-primary-900/50 p-1.5 rounded-full mr-2 flex-shrink-0">
              <Wand2 className="h-3.5 w-3.5 text-primary-400" />
            </div>
            <span>AI assistance every step of the way</span>
          </div>
          <div className="flex items-center text-gray-300 text-sm">
            <div className="bg-primary-900/50 p-1.5 rounded-full mr-2 flex-shrink-0">
              <LayoutTemplate className="h-3.5 w-3.5 text-primary-400" />
            </div>
            <span>Professional marketing templates included</span>
          </div>
        </div>
      ) : null}
      
      <div className="flex justify-center">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link
            to="/help/create-first-video"
            className={getButtonClasses()}
          >
            {variant === 'popup' ? <FileVideo className="h-5 w-5 mr-2" /> : <Video className="h-5 w-5 mr-2" />}
            Create Your First Personalized Marketing Content
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </motion.div>
      </div>
      
      {variant === 'popup' && (
        <div className="text-center mt-3">
          <Link
            to="/help/video-editor-interface"
            className="text-sm text-primary-400 hover:text-primary-300 inline-flex items-center"
          >
            <Play className="h-3 w-3 mr-1" />
            Watch personalized marketing tutorial
          </Link>
        </div>
      )}
    </motion.div>
  );
};

export default CreateFirstVideoCTA;