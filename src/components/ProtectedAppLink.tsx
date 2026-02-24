import React, { useState } from "react";
import { Lock, ExternalLink, Loader } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import usePurchases from "../hooks/usePurchases";

interface ProtectedAppLinkProps {
  appId: string;
  appUrl: string;
  appName: string;
  children?: React.ReactNode;
  className?: string;
  showLockIcon?: boolean;
  onPurchaseRequired?: () => void;
}

const ProtectedAppLink: React.FC<ProtectedAppLinkProps> = ({
  appId,
  appUrl,
  appName,
  children,
  className = "",
  showLockIcon = true,
  onPurchaseRequired,
}) => {
  const { user } = useAuth();
  const { hasPurchased, loading } = usePurchases();
  const [checking, setChecking] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!user) {
      if (onPurchaseRequired) {
        onPurchaseRequired();
      }
      return;
    }

    if (loading || checking) {
      return;
    }

    setChecking(true);

    try {
      const hasAccess = hasPurchased(appId);

      if (hasAccess) {
        window.open(appUrl, "_blank", "noopener,noreferrer");
      } else {
        if (onPurchaseRequired) {
          onPurchaseRequired();
        }
      }
    } catch (error) {
      console.error("Error checking app access:", error);
      if (onPurchaseRequired) {
        onPurchaseRequired();
      }
    } finally {
      setChecking(false);
    }
  };

  const isPurchased = user && hasPurchased(appId);
  const isLoading = loading || checking;

  if (children) {
    return (
      <div onClick={handleClick} className={`cursor-pointer ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      {isLoading ? (
        <>
          <Loader className="h-4 w-4 animate-spin" />
          <span>Checking access...</span>
        </>
      ) : isPurchased ? (
        <>
          <ExternalLink className="h-4 w-4" />
          <span>Open {appName}</span>
        </>
      ) : (
        <>
          {showLockIcon && <Lock className="h-4 w-4" />}
          <span>Get Access</span>
        </>
      )}
    </button>
  );
};

export default ProtectedAppLink;
