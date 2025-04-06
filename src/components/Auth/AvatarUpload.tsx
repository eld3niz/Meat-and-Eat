import React from 'react';
import { FaCamera, FaSpinner } from 'react-icons/fa'; // Using react-icons for icons

interface AvatarUploadProps {
  avatarUrl: string | null;
  uploading: boolean;
  onUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isReadOnly?: boolean;
  onClick?: () => void; // Add optional onClick handler
  size?: number;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  avatarUrl,
  uploading,
  onUpload,
  isReadOnly = false,
  onClick, // Destructure onClick
  size = 150,
}) => {
  const avatarStyle: React.CSSProperties = {
    height: `${size}px`,
    width: `${size}px`,
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div
        className={`relative rounded-full overflow-hidden bg-gray-200 border-2 border-gray-300 flex items-center justify-center ${onClick && isReadOnly ? 'cursor-pointer' : ''}`} // Add cursor pointer if clickable in read-only
        style={avatarStyle}
        onClick={isReadOnly ? onClick : undefined} // Trigger onClick only if read-only
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="text-gray-500 text-4xl">?</div> // Placeholder
        )}

        {/* Upload Overlay - Conditionally render based on isReadOnly */}
        {!isReadOnly && onUpload && (
          <label
            htmlFor="avatar-upload"
            className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-2xl ${
              uploading ? 'cursor-wait' : 'cursor-pointer opacity-0 hover:opacity-100 transition-opacity'
            }`}
          >
            {uploading ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaCamera />
            )}
            <input
              type="file"
              id="avatar-upload"
              accept="image/png, image/jpeg, image/gif"
              onChange={onUpload}
              disabled={uploading || isReadOnly} // Disable if read-only
              className="hidden"
            />
          </label>
        )}
      </div>
      {/* Conditionally render the label text */}
      {!isReadOnly && onUpload && (
         <label htmlFor="avatar-upload" className={`text-sm font-medium ${uploading ? 'text-gray-500' : 'text-blue-600 hover:underline cursor-pointer'}`}>
           {uploading ? 'Uploading...' : 'Change Avatar'}
         </label>
      )}
    </div>
  );
};

export default AvatarUpload;