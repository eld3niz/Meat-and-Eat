import React, { useEffect, useState, useRef, useCallback } from 'react'; // Import React
import { useModal } from '../../contexts/ModalContext';
import { useAuth } from '../../context/AuthContext';
import UserProfile from '../Auth/UserProfile';
import supabase from '../../utils/supabaseClient';
import MyOffersTab from '../meetups/MyOffersTab'; // Import the new tab component

const Header = () => {
  const [currentPath, setCurrentPath] = useState('/');
  const { openAuthModal } = useModal();
  const { user, signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [userName, setUserName] = useState<string | null>(null); // Store fetched name or null
  const [displayText, setDisplayText] = useState<string>(''); // Text to display/animate
  const [profileFetchStatus, setProfileFetchStatus] = useState<'idle' | 'loading' | 'delaying' | 'animating' | 'display' | 'fallback-delaying' | 'fallback-animating'>('idle');
  const menuRef = useRef<HTMLDivElement>(null);
  const profilePageRef = useRef<HTMLDivElement>(null);
  const meetsPopupRef = useRef<HTMLDivElement>(null); // Ref for Meets popup
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationDelayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationEndTimerRef = useRef<NodeJS.Timeout | null>(null);
  const userNameRef = useRef(userName); // Initialize ref at top level
  const [showMeetsPopup, setShowMeetsPopup] = useState(false); // State for Meets popup
  const [activeMeetsTab, setActiveMeetsTab] = useState<'chats' | 'meetAndEat' | 'activity' | 'offers'>('chats'); // State for active tab in Meets popup, added 'offers'

  useEffect(() => {
    // Aktuelle Pfad beim Laden und bei Navigation setzen
    setCurrentPath(window.location.pathname);
    
    const handleNavigation = () => {
      setCurrentPath(window.location.pathname);
    };
    
    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, []);

  // --- Animation and Fetch Logic ---

  const clearAllTimers = useCallback(() => {
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    if (animationDelayTimerRef.current) clearTimeout(animationDelayTimerRef.current);
    if (animationEndTimerRef.current) clearTimeout(animationEndTimerRef.current);
    fallbackTimerRef.current = null;
    animationDelayTimerRef.current = null;
    animationEndTimerRef.current = null;
  }, []);

  // Effect to handle profile fetching and animation state transitions
  useEffect(() => {
    // Update the ref's current value inside the effect
    userNameRef.current = userName;

    if (user?.id) {
      setProfileFetchStatus('loading');
      setUserName(null); // Reset userName on user change/login
      setDisplayText(''); // Clear display text
      clearAllTimers(); // Clear any previous timers

      // Start 5-second fallback timer
      fallbackTimerRef.current = setTimeout(() => {
        setUserName(null); // Ensure userName is null for fallback
        setProfileFetchStatus('fallback-delaying');
        // Start 2-second animation delay for fallback
        animationDelayTimerRef.current = setTimeout(() => {
          setDisplayText("Profile");
          setProfileFetchStatus('fallback-animating');
          // Start animation end timer
          animationEndTimerRef.current = setTimeout(() => {
            setProfileFetchStatus('display');
          }, 400); // Animation duration (changed from 900ms)
        }, 2000); // 2-second delay
      }, 5000); // 5-second fallback

      // Fetch profile
      const fetchUserProfile = async () => {
        let fetchedName: string | null = null;
        let fetchError = false;

        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', user.id);

          if (error) {
             console.error('Error fetching user profile:', error);
             fetchError = true;
          } else if (data && data.length > 0 && data[0]?.name) {
             fetchedName = data[0].name;
          } else {
             console.warn('Profile not found or name missing for user:', user.id);
          }
        } catch (err) {
           console.error('Unexpected error during profile fetch:', err);
           fetchError = true;
        }

        // If fetch completes *before* fallback timer:
        if (fallbackTimerRef.current) {
           clearTimeout(fallbackTimerRef.current);
           fallbackTimerRef.current = null;

           setUserName(fetchedName); // Store fetched name (or null if error/not found)
           const nextStatus = fetchedName ? 'delaying' : 'fallback-delaying';
           setProfileFetchStatus(nextStatus);

           // Start 2-second animation delay
           animationDelayTimerRef.current = setTimeout(() => {
             // Use the value from the state at the time the timeout fires
             setDisplayText(fetchedName || "Profile");
             setProfileFetchStatus(fetchedName ? 'animating' : 'fallback-animating');

             // Start animation end timer
             animationEndTimerRef.current = setTimeout(() => {
               setProfileFetchStatus('display');
             }, 400); // Animation duration (changed from 900ms)
           }, 2000); // 2-second delay
        }
        // If fallback timer already expired, do nothing here
      };

      fetchUserProfile();

    } else {
      // User logged out
      clearAllTimers();
      setProfileFetchStatus('idle');
      setUserName(null);
      setDisplayText('');
    }

    // Cleanup function
    return () => {
      clearAllTimers();
    };
    // Removed userName from dependency array to avoid re-triggering fetch on intermediate updates
  }, [user, clearAllTimers]);

  // --- End Animation Logic ---

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

  // Close Meets popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (meetsPopupRef.current &&
          !meetsPopupRef.current.contains(event.target as Node) &&
          showMeetsPopup) {
        setShowMeetsPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMeetsPopup]);

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
    // State resets are now handled by the useEffect hook when `user` becomes null
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

              {user && ( // Add Meets button only if user is logged in
                <button
                  onClick={() => setShowMeetsPopup(true)}
                  className="flex items-center hover:text-blue-100 transition-colors duration-200 font-medium px-3 py-1 rounded-md bg-white bg-opacity-10 hover:bg-opacity-20"
                >
                  <span role="img" aria-label="calendar" className="mr-1.5">📅</span>
                  Meets
                </button>
              )}

              {user ? (
                <div className="relative" ref={menuRef}>
                  {/* Profile Button with Animation */}
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    // Ensure button has fixed height and min-width to contain animation smoothly
                    className="relative flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-full transition-colors duration-200 min-w-[120px] h-[40px] overflow-hidden"
                  >
                    {/* Mover Div - This div translates */}
                    {/* Changed duration-900 to duration-400 */}
                    <div className={`absolute inset-0 flex items-center transition-transform duration-400 ease-in-out ${
                      // State: Loading/Delaying -> Center the plane (approximate)
                      (profileFetchStatus === 'loading' || profileFetchStatus === 'delaying' || profileFetchStatus === 'fallback-delaying') ? 'translate-x-[calc(50%-10px)]' :
                      // State: Animating/Display -> Center the text (plane moves left with it)
                      (profileFetchStatus === 'animating' || profileFetchStatus === 'fallback-animating' || profileFetchStatus === 'display') ? 'translate-x-0' :
                      'translate-x-[calc(50%-10px)]' // Default to centered plane
                    }`}>
                      {/* Plane Icon */}
                      <span className={`transition-opacity duration-500 ${
                        // Visible during loading/delaying, fades out during animation
                        (profileFetchStatus === 'loading' || profileFetchStatus === 'delaying' || profileFetchStatus === 'fallback-delaying') ? 'opacity-100' : 'opacity-0'
                      }`}>
                        ✈️
                      </span>

                      {/* Display Text */}
                      <span className={`ml-2 font-medium truncate max-w-[100px] whitespace-nowrap transition-opacity duration-500 delay-[400ms] ${ /* Delay fade-in */
                        // Fades in during animation/display
                        (profileFetchStatus === 'animating' || profileFetchStatus === 'fallback-animating' || profileFetchStatus === 'display') ? 'opacity-100' : 'opacity-0'
                      }`}>
                        {displayText}
                      </span>
                    </div>

                    {/* Dropdown Arrow - Positioned absolutely relative to the button */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
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

      {/* Meets Popup */}
      {showMeetsPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[1000] flex items-center justify-center overflow-y-auto"
             onClick={(e) => {
               // Close if clicking on the overlay itself
               if (e.target === e.currentTarget) {
                 setShowMeetsPopup(false);
               }
             }}>
         {/* Increased max-width from lg to 3xl */}
         {/* Increased max-width from 3xl to 5xl */}
         <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl max-w-5xl w-full max-h-[80vh] overflow-hidden p-6 shadow-2xl m-4"
              ref={meetsPopupRef}>
           {/* Close Button */}
           <button
              onClick={() => setShowMeetsPopup(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors z-10 p-1 rounded-full hover:bg-gray-200"
              aria-label="Close Meets popup"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Tab Slider */}
            <div className="mb-4 flex justify-center">
              {/* Adjusted width for 4 tabs */}
              <div className="relative w-96 bg-gray-200 rounded-full p-1"> {/* Increased width */}
                <div
                  // Adjusted width and transform for 4 tabs
                  className={`absolute top-1 left-1 w-[calc(25%-4px)] h-[calc(100%-8px)] bg-blue-500 rounded-full shadow-md transition-transform duration-300 ease-in-out ${ // Adjusted width
                    activeMeetsTab === 'chats' ? 'translate-x-0' :
                    activeMeetsTab === 'meetAndEat' ? 'translate-x-[100%]' :
                    activeMeetsTab === 'activity' ? 'translate-x-[200%]' :
                    'translate-x-[300%]' // Added offers position
                  }`}
                />
                <div className="relative flex justify-around items-center h-8">
                  <button
                    onClick={() => setActiveMeetsTab('chats')}
                    className={`w-1/4 text-center text-sm font-medium rounded-full z-10 transition-colors ${activeMeetsTab === 'chats' ? 'text-white' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    Chats
                  </button>
                  <button
                    onClick={() => setActiveMeetsTab('meetAndEat')}
                    className={`w-1/4 px-1 text-center text-sm font-medium rounded-full z-10 transition-colors ${activeMeetsTab === 'meetAndEat' ? 'text-white' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    Requests
                  </button>
                  <button
                    onClick={() => setActiveMeetsTab('activity')}
                    className={`w-1/4 text-center text-sm font-medium rounded-full z-10 transition-colors ${activeMeetsTab === 'activity' ? 'text-white' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    History
                  </button>
                  {/* Added Offers Tab Button */}
                  <button
                    onClick={() => setActiveMeetsTab('offers')}
                    className={`w-1/4 text-center text-sm font-medium rounded-full z-10 transition-colors ${activeMeetsTab === 'offers' ? 'text-white' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    Events
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Content Area */}
            <div className="overflow-y-auto h-[calc(80vh-120px)]"> {/* Adjust height as needed */}
              {activeMeetsTab === 'chats' && (
                <div className="p-4 text-center text-gray-700">
                  Content for Chats will go here.
                </div>
              )}
              {activeMeetsTab === 'meetAndEat' && ( // Renamed
                <div className="p-4 text-center text-gray-700">
                  Content for Meet and Eat will go here.
                </div>
              )}
              {activeMeetsTab === 'activity' && (
                <div className="p-4 text-center text-gray-700">
                  Content for Activity will go here.
               </div>
             )}
             {/* Added Offers Tab Content */}
             {activeMeetsTab === 'offers' && (
               // Render the MyOffersTab component directly
               <MyOffersTab />
             )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
