import React from 'react';
import { cn } from '@/lib/utils';

interface SalesContentProps {
  salesCopy?: {
    whatItDoes?: string;
    howItMakesMoney?: string;
    whyBusinessesNeedIt?: string;
  };
  isLoading?: boolean;
}

export const SalesContent: React.FC<SalesContentProps> = ({ salesCopy, isLoading }) => {
  if (isLoading) {
    return (
      <div className="px-4 py-4 space-y-3 bg-white/5 rounded-lg border border-white/10 mt-2">
        <div className="skeleton h-4 w-24 bg-white/10 rounded"></div>
        <div className="skeleton h-3 w-full bg-white/10 rounded"></div>
        <div className="skeleton h-3 w-3/4 bg-white/10 rounded"></div>
        <div className="skeleton h-4 w-32 bg-white/10 rounded mt-4"></div>
        <div className="skeleton h-3 w-full bg-white/10 rounded"></div>
        <div className="skeleton h-3 w-2/3 bg-white/10 rounded"></div>
      </div>
    );
  }

  if (!salesCopy) {
    return (
      <div className="px-4 py-4 text-center text-sm text-gray-500">
        Sales information not available
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4 bg-white/5 rounded-lg border border-white/10 mt-2">
      {/* What It Does */}
      <div>
        <h4 className="text-sm font-semibold text-primary-400 mb-2 uppercase tracking-wide">
          What It Does
        </h4>
        <p className="text-sm text-gray-300 leading-relaxed">
          {salesCopy.whatItDoes || 'Description not available'}
        </p>
      </div>

      {/* How It Makes Money */}
      <div>
        <h4 className="text-sm font-semibold text-primary-400 mb-2 uppercase tracking-wide">
          How It Makes Money
        </h4>
        <p className="text-sm text-gray-300 leading-relaxed">
          {salesCopy.howItMakesMoney || 'Monetization details not available'}
        </p>
      </div>

      {/* Why Businesses Need It */}
      <div>
        <h4 className="text-sm font-semibold text-primary-400 mb-2 uppercase tracking-wide">
          Why Businesses Need It
        </h4>
        <p className="text-sm text-gray-300 leading-relaxed">
          {salesCopy.whyBusinessesNeedIt || 'Value proposition not available'}
        </p>
      </div>
    </div>
  );
};
