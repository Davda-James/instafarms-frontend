// src/components/FollowListModal.tsx
import React from 'react';
import FollowUserCard from './FollowUserCard'; // Import the new FollowUserCard component
import LoadingSpinner from './LoadingSpinner'; // Assuming you have a loading spinner

interface User {
  username: string;
  fullName: string;
  avatar: string;
  id: string; // Ensure this matches UserInList from Dashboard
}

interface FollowListModalProps {
  title: string;
  users: User[];
  onClose: () => void;
  loading?: boolean; // Added loading prop
  error?: string | null; // Added error prop
}

const FollowListModal: React.FC<FollowListModalProps> = ({ title, users, onClose, loading, error }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative bg-slate-900 rounded-2xl shadow-xl w-full max-w-md md:max-w-lg lg:max-w-xl max-h-[90vh] flex flex-col border border-slate-700 animate-scale-in">
        {/* Modal Header - Sticky for scrolling lists */}
        <div className="sticky top-0 bg-slate-900/90 backdrop-blur-md p-6 flex justify-between items-center border-b border-slate-700 z-10 rounded-t-2xl">
          <h3 className="text-2xl font-bold text-indigo-300">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-3xl font-light focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full w-8 h-8 flex items-center justify-center"
            aria-label={`Close ${title} list`}
          >
            &times; {/* Close icon */}
          </button>
        </div>

        {/* Modal Body - Scrollable content area */}
        <div className="p-6 space-y-4 flex-grow overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex justify-center items-center h-full min-h-[100px]">
              <LoadingSpinner /> {/* Use your spinner here */}
            </div>
          ) : error ? (
            <p className="text-center text-red-400">{error}</p>
          ) : users.length > 0 ? (
            users.map((user, index) => (
              // Using FollowUserCard for individual items in the list
              <FollowUserCard
                key={user.id || index} // Use unique ID for key
                username={user.username}
                fullName={user.fullName}
                avatar={user.avatar}
              />
            ))
          ) : (
            <p className="text-center text-slate-400">No {title.toLowerCase()} found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowListModal;
