import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ExternalLink, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useUserAccess } from "../hooks/useUserAccess";
import { isInternalAIApp } from "../config/internalAIApps";
import { isExternalUrl } from "../config/appUrls";

/**
 * AppLaunchButton
 *
 * Extracted from the giant IIFE inside AppDetailPage.tsx (the 167-line conditional
 * for external Netlify vs internal /ai-app/ runner vs default pricing).
 *
 * Encapsulates the decision tree + auth/access checks so the detail page JSX stays clean.
 * Used for both the legacy 15 external apps and the 95 internal AI apps.
 */
interface AppLaunchButtonProps {
  app: any;
  onPurchaseClick: () => void;
}

export const AppLaunchButton: React.FC<AppLaunchButtonProps> = ({ app, onPurchaseClick }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasAccessToApp } = useUserAccess();

  const isOwned = !!user && hasAccessToApp(app.slug || app.id);
  const appId = app.id || app.slug || "";
  const isInternalRunner = app.url?.startsWith("/ai-app/") && isInternalAIApp(appId);

  if (app.url && isExternalUrl(appId)) {
    // Legacy 15 apps - external Netlify sites
    if (isOwned) {
      return (
        <motion.a
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)" }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center justify-center bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold px-8 py-4 rounded-lg shadow-lg relative overflow-hidden"
        >
          <span className="relative z-10">Launch {app.name}</span>
          <ExternalLink className="ml-2 h-5 w-5" />
        </motion.a>
      );
    } else {
      return (
        <motion.button
          onClick={onPurchaseClick}
          whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)" }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center justify-center bg-gradient-to-r from-gray-600 to-gray-500 hover:from-primary-600 hover:to-primary-500 text-white font-bold px-8 py-4 rounded-lg shadow-lg"
        >
          <Lock className="mr-2 h-5 w-5" />
          Get Access to {app.name}
        </motion.button>
      );
    }
  }

  if (isInternalRunner) {
    // The 95 first-party AI apps - rich React runner inside the dashboard
    if (isOwned) {
      return (
        <motion.button
          onClick={() => navigate(app.url!)}
          whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)" }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center justify-center bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold px-8 py-4 rounded-lg shadow-lg relative overflow-hidden"
        >
          <span className="relative z-10">Launch {app.name}</span>
        </motion.button>
      );
    } else {
      return (
        <motion.button
          onClick={onPurchaseClick}
          whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)" }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center justify-center bg-gradient-to-r from-gray-600 to-gray-500 hover:from-primary-600 hover:to-primary-500 text-white font-bold px-8 py-4 rounded-lg shadow-lg"
        >
          <Lock className="mr-2 h-5 w-5" />
          Get Access to {app.name}
        </motion.button>
      );
    }
  }

  // Default (marketing detail pages that are not yet wired to a runner)
  return (
    <motion.button
      onClick={() => navigate("/pricing")}
      whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)" }}
      whileTap={{ scale: 0.95 }}
      className="inline-flex items-center justify-center bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold px-8 py-4 rounded-lg shadow-lg relative overflow-hidden"
    >
      <span className="relative z-10">Try {app.name} Now</span>
      <ArrowRight className="ml-2 h-5 w-5" />
    </motion.button>
  );
};

export default AppLaunchButton;
