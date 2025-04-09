import React, { useEffect, useState } from 'react';
import Layout from './components/Layout/Layout'; // Keep if used elsewhere, otherwise remove?
import WorldMap from './components/Map/WorldMap';
import AboutPage from './components/Pages/AboutPage';
import DatenschutzPage from './components/Pages/DatenschutzPage';
import ImpressumPage from './components/Pages/ImpressumPage';
import { fixLeafletIconPath } from './utils/mapUtils';
import { ModalProvider } from './contexts/ModalContext';
import { AuthProvider, useAuth } from './context/AuthContext'; // Import useAuth
import AuthModalPortal from './components/Auth/AuthModalPortal';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import LocationPermissionModal from './components/UI/LocationPermissionModal'; // Import the new modal
// Import LoginPrompt
import LoginPrompt from './components/UI/LoginPrompt'; // Added import
import { useMapData } from './hooks/useMapData'; // Import useMapData hook

// Inner component to access AuthContext
const AppContent = () => {
  const { user, locationPermissionStatus, loading: authLoading } = useAuth(); // Get userCoordinates and isFetchingLocation
  const [isAppLoading, setIsAppLoading] = useState(true); // Renamed to avoid conflict
  const [currentPage, setCurrentPage] = useState('map'); // 'map', 'about', 'datenschutz', 'impressum'
  const [activeMainTab, setActiveMainTab] = useState('users'); // 'users' or 'meetups'
  // Call useMapData here to get data needed for UserTable
  useMapData(); // Call hook, but don't destructure unused variables

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
        setCurrentPage('map'); // Default to map/home
      }
    };
    handleNavigation();
    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, []);

  // Fix Leaflet icons and handle initial app loading state
  useEffect(() => {
    fixLeafletIconPath();
    // Consider app loaded only when auth is resolved AND initial delay passed
    if (!authLoading) {
      const timer = setTimeout(() => {
        setIsAppLoading(false);
      }, 300); // Reduced delay slightly, adjust as needed
      return () => clearTimeout(timer);
    }
    // If auth is still loading, ensure app loading state remains true
    setIsAppLoading(true);
  }, [authLoading]);

  // Scroll-Steuerung je nach aktiver Seite
  useEffect(() => {
    // Always allow scrolling now that UserTable is part of the main flow on map page
    document.body.classList.add('allow-scroll');
    // Cleanup function still removes the class on component unmount or page change
    return () => {
      document.body.classList.remove('allow-scroll');
    };
  }, [currentPage]);

  // Show loading indicator if either app init or auth is loading
  if (isAppLoading || authLoading) {
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

  // Determine if the location modal should be shown (only on map page for logged-in users with denied/unavailable location)
  const showLocationModal = currentPage === 'map' && !!user && (locationPermissionStatus === 'denied' || locationPermissionStatus === 'unavailable');

  // Render main application content
  return (
    <div className="app flex flex-col min-h-screen">
      <Header />
      {/* Add relative positioning to make this the context for the modal */}
      {/* Make content area a flex column and handle overflow */}
      <div className="content flex-grow relative flex flex-col overflow-hidden">
        {/* Render tabs only on map page for logged-in users */}
        {currentPage === 'map' && user && (
          <div className="flex border-b border-gray-300 px-4 pt-2">
            <button
              className={`py-2 px-4 text-sm font-medium ${activeMainTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveMainTab('users')}
            >
              Users
            </button>
            <button
              className={`py-2 px-4 text-sm font-medium ${activeMainTab === 'meetups' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveMainTab('meetups')}
            >
              Meetups
            </button>
          </div>
        )}

        {/* Page rendering logic */}
        {currentPage === 'about' ? (
          <AboutPage />
        ) : currentPage === 'datenschutz' ? (
          <DatenschutzPage />
        ) : currentPage === 'impressum' ? (
          <ImpressumPage />
        ) : ( // Handle map page rendering (Users/Meetups tabs or LoginPrompt)
          user ? (
            activeMainTab === 'users' ? (
              <WorldMap />
            ) : (
              <div className="p-4">Meetups content will go here</div> // Placeholder for Meetups
            )
          ) : (
            <LoginPrompt /> // Show login prompt if not logged in
          )
        )}
        {/* Removed extra closing brace */}
        {/* Conditionally render the location modal INSIDE the content div */}
        {showLocationModal && <LocationPermissionModal />}

        {/* AuthModalPortal is now rendered INSIDE the content div */}
        <AuthModalPortal />

      </div>
      <Footer /> {/* Add Footer back */}
      {/* AuthModalPortal removed from here */}
      {/* Modal rendering moved inside the content div */}
    </div>
  );
}

// Main App component now just sets up providers
function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <AppContent /> {/* Render the inner component */}
      </ModalProvider>
    </AuthProvider>
  );
}

export default App;
