import React, { useEffect, useState } from 'react';
import Layout from './components/Layout/Layout';
import WorldMap from './components/Map/WorldMap';
import AboutPage from './components/Pages/AboutPage';
import DatenschutzPage from './components/Pages/DatenschutzPage';
import ImpressumPage from './components/Pages/ImpressumPage';
import { fixLeafletIconPath } from './utils/mapUtils';
import { ModalProvider } from './contexts/ModalContext';
import { AuthProvider } from './context/AuthContext';
import AuthModalPortal from './components/Auth/AuthModalPortal';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('map'); // 'map', 'about', 'datenschutz', 'impressum'
  
  // Navigation-Handler
  useEffect(() => {
    const handleNavigation = () => {
      const path = window.location.pathname;
      if (path === '/about') {
        setCurrentPage('about');
      } else if (path === '/datenschutz') {
        setCurrentPage('datenschutz');
      } else if (path === '/impressum') {
        setCurrentPage('impressum');
      } else {
        setCurrentPage('map');
      }
    };

    // Initial und bei URL-Änderungen prüfen
    handleNavigation();
    window.addEventListener('popstate', handleNavigation);
    
    return () => window.removeEventListener('popstate', handleNavigation);
  }, []);
  
  // Fix für die Leaflet-Icons beim Laden der App
  useEffect(() => {
    fixLeafletIconPath();
    
    // Simuliere Ladezeit für die App
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  // Scroll-Steuerung je nach aktiver Seite
  useEffect(() => {
    if (currentPage === 'about' || currentPage === 'datenschutz' || currentPage === 'impressum') {
      document.body.classList.add('allow-scroll');
    } else {
      document.body.classList.remove('allow-scroll');
    }

    // Cleanup beim Komponentenabbau
    return () => {
      document.body.classList.remove('allow-scroll');
    };
  }, [currentPage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <h1 className="mt-4 text-xl font-bold text-blue-800">Meet and Eat wird geladen...</h1>
          <p className="mt-2 text-gray-600">Entdecken Sie kulinarische Highlights aus aller Welt</p>
        </div>
      </div>
    );
  }

  // Seiteninhalte basierend auf aktuellem Pfad anzeigen
  return (
    <AuthProvider>
      <ModalProvider>
        <div className="app flex flex-col min-h-screen">
          <Header />
          <div className="content flex-grow">
            {currentPage === 'about' ? (
              <AboutPage />
            ) : currentPage === 'datenschutz' ? (
              <DatenschutzPage />
            ) : currentPage === 'impressum' ? (
              <ImpressumPage />
            ) : (
              <WorldMap />
            )}
          </div>
          <Footer />
          <AuthModalPortal />
        </div>
      </ModalProvider>
    </AuthProvider>
  );
}

export default App;
