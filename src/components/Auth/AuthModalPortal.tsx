import { useEffect } from 'react';
// Removed ReactDOM import
import AuthModal from './AuthModal';
import { useModal } from '../../contexts/ModalContext';

const AuthModalPortal: React.FC = () => { // Renaming might be good later, but keep for now
  const { isAuthModalOpen, closeAuthModal } = useModal();
  
  // Removed portal target logic
  
  // Verhindern des Hintergrund-Scrollens, wenn das Modal geöffnet ist
  // This effect might still be useful, but let's see if it causes issues first.
  // Keep it for now.
  useEffect(() => {
    if (isAuthModalOpen) {
      // We might want to prevent scroll only on the content div now,
      // but let's keep targeting body for simplicity first.
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isAuthModalOpen]);

  // Render AuthModal directly if open
  if (!isAuthModalOpen) {
    return null;
  }

  return (
    <AuthModal
      isOpen={isAuthModalOpen} // Prop might be redundant now, but keep for consistency
      onClose={closeAuthModal}
    />
  );
};

export default AuthModalPortal;
