import { useEffect, useState, useRef } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { useAuth } from '../../context/AuthContext';
import UserProfile from '../Auth/UserProfile';
import supabase from '../../utils/supabaseClient';

const Header = () => {
  const [currentPath, setCurrentPath] = useState('/');
  const { openAuthModal } = useModal();
  const { user, signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [userName, setUserName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const profilePageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Aktuelle Pfad beim Laden und bei Navigation setzen
    setCurrentPath(window.location.pathname);
    
    const handleNavigation = () => {
      setCurrentPath(window.location.pathname);
    };
    
    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, []);

  // Fetch user profile data to get the name
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          // Remove .single() to avoid error if row doesn't exist yet
          const { data, error } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', user.id);
            // .single(); // Removed
          
          // Check for actual fetch errors (not just missing row)
          if (error) {
            console.error('Error fetching user profile:', error);
            setUserName(user.email?.split('@')[0] || ''); // Fallback on error
            return;
          }

          // Check if data array is not empty and has the name
          if (data && data.length > 0 && data[0]?.name) {
            setUserName(data[0].name);
          } else {
            // Profile might not exist yet, or name is null/empty
            console.warn('Profile not found or name missing for user:', user.id, 'Falling back to email.');
            setUserName(user.email?.split('@')[0] || ''); // Fallback
          }
        } catch (err) {
          console.error('Unexpected error during profile fetch:', err);
          setUserName(user.email?.split('@')[0] || ''); // Fallback on unexpected error
        }
      }
    };
    
    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    // Close the profile menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close profile page when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profilePageRef.current && 
          !profilePageRef.current.contains(event.target as Node) && 
          showProfilePage) {
        setShowProfilePage(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfilePage]);

  // Navigation-Handler
  const handleNavigation = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    
    // Manuelles Auslösen eines popstate-Events für die App
    const navigationEvent = new PopStateEvent('popstate');
    window.dispatchEvent(navigationEvent);
  };

  const handleLogout = async () => {
    await signOut();
    setShowProfileMenu(false);
    setShowProfilePage(false);
  };

  return (
    <>
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
                Home
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
              
              {user ? (
                <div className="relative" ref={menuRef}>
                  <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-full transition-all duration-200"
                  >
                    <span className="font-medium truncate max-w-[100px]">
                      {userName}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-[1000]">
                      <button
                        onClick={() => {
                          setShowProfilePage(true);
                          setShowProfileMenu(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Account
                      </button>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button 
                  className="group bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center space-x-2"
                  onClick={() => openAuthModal()}
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
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {showProfilePage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center overflow-y-auto"
             onClick={(e) => {
               if (e.target === e.currentTarget) {
                 setShowProfilePage(false);
               }
             }}>
          <div className="relative bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl"
               ref={profilePageRef}>
            <button 
              onClick={() => setShowProfilePage(false)} 
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <UserProfile />
          </div>
        </div>
      )}

    </>
  );
};

export default Header;
