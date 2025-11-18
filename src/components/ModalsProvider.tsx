import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CreateFirstVideoCTA from './CreateFirstVideoCTA';
import { X } from 'lucide-react';

// Types of modals we support
type ModalType = 'createFirstVideo' | 'featuredAnnouncement' | 'newFeature' | 'pricing';

interface ModalsContextType {
  showModal: (type: ModalType) => void;
  hideModal: (type: ModalType) => void;
  hideAllModals: () => void;
}

const ModalsContext = createContext<ModalsContextType>({
  showModal: () => {},
  hideModal: () => {},
  hideAllModals: () => {}
});

const useModals = () => useContext(ModalsContext);

export const ModalsProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Track which modals are visible
  const [visibleModals, setVisibleModals] = useState<Record<ModalType, boolean>>({
    createFirstVideo: false,
    featuredAnnouncement: false,
    newFeature: false,
    pricing: false
  });
  
  // Show a specific modal
  const showModal = (type: ModalType) => {
    setVisibleModals(prev => ({
      ...prev,
      [type]: true
    }));
  };
  
  // Hide a specific modal
  const hideModal = (type: ModalType) => {
    setVisibleModals(prev => ({
      ...prev,
      [type]: false
    }));
  };
  
  // Hide all modals
  const hideAllModals = () => {
    setVisibleModals({
      createFirstVideo: false,
      featuredAnnouncement: false,
      newFeature: false,
      pricing: false
    });
  };
  
  // Show the create first video modal to new users
  useEffect(() => {
    const hasSeenCreateFirstVideo = localStorage.getItem('hasSeenCreateFirstVideo');
    
    // Only show to new users who haven't seen it before
    if (!hasSeenCreateFirstVideo) {
      // Wait a bit before showing the modal
      const timeoutId = setTimeout(() => {
        showModal('createFirstVideo');
        localStorage.setItem('hasSeenCreateFirstVideo', 'true');
      }, 30000); // Show after 30 seconds
      
      return () => clearTimeout(timeoutId);
    }
  }, []);

  return (
    <ModalsContext.Provider 
      value={{
        showModal,
        hideModal,
        hideAllModals
      }}
    >
      {children}
      
      {/* Modal overlays */}
      <AnimatePresence>
        {/* Create First Video modal */}
        {visibleModals.createFirstVideo && (
          <ModalOverlay onClose={() => hideModal('createFirstVideo')}>
            <div className="relative">
              <button 
                onClick={() => hideModal('createFirstVideo')}
                className="absolute -top-2 -right-2 bg-gray-800 text-white p-1 rounded-full hover:bg-gray-700 transition-colors z-10"
              >
                <X className="h-4 w-4" />
              </button>
              <CreateFirstVideoCTA variant="popup" />
            </div>
          </ModalOverlay>
        )}
        
        {/* Other modals will go here */}
      </AnimatePresence>
    </ModalsContext.Provider>
  );
};

// Helper component for modal overlay
const ModalOverlay: React.FC<{
  children: React.ReactNode;
  onClose: () => void;
}> = ({ children, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Only close if clicking the backdrop, not the modal itself
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

