import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SalesCopy {
  tonality: string;
  whatItDoes: string;
  howItMakesMoney: string;
  whyBusinessesNeedIt: string;
}

interface SalesDropdownProps {
  salesCopy: SalesCopy;
  isExpanded: boolean;
  onToggle: () => void;
}

export const SalesDropdown: React.FC<SalesDropdownProps> = ({
  salesCopy,
  isExpanded,
  onToggle
}) => {
  return (
    <div className="sales-dropdown">
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center justify-between w-full px-4 py-3 text-left",
          "bg-white/5 hover:bg-white/10 rounded-lg border border-white/10",
          "transition-all duration-200 ease-in-out",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900",
          "group"
        )}
        aria-expanded={isExpanded}
        aria-controls="sales-content"
      >
        <span className="text-sm font-medium text-white">
          Learn More
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-white/70 transition-transform duration-200 ease-in-out",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id="sales-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
              opacity: { duration: 0.2 }
            }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4 bg-white/5 rounded-lg border border-white/10 mt-2">
              {/* What It Does */}
              <div>
                <h4 className="text-sm font-semibold text-primary-400 mb-2 uppercase tracking-wide">
                  What It Does
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {salesCopy.whatItDoes}
                </p>
              </div>

              {/* How It Makes Money */}
              <div>
                <h4 className="text-sm font-semibold text-primary-400 mb-2 uppercase tracking-wide">
                  How It Makes Money
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {salesCopy.howItMakesMoney}
                </p>
              </div>

              {/* Why Businesses Need It */}
              <div>
                <h4 className="text-sm font-semibold text-primary-400 mb-2 uppercase tracking-wide">
                  Why Businesses Need It
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {salesCopy.whyBusinessesNeedIt}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};