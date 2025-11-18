import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Loader,
  MessageSquare
} from 'lucide-react';

interface NewsletterSignupProps {
  variant?: 'inline' | 'card';
  className?: string;
  title?: string;
  description?: string;
}

const NewsletterSignup: React.FC<NewsletterSignupProps> = ({ 
  variant = 'inline',
  className = '',
  title = 'Subscribe to Our Newsletter',
  description = 'Get the latest updates, tips and news delivered to your inbox.'
}) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email) {
      setStatus('error');
      setErrorMessage('Email address is required.');
      return;
    }
    
    setStatus('submitting');
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/newsletter-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }
      
      // Success
      setStatus('success');
      setEmail('');
      
    } catch (error) {
      console.error('Newsletter signup error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Something went wrong. Please try again.');
    }
  };
  
  // Card variant
  if (variant === 'card') {
    return (
      <div className={`bg-gradient-to-br from-primary-900/40 to-primary-700/40 rounded-xl border border-primary-500/30 p-6 ${className}`}>
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-gray-300 text-sm mb-4">{description}</p>
        
        {status === 'success' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-900/30 border border-green-600/30 rounded-lg p-4 text-center"
          >
            <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
            <p className="text-white font-medium">
              Thanks for subscribing!
            </p>
            <p className="text-gray-300 text-sm mt-1">
              You've been added to our mailing list.
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Error message */}
            {status === 'error' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 bg-red-900/30 border border-red-600/30 p-3 rounded-lg flex items-start"
              >
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-red-300 text-sm">{errorMessage}</p>
              </motion.div>
            )}
            
            <div className="relative mb-3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="bg-gray-800/70 border border-gray-700 rounded-lg w-full pl-10 p-3 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={status === 'submitting'}
              className={`w-full bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 rounded-lg transition-colors flex items-center justify-center ${
                status === 'submitting' ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {status === 'submitting' ? (
                <>
                  <Loader className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Subscribing...
                </>
              ) : (
                'Subscribe'
              )}
            </motion.button>
            
            <p className="text-xs text-gray-400 mt-3 text-center">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </form>
        )}
      </div>
    );
  }
  
  // Inline variant (default)
  return (
    <div className={className}>
      {status === 'success' ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-900/30 border border-green-600/30 rounded-lg p-4 flex items-center"
        >
          <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
          <div>
            <p className="text-white font-medium">
              Thanks for subscribing!
            </p>
            <p className="text-gray-300 text-sm">
              You've been added to our mailing list.
            </p>
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="text-gray-300">{description}</p>
          
          {/* Error message */}
          {status === 'error' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-900/30 border border-red-600/30 p-3 rounded-lg flex items-start"
            >
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-red-300 text-sm">{errorMessage}</p>
            </motion.div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="bg-gray-800/70 border border-gray-700 rounded-lg w-full pl-10 p-3 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={status === 'submitting'}
              className={`bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center ${
                status === 'submitting' ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {status === 'submitting' ? (
                <Loader className="animate-spin h-5 w-5" />
              ) : (
                'Subscribe'
              )}
            </motion.button>
          </div>
          
          <p className="text-xs text-gray-400">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </form>
      )}
    </div>
  );
};

export default NewsletterSignup;