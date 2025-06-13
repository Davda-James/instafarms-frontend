// src/components/FollowUserCard.tsx
import React from 'react';

interface FollowUserCardProps {
  username: string;
  fullName: string;
  avatar: string;
  // You might add a 'followStatus' or 'onFollowToggle' prop here
  // if you want to allow following/unfollowing directly from this card in the modal.
}

const FollowUserCard: React.FC<FollowUserCardProps> = ({ username, fullName, avatar }) => {
  return (
    <div className="bg-gradient-to-br from-slate-700 to-slate-800 p-4 rounded-xl shadow-md flex items-center justify-between text-white w-full border border-slate-600 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
      {/* Left Side: Avatar + Name */}
      <div className="flex items-center space-x-4">
        <img
          src={avatar}
          alt={`${username}'s Avatar`}
          className="w-12 h-12 rounded-full border-2 border-indigo-400 object-cover flex-shrink-0"
          onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100/334155/64748b?text=U'; }} // Fallback on error
        />
        <div>
          <h3 className="text-lg font-semibold break-all">{username}</h3>
          <p className="text-sm text-slate-400">{fullName}</p>
        </div>
      </div>

      {/* Right Side: Follow/Following Button (Example) */}
      {/* This button's logic (Follow/Following/Unfollow) would depend on your backend API.
          For simplicity in the modal, it's just a static 'Follow' button.
          If you need interactive follow buttons within the modal, you'd pass a prop like 'isFollowing: boolean'
          and an 'onToggleFollow: () => void' handler from the parent.
      */}
      <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm shadow-md transition-colors transform hover:-translate-y-0.5 hover:shadow-lg">
        Follow
      </button>
    </div>
  );
};

export default FollowUserCard;
