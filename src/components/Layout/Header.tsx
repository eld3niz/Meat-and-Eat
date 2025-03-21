import { useEffect, useState } from 'react';

const Header = () => {
  const [currentPath, setCurrentPath] = useState('/');

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
      <div className="container mx-auto flex items-center justify-between">
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
        
        <nav className="flex space-x-8 text-sm">
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
        </nav>
      </div>
    </header>
  );
};

export default Header;
