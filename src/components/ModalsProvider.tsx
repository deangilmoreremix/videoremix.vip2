import { useState, createContext, useContext, ReactNode, FC } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Types
type ModalType = 'featuredAnnouncement' | 'newFeature' | 'pricing';

interface ModalsContextType {
  showModal: (type: ModalType) => void;
  hideModal: (type: ModalType) => void;
  hideAllModals: () => void;
}

// Create context using createContext to avoid bundling issues
const ModalsContext = createContext<ModalsContextType>({
  showModal: () => {},
  hideModal: () => {},
  hideAllModals: () => {},
});

const useModals = () => useContext(ModalsContext);

export const ModalsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  console.log('✅ ModalsProvider rendering with useState');

  // Track which modals are visible
  const [visibleModals, setVisibleModals] = useState<
    Record<ModalType, boolean>
  >({
    featuredAnnouncement: false,
    newFeature: false,
    pricing: false,
  });

  // Show a specific modal
  const showModal = (type: ModalType) => {
    setVisibleModals((prev) => ({
      ...prev,
      [type]: true,
    }));
  };

  // Hide a specific modal
  const hideModal = (type: ModalType) => {
    setVisibleModals((prev) => ({
      ...prev,
      [type]: false,
    }));
  };

  // Hide all modals
  const hideAllModals = () => {
    setVisibleModals({
      featuredAnnouncement: false,
      newFeature: false,
      pricing: false,
    });
  };

  return (
    <ModalsContext.Provider
      value={{
        showModal,
        hideModal,
        hideAllModals,
      }}
    >
      {children}

      {/* Modal overlays */}
      <AnimatePresence>
        {/* Other modals will go here */}
      </AnimatePresence>
    </ModalsContext.Provider>
  );
};

// Helper component for modal overlay
const ModalOverlay: React.FC<{
  children: ReactNode;
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
