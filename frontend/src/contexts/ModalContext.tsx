import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextValue {
  isOpen: boolean;
  content: ReactNode | null;
  openModal: (content: ReactNode) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<ReactNode | null>(null);

  const openModal = (modalContent: ReactNode) => {
    setContent(modalContent);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setContent(null);
  };

  const value: ModalContextValue = {
    isOpen,
    content,
    openModal,
    closeModal,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      {isOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close-btn"
              onClick={closeModal}
              aria-label="Close modal"
            >
              ×
            </button>
            {content}
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

export default ModalProvider;
