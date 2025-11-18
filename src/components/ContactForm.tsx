import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, 
  User, 
  Mail, 
  MessageSquare, 
  Briefcase, 
  CheckCircle, 
  AlertCircle, 
  Loader
} from 'lucide-react';

interface ContactFormProps {
  className?: string;
}

const ContactForm: React.FC<ContactFormProps> = ({ className = '' }) => {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  });
  
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formState.name || !formState.email || !formState.message) {
      setStatus('error');
      setErrorMessage('Please fill out all required fields.');
      return;
    }
    
    setStatus('submitting');
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/contact-form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formState)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }
      
      // Success
      setStatus('success');
      setFormState({
        name: '',
        email: '',
        company: '',
        subject: '',
        message: ''
      });
      
    } catch (error) {
      console.error('Contact form error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Something went wrong. Please try again.');
    }
  };
  
  return (
    <div className={`bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-700 ${className}`}>
      <h2 className="text-2xl font-bold text-white mb-6">Get In Touch</h2>
      
      {status === 'success' ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-900/30 border border-green-600/30 rounded-lg p-6 text-center"
        >
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Message Sent!</h3>
          <p className="text-gray-300">
            Thank you for contacting us. We'll get back to you as soon as possible.
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="mt-4 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            Send Another Message
          </button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Error message */}
          {status === 'error' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 bg-red-900/30 border border-red-600/30 p-3 rounded-lg flex items-start"
            >
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
              <p className="text-red-300 text-sm">{errorMessage}</p>
            </motion.div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Name field */}
            <div>
              <label htmlFor="name" className="block text-white mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  required
                  type="text"
                  id="name"
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="bg-gray-700 border border-gray-600 text-white rounded-lg w-full pl-10 p-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-white mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  required
                  type="email"
                  id="email"
                  name="email"
                  value={formState.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="bg-gray-700 border border-gray-600 text-white rounded-lg w-full pl-10 p-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          {/* Company field */}
          <div className="mb-6">
            <label htmlFor="company" className="block text-white mb-2">
              Company
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Briefcase className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                id="company"
                name="company"
                value={formState.company}
                onChange={handleChange}
                placeholder="Your company name (optional)"
                className="bg-gray-700 border border-gray-600 text-white rounded-lg w-full pl-10 p-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Subject dropdown */}
          <div className="mb-6">
            <label htmlFor="subject" className="block text-white mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              required
              id="subject"
              name="subject"
              value={formState.subject}
              onChange={handleChange}
              className="bg-gray-700 border border-gray-600 text-white rounded-lg w-full p-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select a subject</option>
              <option value="General Inquiry">General Inquiry</option>
              <option value="Technical Support">Technical Support</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Pricing Question">Pricing Question</option>
              <option value="Partnership Opportunity">Partnership Opportunity</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          {/* Message field */}
          <div className="mb-6">
            <label htmlFor="message" className="block text-white mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 flex-shrink-0 pointer-events-none">
                <MessageSquare className="h-5 w-5 text-gray-500" />
              </div>
              <textarea
                required
                id="message"
                name="message"
                rows={6}
                value={formState.message}
                onChange={handleChange}
                placeholder="How can we help you?"
                className="bg-gray-700 border border-gray-600 text-white rounded-lg w-full pl-10 p-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              ></textarea>
            </div>
          </div>
          
          {/* Submit button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={status === 'submitting'}
            className={`w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-colors ${
              status === 'submitting' ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {status === 'submitting' ? (
              <>
                <Loader className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Send Message
              </>
            )}
          </motion.button>
        </form>
      )}
    </div>
  );
};

export default ContactForm;