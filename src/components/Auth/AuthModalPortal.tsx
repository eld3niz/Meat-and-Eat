import { useEffect } from 'react';
import ReactDOM from 'react-dom';
import AuthModal from './AuthModal';
import { useModal } from '../../contexts/ModalContext';

const AuthModalPortal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal } = useModal();
  
  // Portalziel (kann erst nach dem Rendering verwendet werden)
  const modalRoot = document.body;
  
  // Verhindern des Hintergrund-Scrollens, wenn das Modal geöffnet ist
  useEffect(() => {
    if (isAuthModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isAuthModalOpen]);

  return ReactDOM.createPortal(
    <AuthModal 
      isOpen={isAuthModalOpen} 
      onClose={closeAuthModal} 
    />,
    modalRoot
  );
};

export default AuthModalPortal;
