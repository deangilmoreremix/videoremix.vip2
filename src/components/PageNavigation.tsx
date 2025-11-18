import React from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface PageNavigationProps {
  showBackButton?: boolean;
  backUrl?: string;
  className?: string;
}

const PageNavigation: React.FC<PageNavigationProps> = ({ 
  showBackButton = true, 
  backUrl,
  className = ''
}) => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showBackButton && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBack}
          className="p-2 rounded-lg bg-gray-800/80 backdrop-blur-sm text-white hover:bg-gray-700 border border-gray-700 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </motion.button>
      )}
      
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Link 
          to="/" 
          className="p-2 rounded-lg bg-gray-800/80 backdrop-blur-sm text-white hover:bg-gray-700 border border-gray-700 transition-colors"
          aria-label="Go to home page"
        >
          <Home className="h-5 w-5" />
        </Link>
      </motion.div>
    </div>
  );
};

export default PageNavigation;