import { useEffect, useState } from 'react';
import { useModal } from '../../contexts/ModalContext';

const Header = () => {
  const [currentPath, setCurrentPath] = useState('/');
  const { openAuthModal } = useModal();

  useEffect(() => {
    // Aktuelle Pfad beim Laden und bei Navigation setzen
    setCurrentPath(window.location.pathname);
    
    const handleNavigation = () => {
      setCurrentPath(window.location.pathname);
    };
    
    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, []);

  // Navigation-Handler
  const handleNavigation = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    
    // Manuelles Auslösen eines popstate-Events für die App
    const navigationEvent = new PopStateEvent('popstate');
    window.dispatchEvent(navigationEvent);
  };

  return (
    <header className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-3 shadow-md">
      <div className="container mx-auto flex items-center justify-start space-x-4">
        <h1 className="text-xl md:text-2xl font-bold flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <a 
            href="/" 
            onClick={(e) => handleNavigation('/', e)}
            className="hover:text-blue-100 transition-colors duration-200"
          >
            Meet and Eat
          </a>
        </h1>
        
        <div className="flex space-x-4 text-sm justify-end flex-1 items-center">
          <nav className="flex space-x-4 text-sm items-center">
            <a 
              href="/about" 
              onClick={(e) => handleNavigation('/about', e)}
              className={`hover:text-blue-100 transition-colors duration-200 font-medium ${
                currentPath === '/about' ? 'border-b-2 border-white pb-1' : ''
              }`}
            >
              About
            </a>
            <a 
              href="/" 
              onClick={(e) => handleNavigation('/', e)}
              className={`hover:text-blue-100 transition-colors duration-200 font-medium ${
                currentPath === '/' || currentPath === '/map' ? 'border-b-2 border-white pb-1' : ''
              }`}
            >
              Map
            </a>
            <a 
              href="/3dworld" 
              onClick={(e) => handleNavigation('/3dworld', e)}
              className={`flex items-center hover:text-blue-100 transition-colors duration-200 font-medium ${
                currentPath === '/3dworld' ? 'border-b-2 border-white pb-1' : ''
              }`}
            >
              <span className="mr-1">3D World</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </a>
            <a 
              href="/hybridmap" 
              onClick={(e) => handleNavigation('/hybridmap', e)}
              className={`flex items-center hover:text-blue-100 transition-colors duration-200 font-medium ${
                currentPath === '/hybridmap' ? 'border-b-2 border-white pb-1' : ''
              }`}
            >
              <span className="mr-1">Hybrid Map</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </a>
            <button 
              className="group bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center space-x-2"
              onClick={openAuthModal}
            >
              <span className="tracking-wide text-base font-sans group-hover:tracking-wider transition-all duration-300">
                Start Eating!
              </span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 transform group-hover:rotate-12 transition-transform duration-300" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
