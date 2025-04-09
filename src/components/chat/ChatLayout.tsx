import React from 'react';

const ChatLayout: React.FC = () => {
  return (
    <div className="flex h-full space-x-6 p-4"> {/* Increased horizontal spacing with space-x-6 */}
      {/* Contacts List - Left Column */}
      <div className="w-1/3 bg-gray-100 rounded-lg p-4 border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Contacts</h2>
        {/* Placeholder for contact list */}
        <div className="space-y-2">
          <div className="p-2 bg-white rounded shadow-xs text-sm text-gray-600">Contact 1</div>
          <div className="p-2 bg-white rounded shadow-xs text-sm text-gray-600">Contact 2</div>
          <div className="p-2 bg-white rounded shadow-xs text-sm text-gray-600">Contact 3</div>
        </div>
        <p className="mt-4 text-xs text-gray-500 text-center">Contact list placeholder</p>
      </div>

      {/* Chat Area - Right Column */}
      <div className="w-2/3 bg-white rounded-lg p-4 border border-gray-200 shadow-sm flex flex-col">
        <h2 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Chat Area</h2>
        {/* Placeholder for chat messages */}
        <div className="flex-grow flex items-center justify-center text-gray-400">
          Select a contact to start chatting.
        </div>
        {/* Placeholder for message input */}
        <div className="mt-4 p-2 border-t border-gray-200 text-sm text-gray-500">
          Message input placeholder
        </div>
      </div>
    </div>
  );
};

export default ChatLayout;