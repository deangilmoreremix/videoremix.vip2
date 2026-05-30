import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, CheckCircle2 } from 'lucide-react';
import { PlatformProfile } from '../../types/personalization';

interface PlatformCardProps {
  platform: PlatformProfile;
  index?: number;
}

const PlatformCard: React.FC<PlatformCardProps> = ({ platform, index = 0 }) => {
  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      github: 'from-gray-700 to-gray-900',
      linkedin: 'from-blue-600 to-blue-800',
      twitter: 'from-sky-400 to-sky-600',
      facebook: 'from-blue-700 to-blue-900',
      instagram: 'from-pink-500 to-purple-600',
    };
    return colors[platform.toLowerCase()] || 'from-primary-600 to-primary-800';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:border-primary-500/30 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`px-3 py-1 bg-gradient-to-r ${getPlatformColor(platform.platform)} rounded-full text-xs font-medium`}>
          {platform.platform}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400">Confidence</span>
          <span className={`text-sm font-bold ${platform.confidence >= 70 ? 'text-green-400' : platform.confidence >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
            {platform.confidence}%
          </span>
        </div>
      </div>

      {platform.profileUrl && (
        <a
          href={platform.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-primary-400 hover:text-primary-300 text-sm mb-2 truncate"
        >
          <ExternalLink className="h-3 w-3" />
          <span className="truncate">{platform.profileUrl}</span>
        </a>
      )}

      {platform.extractedBio && (
        <p className="text-gray-300 text-sm mb-3 line-clamp-3">{platform.extractedBio}</p>
      )}

      {platform.extractedInterests.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {platform.extractedInterests.slice(0, 5).map((interest, i) => (
            <span key={i} className="px-2 py-0.5 bg-gray-700/50 rounded text-xs text-gray-400">
              {interest}
            </span>
          ))}
          {platform.extractedInterests.length > 5 && (
            <span className="px-2 py-0.5 bg-gray-700/50 rounded text-xs text-gray-400">+{platform.extractedInterests.length - 5}</span>
          )}
        </div>
      )}

      {platform.activityIndicators && (
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-700">
          {platform.activityIndicators.followers && (
            <div className="text-center">
              <p className="text-xs text-gray-400">Followers</p>
              <p className="text-sm font-medium">{platform.activityIndicators.followers.toLocaleString()}</p>
            </div>
          )}
          {platform.activityIndicators.repos && (
            <div className="text-center">
              <p className="text-xs text-gray-400">Repos</p>
              <p className="text-sm font-medium">{platform.activityIndicators.repos}</p>
            </div>
          )}
          {platform.activityIndicators.posts && (
            <div className="text-center">
              <p className="text-xs text-gray-400">Posts</p>
              <p className="text-sm font-medium">{platform.activityIndicators.posts}</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default PlatformCard;