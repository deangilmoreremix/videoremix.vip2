import React from 'react';
import { Lock, ShoppingCart, Star, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface LockedAppOverlayProps {
  appName: string;
  appDescription: string;
  appPrice?: number;
  onPurchaseClick: () => void;
  className?: string;
}

const LockedAppOverlay: React.FC<LockedAppOverlayProps> = ({
  appName,
  appDescription,
  appPrice = 97,
  onPurchaseClick,
  className = '',
}) => {
  return (
    <div
      className={`absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-primary-900/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 ${className}`}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center max-w-md"
      >
        <div className="bg-primary-600/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-primary-500">
          <Lock className="h-10 w-10 text-primary-400" />
        </div>

        <h3 className="text-2xl font-bold text-white mb-2">{appName}</h3>
        <p className="text-gray-300 mb-6 text-sm">{appDescription}</p>

        <div className="bg-black/30 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
          </div>
          <div className="text-gray-400 text-xs mb-2">Unlock this app for:</div>
          <div className="text-3xl font-bold text-white mb-1">${appPrice}</div>
          <div className="text-gray-400 text-xs">One-time payment, lifetime access</div>
        </div>

        <div className="space-y-2 mb-6">
          <div className="flex items-center text-gray-300 text-sm">
            <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
            <span>Instant access after purchase</span>
          </div>
          <div className="flex items-center text-gray-300 text-sm">
            <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
            <span>Lifetime updates included</span>
          </div>
          <div className="flex items-center text-gray-300 text-sm">
            <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
            <span>Premium support</span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPurchaseClick}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-primary-600/30 flex items-center justify-center transition-all"
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          Purchase Now
        </motion.button>

        <p className="text-gray-400 text-xs mt-4">
          Secure checkout powered by Stripe
        </p>
      </motion.div>
    </div>
  );
};

export default LockedAppOverlay;
