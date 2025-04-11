import React, { useEffect, useState, useRef, useCallback } from 'react'; // Import React
import { useModal } from '../../contexts/ModalContext';
import { useAuth } from '../../context/AuthContext';
import UserProfile from '../Auth/UserProfile'; // Used for the main user account page
import ReadOnlyUserProfile from '../Profile/ReadOnlyUserProfile'; // Import for displaying sender profiles
import supabase from '../../utils/supabaseClient';
import MyOffersTab from '../meetups/MyOffersTab'; // Import the new tab component
import MeetupRequestRow from '../meetups/MeetupRequestRow'; // Import the request row component
import SimpleMapDisplay from '../UI/SimpleMapDisplay'; // Import the map display component
import { MeetupProposal } from '../../types/meetup'; // Import the proposal type
import { parseISO, format as formatDateFns, startOfDay, isSameDay, parse } from 'date-fns'; // Import date-fns helpers
import { useMemo } from 'react'; // Import useMemo
// Removed ChatLayout import
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
  const [activeMeetsTab, setActiveMeetsTab] = useState<'meetAndEat' | 'calendar' | 'offers'>('meetAndEat'); // State for active tab in Meets popup, renamed 'activity' to 'calendar'
  const [viewingSenderId, setViewingSenderId] = useState<string | null>(null); // State to show sender profile
  const [viewingLocation, setViewingLocation] = useState<{ lat: number; lng: number; name?: string } | null>(null); // State to show location map
  const [filterDate, setFilterDate] = useState<string>(''); // State for date filter (YYYY-MM-DD)
  const [filterTime, setFilterTime] = useState<string>(''); // State for time filter (HH:MM)
  const [userHomeLocation, setUserHomeLocation] = useState<{ lat: number; lng: number } | null>(null); // State for user's home location
  const [proposals, setProposals] = useState<MeetupProposal[]>([]); // State for fetched proposals
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const [proposalsError, setProposalsError] = useState<string | null>(null);

  // --- Dummy Data for Meetup Proposals (Requests) ---
  // --- End Dummy Data --- // Dummy data removed, will fetch real data

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
            // Fetch name and home location
            .select('name, home_latitude, home_longitude')
            .eq('id', user.id);

          if (error) {
             console.error('Error fetching user profile:', error);
             fetchError = true;
          } else if (data && data.length > 0 && data[0]?.name) {
             fetchedName = data[0].name;
             // Store home location if available
             if (data[0].home_latitude && data[0].home_longitude) {
               setUserHomeLocation({ lat: data[0].home_latitude, lng: data[0].home_longitude });
             } else {
               setUserHomeLocation(null); // Reset if not found
             }
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
      setUserHomeLocation(null); // Reset home location on logout
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

  // --- Fetch Pending Proposals ---
  // Renamed: fetchRelevantProposals to reflect broader scope
  const fetchRelevantProposals = useCallback(async () => {
    if (!user?.id) {
      setProposals([]); // Clear proposals if user logs out
      return;
    }

    setIsLoadingProposals(true);
    setProposalsError(null);

    try {
      const { data, error } = await supabase
        .from('meetup_proposals')
        .select(`
          *,
          profiles!sender_id ( name, avatar_url ),
          sender_confirmed,
          recipient_confirmed
        `)
        // Fetch if user is recipient OR sender
        .or(`recipient_id.eq.${user.id},sender_id.eq.${user.id}`)
        // Fetch relevant statuses for the popup
        .in('status', ['pending', 'awaiting_final_confirmation', 'expired']);

      if (error) {
        throw error;
      }

      // Ensure profiles data is at least null if join fails unexpectedly
      const formattedData = data?.map(p => ({
          ...p,
          profiles: p.profiles || null
      })) || [];

      setProposals(formattedData as MeetupProposal[]); // Cast needed because Supabase type might not perfectly match

    } catch (error: any) {
      console.error("Error fetching proposals:", error);
      setProposalsError(`Failed to load requests: ${error.message}`);
      setProposals([]); // Clear proposals on error
    } finally {
      setIsLoadingProposals(false);
    }
  }, [user?.id]); // Dependency on user ID

  // Fetch proposals when the popup is shown or user changes
  useEffect(() => {
    if (showMeetsPopup && user?.id) {
      fetchRelevantProposals(); // Use renamed function
    }
    // Clear proposals when popup closes to ensure fresh data next time
    if (!showMeetsPopup) {
       setProposals([]);
       setProposalsError(null);
       setIsLoadingProposals(false);
    }
  }, [showMeetsPopup, user?.id, fetchRelevantProposals]); // Use renamed function

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

  // --- Helper Function for Distance Calculation (Haversine) ---
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  };

  // --- Handle Proposal Status Update ---
  // Renamed: handleUpdateProposalStatus -> handleDecline (Accept logic changes)
  const handleDecline = async (proposalId: string) => {
    if (!user) return; // Should not happen if buttons are visible, but safety check

    try {
      const { error } = await supabase
        .from('meetup_proposals')
        .update({ status: 'declined' }) // Explicitly set declined
        .eq('id', proposalId)
        .eq('recipient_id', user.id); // Ensure user is the recipient (matches RLS)

      if (error) {
        throw error;
      }

      // Refresh the proposals list after successful update
      await fetchRelevantProposals(); // Use renamed function

    } catch (error: any) {
      console.error(`Error declining proposal ${proposalId}:`, error);
      // Re-throw the error so the row component can display a message
      throw new Error(`Failed to decline: ${error.message}`);
    }
  };

  // --- New Handlers for Two-Step Confirmation ---

  const handleInitialAccept = async (proposalId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('meetup_proposals')
        .update({ status: 'awaiting_final_confirmation' })
        .eq('id', proposalId)
        .eq('recipient_id', user.id) // Ensure user is the recipient
        .eq('status', 'pending'); // Can only accept if pending

      if (error) throw error;
      await fetchRelevantProposals(); // Refresh list
    } catch (error: any) {
      console.error(`Error initially accepting proposal ${proposalId}:`, error);
      // Propagate error to potentially show in UI
      throw new Error(`Failed to accept: ${error.message}`);
    }
  };

  const handleFinalConfirm = async (proposalId: string, senderId: string, recipientId: string) => {
    if (!user) return;
    const isSender = user.id === senderId;
    const confirmationField = isSender ? 'sender_confirmed' : 'recipient_confirmed';

    try {
      // Step 1: Set the user's confirmation flag
      const { error: updateConfirmError } = await supabase
        .from('meetup_proposals')
        .update({ [confirmationField]: true })
        .eq('id', proposalId)
        .eq('status', 'awaiting_final_confirmation') // Can only confirm if awaiting
        .eq(isSender ? 'sender_id' : 'recipient_id', user.id); // Match user role

      if (updateConfirmError) throw updateConfirmError;

      // Step 2: Check if both are now confirmed and update status to finalized
      // We use an RPC function for atomicity (recommended) or check client-side (simpler for now)

      // Client-side check (less robust than RPC but simpler):
      const { data: checkData, error: checkError } = await supabase
        .from('meetup_proposals')
        .select('sender_confirmed, recipient_confirmed')
        .eq('id', proposalId)
        .single();

      if (checkError) throw checkError;

      if (checkData?.sender_confirmed && checkData?.recipient_confirmed) {
        const { error: finalizeError } = await supabase
          .from('meetup_proposals')
          .update({ status: 'finalized' })
          .eq('id', proposalId)
          .eq('status', 'awaiting_final_confirmation'); // Ensure it wasn't cancelled meanwhile

         if (finalizeError) throw finalizeError;
      }

      await fetchRelevantProposals(); // Refresh list
    } catch (error: any) {
      console.error(`Error finalizing confirmation for proposal ${proposalId}:`, error);
      throw new Error(`Failed to confirm: ${error.message}`);
    }
  };

  const handleCancel = async (proposalId: string) => {
    if (!user) return;
    try {
      // Allow cancellation if pending or awaiting final confirmation
      const { error } = await supabase
        .from('meetup_proposals')
        .update({ status: 'cancelled' })
        .eq('id', proposalId)
        .in('status', ['pending', 'awaiting_final_confirmation'])
        // Check if user is sender OR recipient (either can cancel)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);


      if (error) throw error;
      await fetchRelevantProposals(); // Refresh list
    } catch (error: any) {
      console.error(`Error cancelling proposal ${proposalId}:`, error);
      throw new Error(`Failed to cancel: ${error.message}`);
    }
  };

  // --- End New Handlers ---

  // --- Filtered and Sorted Proposals ---
  const filteredAndSortedProposals = useMemo(() => {
    // Use fetched proposals state instead of dummy data
    // Rename local variable to avoid shadowing state variable
    let filteredProposals: MeetupProposal[] = [...proposals]; // Start with a copy from state

    // 1. Filter by Date
    if (filterDate) {
      const selectedDate = startOfDay(parseISO(filterDate)); // Get start of selected day
      // Add type annotation for 'p'
      filteredProposals = filteredProposals.filter((p: MeetupProposal) => {
        const proposalDate = startOfDay(parseISO(p.meetup_time)); // Use correct property name
        return isSameDay(proposalDate, selectedDate);
      });
    }

    // 2. Filter by Time (only if date is also selected)
    if (filterDate && filterTime) {
       try {
           // Combine selected date and filter time to create a reference Date object
           const referenceDateTime = parse(`${filterDate} ${filterTime}`, 'yyyy-MM-dd HH:mm', new Date());

           // Add type annotation for 'p'
           filteredProposals = filteredProposals.filter((p: MeetupProposal) => {
               const proposalDateTime = parseISO(p.meetup_time); // Use correct property name
               // Keep proposal if its time is on or after the filter time on the selected date
               return proposalDateTime >= referenceDateTime;
           });
       } catch (e) {
            console.error("Error parsing date/time for filtering:", e);
            // Optionally handle the error, e.g., show all times for the date
       }
    }

    // 3. Sort by Meetup Time (Ascending)
    // Add type annotations for 'a' and 'b' and use correct property name
    filteredProposals.sort((a: MeetupProposal, b: MeetupProposal) => new Date(a.meetup_time).getTime() - new Date(b.meetup_time).getTime());

    return filteredProposals; // Return the renamed local variable
    // Update dependency array for useMemo
  }, [proposals, filterDate, filterTime]); // Recalculate when fetched proposals or filters change

  // --- Categorized Proposals ---
  const incomingRequests = useMemo(() => {
    // Filter for pending proposals where the current user is the recipient
    return proposals.filter(p => p.status === 'pending' && p.recipient_id === user?.id)
      // Sort by meetup time ascending
      .sort((a, b) => new Date(a.meetup_time).getTime() - new Date(b.meetup_time).getTime());
  }, [proposals, user?.id]);

  const pendingConfirmation = useMemo(() => {
    // Filter for proposals awaiting final confirmation involving the current user
    return proposals.filter(p => p.status === 'awaiting_final_confirmation' && (p.recipient_id === user?.id || p.sender_id === user?.id))
      // Sort by meetup time ascending
      .sort((a, b) => new Date(a.meetup_time).getTime() - new Date(b.meetup_time).getTime());
  }, [proposals, user?.id]);

  const expiredProposals = useMemo(() => {
    // Filter for expired proposals involving the current user
    return proposals.filter(p => p.status === 'expired' && (p.recipient_id === user?.id || p.sender_id === user?.id))
      // Sort by meetup time ascending
      .sort((a, b) => new Date(a.meetup_time).getTime() - new Date(b.meetup_time).getTime());
  }, [proposals, user?.id]);

  // TODO: Decide if/how date/time filters from lines 682-708 apply to these categories.
  // The original filteredAndSortedProposals is currently unused in the refactored rendering below.


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

              {user && ( // Add Meets button and History link only if user is logged in
                <> {/* Wrap adjacent elements in a fragment */}
                  <button
                    onClick={() => setShowMeetsPopup(true)}
                    className="flex items-center hover:text-blue-100 transition-colors duration-200 font-medium px-3 py-1 rounded-md bg-white bg-opacity-10 hover:bg-opacity-20"
                  >
                    <span role="img" aria-label="calendar" className="mr-1.5">📅</span>
                    Meets ({incomingRequests.length + pendingConfirmation.length}) {/* Show count of actionable items */}
                  </button>
                  {/* Added History Link */}
                  <a
                    href="/history"
                    onClick={(e) => handleNavigation('/history', e)}
                    className={`hover:text-blue-100 transition-colors duration-200 font-medium ${
                      currentPath === '/history' ? 'border-b-2 border-white pb-1' : ''
                    }`}
                  >
                    History
                  </a>
                </>
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
              <div className="relative w-72 bg-gray-200 rounded-full p-1"> {/* Adjusted width for 3 tabs */}
                <div
                  // Adjusted width and transform for 4 tabs
                  className={`absolute top-1 left-1 w-[calc(33.33%-4px)] h-[calc(100%-8px)] bg-blue-500 rounded-full shadow-md transition-transform duration-300 ease-in-out ${ // Adjusted width for 3 tabs
                    activeMeetsTab === 'meetAndEat' ? 'translate-x-0' :
                    activeMeetsTab === 'calendar' ? 'translate-x-[100%]' :
                    'translate-x-[200%]' // Adjusted offers position
                  }`}
                />
                <div className="relative flex justify-around items-center h-8">
                  {/* Removed Chats Button */}
                  <button
                    onClick={() => setActiveMeetsTab('meetAndEat')}
                    className={`w-1/3 px-1 text-center text-sm font-medium rounded-full z-10 transition-colors ${activeMeetsTab === 'meetAndEat' ? 'text-white' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    Requests
                  </button>
                  <button
                    onClick={() => setActiveMeetsTab('calendar')}
                    className={`w-1/3 text-center text-sm font-medium rounded-full z-10 transition-colors ${activeMeetsTab === 'calendar' ? 'text-white' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    Calendar
                  </button>
                  {/* Added Offers Tab Button */}
                  <button
                    onClick={() => setActiveMeetsTab('offers')}
                    className={`w-1/3 text-center text-sm font-medium rounded-full z-10 transition-colors ${activeMeetsTab === 'offers' ? 'text-white' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    Events
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Content Area */}
            <div className="overflow-y-auto h-[calc(80vh-120px)]"> {/* Adjust height as needed */}
              {/* Removed Chats Tab Content */}
              {activeMeetsTab === 'meetAndEat' && ( // Renamed to Requests Tab
                <div>
                  {/* Filter Controls */}
                  <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center gap-4">
                     <div className="flex items-center gap-2">
                        <label htmlFor="filterDate" className="text-xs font-medium text-gray-600">Date:</label>
                        <input
                          type="date"
                          id="filterDate"
                          value={filterDate}
                          onChange={(e) => setFilterDate(e.target.value)}
                          className="p-1 border border-gray-300 rounded text-xs focus:ring-blue-500 focus:border-blue-500"
                        />
                     </div>
                      <div className="flex items-center gap-2">
                        <label htmlFor="filterTime" className="text-xs font-medium text-gray-600">From Time:</label>
                        <input
                          type="time"
                          id="filterTime"
                          value={filterTime}
                          onChange={(e) => setFilterTime(e.target.value)}
                          className="p-1 border border-gray-300 rounded text-xs focus:ring-blue-500 focus:border-blue-500"
                          disabled={!filterDate} // Disable time if no date is selected
                        />
                     </div>
                     <button
                        onClick={() => { setFilterDate(''); setFilterTime(''); }}
                        className="px-2 py-1 text-xs text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
                        title="Clear Filters"
                     >
                        Clear
                     </button>
                  </div>

                  {/* Proposal List Area */}
                  <div className="mt-2">
                    {isLoadingProposals ? (
                      <p className="p-4 text-center text-gray-500">Loading...</p>
                    ) : proposalsError ? (
                      <p className="p-4 text-center text-red-600">{proposalsError}</p>
                    ) : (
                      <>
                        {/* --- Incoming Requests Section --- */}
                        <h3 className="text-sm font-semibold text-gray-600 px-3 pt-3 pb-1 border-b border-gray-200 bg-gray-100 sticky top-0 z-10">
                          Incoming Requests ({incomingRequests.length})
                        </h3>
                        {incomingRequests.length === 0 ? (
                          <p className="p-4 text-center text-gray-500 text-sm">No new meetup requests.</p>
                        ) : (
                          <div className="space-y-0">
                            {incomingRequests.map((proposal) => {
                              const distance = userHomeLocation ? calculateDistance(userHomeLocation.lat, userHomeLocation.lng, proposal.latitude, proposal.longitude) : undefined;
                              return (
                                <MeetupRequestRow
                                  key={`${proposal.id}-incoming`}
                                  proposal={proposal}
                                  onViewProfile={setViewingSenderId}
                                  onViewLocation={setViewingLocation}
                                  distanceKm={distance}
                                  // Pass NEW handlers for this state
                                  onInitialAccept={handleInitialAccept}
                                  onDecline={handleDecline}
                                  // Remove old/unused handlers
                                  // onUpdateProposalStatus - removed
                                />
                              );
                            })}
                          </div>
                        )}

                        {/* --- Pending Confirmation Section --- */}
                        <h3 className="text-sm font-semibold text-gray-600 px-3 pt-3 pb-1 border-t border-b border-gray-200 bg-gray-100 sticky top-0 z-10 mt-4">
                          Pending Final Confirmation ({pendingConfirmation.length})
                        </h3>
                        {pendingConfirmation.length === 0 ? (
                          <p className="p-4 text-center text-gray-500 text-sm">No meetups awaiting final confirmation.</p>
                        ) : (
                          <div className="space-y-0">
                            {pendingConfirmation.map((proposal) => {
                              const distance = userHomeLocation ? calculateDistance(userHomeLocation.lat, userHomeLocation.lng, proposal.latitude, proposal.longitude) : undefined;
                              return (
                                <MeetupRequestRow
                                  key={`${proposal.id}-pending`}
                                  proposal={proposal}
                                  onViewProfile={setViewingSenderId}
                                  onViewLocation={setViewingLocation}
                                  distanceKm={distance}
                                  // Pass NEW handlers for this state
                                  onFinalConfirm={handleFinalConfirm}
                                  onCancel={handleCancel}
                                   // Remove old/unused handlers
                                  // onUpdateProposalStatus - removed
                                />
                              );
                            })}
                          </div>
                        )}

                        {/* --- Expired Section (Optional Display) --- */}
                        {expiredProposals.length > 0 && (
                           <>
                              <h3 className="text-sm font-semibold text-gray-500 px-3 pt-3 pb-1 border-t border-b border-gray-200 bg-gray-100 sticky top-0 z-10 mt-4">
                                Expired / Past ({expiredProposals.length})
                              </h3>
                              <div className="space-y-0 opacity-70">
                                {expiredProposals.map((proposal) => {
                                  const distance = userHomeLocation ? calculateDistance(userHomeLocation.lat, userHomeLocation.lng, proposal.latitude, proposal.longitude) : undefined;
                                  return (
                                    <MeetupRequestRow
                                      key={`${proposal.id}-expired`}
                                      proposal={proposal}
                                      onViewProfile={setViewingSenderId}
                                      onViewLocation={setViewingLocation}
                                      distanceKm={distance}
                                      // No action handlers needed for expired items (handled in MeetupRequestRow)
                                    />
                                  );
                                })}
                              </div>
                           </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
              {activeMeetsTab === 'calendar' && (
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

      {/* Conditionally rendered popups for Requests Tab */}
      {viewingSenderId && (
        <ReadOnlyUserProfile
          userId={viewingSenderId}
          onClose={() => setViewingSenderId(null)}
          // travelStatus can be fetched or passed if needed later
        />
      )}

      {viewingLocation && (
        <SimpleMapDisplay
          latitude={viewingLocation.lat}
          longitude={viewingLocation.lng}
          placeName={viewingLocation.name}
          isOpen={!!viewingLocation}
          onClose={() => setViewingLocation(null)}
        />
      )}
    </>
  );
};

export default Header;
