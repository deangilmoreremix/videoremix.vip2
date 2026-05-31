import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { PlatformProfile } from '../../types/personalization';

interface PlatformCardProps {
  profile: PlatformProfile;
}

export default function PlatformCard({ profile }: PlatformCardProps) {
  const getStatusIcon = () => {
    switch (profile.status) {
      case 'found':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'not_found':
        return <XCircle className="w-4 h-4 text-gray-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-danger" />;
      case 'pending':
        return <Loader2 className="w-4 h-4 animate-spin text-primary-500" />;
      default:
        return null;
    }
  };

  const getPlatformColor = () => {
    const colors: Record<string, string> = {
      github: 'from-gray-700 to-gray-900',
      twitter: 'from-blue-400 to-blue-600',
      linkedin: 'from-blue-600 to-blue-800',
      medium: 'from-green-600 to-green-800',
      devto: 'from-indigo-600 to-indigo-800',
      youtube: 'from-red-600 to-red-800',
      instagram: 'from-pink-500 to-purple-600',
      facebook: 'from-blue-500 to-blue-700',
    };
    return colors[profile.platform.toLowerCase()] || 'from-primary-600 to-primary-800';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${getPlatformColor()} rounded-xl p-4 border border-white/10`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white font-display capitalize">{profile.platform}</h3>
        {getStatusIcon()}
      </div>

      {profile.status === 'found' && (
        <>
          {profile.title && (
            <p className="text-sm text-white/90 mb-2 font-body">{profile.title}</p>
          )}
          {profile.description && (
            <p className="text-xs text-white/70 mb-3 font-body line-clamp-2">{profile.description}</p>
          )}
          {profile.profile_url && (
            <a
              href={profile.profile_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary-300 hover:text-primary-200 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              View Profile
            </a>
          )}
          {typeof profile.confidence_score === 'number' && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60 font-body">Confidence:</span>
                <div className="flex-1 h-1.5 bg-black/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success transition-all"
                    style={{ width: `${profile.confidence_score * 100}%` }}
                  />
                </div>
                <span className="text-xs text-white/80 font-body">
                  {Math.round(profile.confidence_score * 100)}%
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {profile.status === 'not_found' && (
        <p className="text-xs text-gray-400 font-body">No profile found</p>
      )}

      {profile.status === 'error' && (
        <p className="text-xs text-danger font-body">Scan error occurred</p>
      )}
    </motion.div>
  );
}