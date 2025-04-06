import React from 'react';
import { createPortal } from 'react-dom';
import { useModal } from '../../contexts/ModalContext';
import AuthModal from './AuthModal';

const AuthModalPortal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, initialAuthTab } = useModal();

  if (!isAuthModalOpen) return null;

  return createPortal(
    <AuthModal 
      isOpen={isAuthModalOpen} 
      onClose={closeAuthModal} 
      initialTab={initialAuthTab}
    />,
    document.body
  );
};

export default AuthModalPortal;
