import React from "react";
import { motion } from "framer-motion";
import { Home, Search, User, Grid, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  if (!user) return null;

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Grid, label: "Apps", path: "/dashboard" },
    { icon: User, label: "Profile", path: "/profile" },
    { icon: LogOut, label: "Logout", action: signOut },
  ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 safe-area-inset-bottom"
    >
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = item.path ? isActive(item.path) : false;

          return (
            <motion.button
              key={index}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (item.action) {
                  item.action();
                } else if (item.path) {
                  navigate(item.path);
                }
              }}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                active
                  ? "text-primary-400 bg-primary-500/10"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Icon className={`h-6 w-6 ${active ? "text-primary-400" : ""}`} />
              <span className="text-xs font-medium">{item.label}</span>
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-t-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default MobileBottomNav;
