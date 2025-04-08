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
    <div 
      className={`avatar-upload-container ${isReadOnly ? 'cursor-pointer' : 'cursor-default'} relative`}
      onClick={isReadOnly && onClick ? onClick : undefined}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <div
        className={`relative rounded-full overflow-hidden bg-gray-200 border-2 border-gray-300 flex items-center justify-center`}
        style={avatarStyle}
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
      {/* Make sure the component is properly styled to work in both React and static HTML contexts */}
      <style jsx>{`
        .avatar-upload-container {
          display: inline-block;
          border-radius: 50%;
          overflow: hidden;
          background-color: #e5e7eb;
        }
        .avatar-upload-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      `}</style>
    </div>
  );
};

export default AvatarUpload;