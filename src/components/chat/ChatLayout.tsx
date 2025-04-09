import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../utils/supabaseClient';
import { User, Profile } from '../../types/supabaseTypes'; // Re-corrected path

// Define interfaces for chat data
// Define only the fields needed for displaying participants in the chat context
interface ChatParticipant {
  id: string;
  name: string;
  avatar_url?: string | null;
}

interface Chat {
  id: string;
  participant1_id: string;
  participant2_id: string;
  created_at: string;
  updated_at: string;
  other_participant: ChatParticipant | null; // Store the profile of the *other* user in the chat
  last_message?: { // Optional: To show last message snippet later
    content: string | null;
    created_at: string;
    sender_id: string;
  }
}

interface Message {
    id: string;
    chat_id: string;
    sender_id: string;
    message_type: 'text' | 'form' | 'map_marker';
    content: string | null;
    form_data: any | null; // Adjust type as needed
    map_latitude: number | null;
    map_longitude: number | null;
    map_marker_label: string | null;
    created_at: string;
    is_read: boolean;
    sender?: ChatParticipant; // Optional: To display sender info easily
}


const ChatLayout: React.FC = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [isBlockedByCurrentUser, setIsBlockedByCurrentUser] = useState(false); // Track if current user blocked the selected one
  const [isCurrentUserBlocked, setIsCurrentUserBlocked] = useState(false); // Track if selected user blocked the current one
  const optionsMenuRef = useRef<HTMLDivElement>(null); // Ref for closing dropdown on outside click

  // Fetch chats for the current user
  const fetchChats = useCallback(async () => {
    if (!user) return;
    setIsLoadingChats(true);
    setError(null);

    try {
      // Fetch chats where the user is participant1 or participant2
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select(`
          id,
          participant1_id,
          participant2_id,
          created_at,
          updated_at
        `)
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order('updated_at', { ascending: false }); // Show most recent chats first

      if (chatError) throw chatError;
      if (!chatData) {
        setChats([]);
        setIsLoadingChats(false);
        return;
      }

      // Get IDs of all other participants
      const participantIds = chatData
        .map(chat => chat.participant1_id === user.id ? chat.participant2_id : chat.participant1_id)
        .filter((id, index, self) => self.indexOf(id) === index); // Unique IDs

      if (participantIds.length === 0) {
        setChats([]);
        setIsLoadingChats(false);
        return;
      }

      // Fetch profiles of the other participants
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url') // Add other fields if needed
        .in('id', participantIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

      // Combine chat data with participant profiles
      const enrichedChats: Chat[] = chatData.map(chat => {
        const otherParticipantId = chat.participant1_id === user.id ? chat.participant2_id : chat.participant1_id;
        const otherParticipantProfile = profilesMap.get(otherParticipantId) || null;
        return {
          ...chat,
          other_participant: otherParticipantProfile,
        };
      });

      // TODO: Fetch last message for each chat (optional optimization)

      setChats(enrichedChats);

    } catch (err: any) {
      console.error("Error fetching chats:", err);
      setError(`Failed to load chats: ${err.message}`);
      setChats([]);
    } finally {
      setIsLoadingChats(false);
    }
  }, [user]);

  // Fetch messages for the selected chat
  const fetchMessages = useCallback(async (chatId: string) => {
    if (!chatId) return;
    setIsLoadingMessages(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
            *,
            sender:sender_id ( id, name, avatar_url )
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true }); // Oldest first

      if (error) throw error;
      setMessages(data || []);

    } catch (err: any) {
      console.error("Error fetching messages:", err);
      setError(`Failed to load messages: ${err.message}`);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []); // Empty dependency array means this runs once on mount

  // Initial fetch of chats
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Fetch messages when a chat is selected
  useEffect(() => {
    let messageSubscription: ReturnType<typeof supabase.channel> | null = null;

    if (selectedChat?.id) {
      const currentChatId = selectedChat.id; // Capture id in a variable
      fetchMessages(currentChatId);

      // --- Subscription Setup ---
      messageSubscription = supabase
        .channel(`public:messages:chat_id=eq.${currentChatId}`) // Use captured variable
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${currentChatId}` }, // Use captured variable
          async (payload) => {
            // console.log('New message received:', payload.new);
            const newMessage = payload.new as Message;

            // Fetch sender profile only if it's not the current user
            if (newMessage.sender_id !== user?.id) {
                try {
                    const { data: senderData, error: senderError } = await supabase
                        .from('profiles')
                        .select('id, name, avatar_url')
                        .eq('id', newMessage.sender_id)
                        .single();

                    if (senderError) throw senderError;
                    newMessage.sender = senderData || undefined; // Attach sender profile

                } catch (senderError: any) {
                     console.error("Error fetching sender profile for new message:", senderError);
                     // Proceed without sender info if fetch fails
                }
            } else {
                 // Optionally add self as sender if needed elsewhere
                 // newMessage.sender = { id: user.id, name: 'You', avatar_url: userProfile?.avatar_url };
            }

            setMessages((currentMessages) => {
               // Avoid adding duplicate messages if subscription fires multiple times quickly
               if (currentMessages.some(msg => msg.id === newMessage.id)) {
                   return currentMessages;
               }
               return [...currentMessages, newMessage];
            });
            // TODO: Implement logic to mark message as read if chat window is active
          }
        )
        .subscribe((status, err) => {
           if (status === 'SUBSCRIBED') {
               // console.log(`Subscribed to messages for chat ${currentChatId}`);
           }
           if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
               console.error(`Subscription error/closed for chat ${currentChatId}:`, status, err);
               // Avoid flooding with errors, maybe show a subtle indicator
               // setError(`Real-time connection issue: ${err?.message || status}. Try refreshing.`);
           }
        });
      // --- End Subscription Setup ---

    } else {
      setMessages([]); // Clear messages if no chat is selected
    }

    // --- Cleanup Function ---
    return () => {
      if (messageSubscription) {
        // console.log(`Unsubscribing from messages`);
        supabase.removeChannel(messageSubscription)
           .catch(err => console.error("Error removing channel:", err)); // Add error handling for removal
        messageSubscription = null;
      }
    };
    // --- End Cleanup Function ---

  }, [selectedChat, fetchMessages, user?.id]); // Keep dependencies

  // Check block status when chat changes
  useEffect(() => {
    const checkBlockStatus = async () => {
      if (!user || !selectedChat?.other_participant?.id) {
        setIsBlockedByCurrentUser(false);
        setIsCurrentUserBlocked(false);
        return;
      }

      const otherUserId = selectedChat.other_participant.id;

      // Check if current user blocked the other user
      const { data: blockData, error: blockError } = await supabase
        .from('user_blocks')
        .select('blocker_id')
        .eq('blocker_id', user.id)
        .eq('blocked_id', otherUserId)
        .maybeSingle(); // Use maybeSingle to handle 0 or 1 result

      if (blockError) {
        console.error("Error checking block status (current blocks other):", blockError);
      } else {
        setIsBlockedByCurrentUser(!!blockData); // True if a record exists
      }

      // Check if the other user blocked the current user (using the function)
      // Note: This relies on the RLS allowing the function to check, which it should with SECURITY DEFINER
      const { data: isBlockedData, error: isBlockedError } = await supabase.rpc('is_blocked', {
          p_blocker_id: otherUserId,
          p_blocked_id: user.id
      });

      if (isBlockedError) {
          console.error("Error checking block status (other blocks current):", isBlockedError);
      } else {
          setIsCurrentUserBlocked(isBlockedData ?? false); // True if the function returns true
      }
    };

    checkBlockStatus();
    setShowOptionsDropdown(false); // Hide dropdown on chat switch

  }, [selectedChat, user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setShowOptionsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectChat = (chat: Chat) => {
    if (selectedChat?.id !== chat.id) { // Only update if it's a different chat
       setSelectedChat(chat);
       setError(null); // Clear previous errors on chat switch
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !user) return;

    // TODO: Check block status before sending

    const messageContent = newMessage;
    setNewMessage(''); // Clear input immediately

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: selectedChat.id,
          sender_id: user.id,
          message_type: 'text',
          content: messageContent,
        });

      if (error) throw error;
      // Message will appear via real-time subscription, or manually refetch/append if needed
      // console.log("Message sent");

      // Also update the chat's updated_at timestamp
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedChat.id);

    } catch (err: any) {
      console.error("Error sending message:", err);
      setError(`Failed to send message: ${err.message}`);
      // Optionally restore the input field content
      setNewMessage(messageContent);
    }
  };

  const handleBlockToggle = async () => {
      if (!user || !selectedChat?.other_participant?.id) return;

      const otherUserId = selectedChat.other_participant.id;
      setShowOptionsDropdown(false); // Close menu

      if (isBlockedByCurrentUser) {
          // --- Unblock User ---
          console.log(`Attempting to unblock user: ${otherUserId}`);
          const { error } = await supabase
              .from('user_blocks')
              .delete()
              .eq('blocker_id', user.id)
              .eq('blocked_id', otherUserId);

          if (error) {
              console.error("Error unblocking user:", error);
              setError(`Failed to unblock user: ${error.message}`);
          } else {
              console.log(`User ${otherUserId} unblocked successfully.`);
              setIsBlockedByCurrentUser(false);
              setError(null); // Clear any previous error
          }
      } else {
          // --- Block User ---
          console.log(`Attempting to block user: ${otherUserId}`);
          const { error } = await supabase
              .from('user_blocks')
              .insert({
                  blocker_id: user.id,
                  blocked_id: otherUserId,
              });

          if (error) {
              console.error("Error blocking user:", error);
              setError(`Failed to block user: ${error.message}`);
          } else {
              console.log(`User ${otherUserId} blocked successfully.`);
              setIsBlockedByCurrentUser(true);
              setError(null); // Clear any previous error
          }
      }
  };

  const handleReportUser = async () => {
      if (!user || !selectedChat?.other_participant?.id) return;
      const otherUserId = selectedChat.other_participant.id;
      setShowOptionsDropdown(false); // Close menu

      // TODO: Implement a proper reporting modal/dialog to get the reason
      const reason = prompt(`Please provide a reason for reporting ${selectedChat.other_participant.name || 'this user'}:`);

      if (reason && reason.trim()) {
          console.log(`Attempting to report user: ${otherUserId} for reason: ${reason}`);
          const { error } = await supabase
              .from('user_reports')
              .insert({
                  reporter_id: user.id,
                  reported_id: otherUserId,
                  reason: reason.trim(),
                  chat_id: selectedChat.id, // Link the report to the chat
              });

          if (error) {
              console.error("Error reporting user:", error);
              setError(`Failed to report user: ${error.message}`);
          } else {
              console.log(`User ${otherUserId} reported successfully.`);
              alert('Report submitted successfully.'); // Simple feedback for now
              setError(null);
          }
      } else {
          console.log("Report cancelled or reason not provided.");
      }
  };

  // --- Render Logic ---

  const renderChatList = () => {
    if (isLoadingChats) {
      return <div className="p-4 text-center text-gray-500">Loading chats...</div>;
    }
    if (error && chats.length === 0) {
        return <div className="p-4 text-center text-red-500">{error}</div>;
    }
    if (chats.length === 0) {
      return <div className="p-4 text-center text-gray-500">No active chats.</div>;
    }

    return (
      <ul className="space-y-1 overflow-y-auto">
        {chats.map((chat) => (
          <li key={chat.id}>
            <button
              onClick={() => handleSelectChat(chat)}
              className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 transition-colors duration-150 ${
                selectedChat?.id === chat.id ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
            >
              {/* Placeholder for Avatar */}
              <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0">
                {/* TODO: Add <img src={chat.other_participant?.avatar_url} /> */}
              </div>
              <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-sm text-gray-800 truncate">
                  {chat.other_participant?.name || 'Unknown User'}
                </p>
                {/* TODO: Add last message preview */}
                {/* <p className="text-xs text-gray-500 truncate">Last message preview...</p> */}
              </div>
              {/* TODO: Add unread count/indicator */}
            </button>
          </li>
        ))}
      </ul>
    );
  };

  const renderMessages = () => {
    if (!selectedChat) {
      return <div className="flex-grow flex items-center justify-center text-gray-400">Select a chat to view messages.</div>;
    }
    if (isLoadingMessages) {
      return <div className="flex-grow flex items-center justify-center text-gray-400">Loading messages...</div>;
    }
     if (error && messages.length === 0) {
        return <div className="flex-grow flex items-center justify-center text-red-500">{error}</div>;
    }
    if (messages.length === 0) {
      return <div className="flex-grow flex items-center justify-center text-gray-400">No messages yet. Start the conversation!</div>;
    }

    return (
      <div className="flex-grow space-y-4 p-4 overflow-y-auto">
        {/* Rewriting the map block for clarity */}
        {messages.map((msg) => {
          // Explicit return for the map callback
          return (
            <div // Outer message row div
              key={msg.id}
              className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div // Inner message bubble div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                  msg.sender_id === user?.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {/* Message Content */}
                <p className="text-sm">{msg.content}</p>
                {/* Timestamp */}
                <p className="text-xs opacity-70 mt-1 text-right">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div> {/* End inner message bubble div */}
            </div> // End outer message row div
          ); // End return statement for map callback
        })} {/* End of messages.map() call */}
         {/* TODO: Add scroll anchor for new messages (e.g., useRef and scrollIntoView) */}
      </div>
    );
  };

  const renderActiveChatHeader = () => {
    if (!selectedChat) return null;

    return (
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-3">
          {/* Placeholder for Avatar */}
          <div className="w-8 h-8 rounded-full bg-gray-300">
            {/* TODO: Add <img src={selectedChat.other_participant?.avatar_url} /> */}
          </div>
          <span className="font-semibold text-gray-700">
            {selectedChat.other_participant?.name || 'Unknown User'}
          </span>
        </div>
        {/* TODO: Add dropdown menu for Block/Report */}
        {/* Dropdown Menu for Block/Report */}
        <div className="relative" ref={optionsMenuRef}>
           <button
               onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
               className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
               aria-label="Chat options"
               aria-haspopup="true"
               aria-expanded={showOptionsDropdown}
           >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
               <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
               </svg>
           </button>

           {/* Dropdown Content */}
           {showOptionsDropdown && (
               <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
                   <button
                       onClick={handleBlockToggle}
                       className={`block w-full text-left px-4 py-2 text-sm ${
                           isBlockedByCurrentUser
                           ? 'text-green-700 hover:bg-green-50'
                           : 'text-red-700 hover:bg-red-50'
                       }`}
                   >
                       {isBlockedByCurrentUser ? 'Unblock User' : 'Block User'}
                   </button>
                   <button
                       onClick={handleReportUser}
                       className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700"
                   >
                       Report User
                   </button>
               </div>
           )}
        </div>
      </div>
    );
  };

  const renderMessageInput = () => {
    if (!selectedChat) return null;

    // Disable input if either user has blocked the other
    const isChatBlocked = isBlockedByCurrentUser || isCurrentUserBlocked;

    return (
      <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className={`flex-grow px-3 py-2 border rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm ${
              isChatBlocked ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
            }`}
           disabled={isChatBlocked}
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 transition-colors disabled:opacity-50"
            disabled={!newMessage.trim() || isChatBlocked}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-45" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 16.571V11.69l4.768 1.061a1 1 0 001.169-1.409l-7-14z" />
            </svg>
          </button>
        </div>
      </form>
    );
  };


  return (
    <div className="flex h-full bg-white">
      {/* Left Column: Chat List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">Chats</h2>
          {/* TODO: Add Search/Filter later if needed */}
        </div>
        <div className="flex-grow overflow-y-auto">
          {renderChatList()}
        </div>
      </div>

      {/* Right Column: Active Chat */}
      <div className="w-2/3 flex flex-col">
        {renderActiveChatHeader()}
        {renderMessages()}
        {renderMessageInput()}
      </div>
    </div>
  );
} // <-- This closing brace was missing here

// Removed the render functions and return statement from here as they are now inside the component scope

export default ChatLayout;