// src/components/UserCard.tsx
import React, { useState, useEffect } from 'react';

// Define the interface for the UserCard props
interface UserCardProps {
  id: string; // Added to identify the user for follow actions
  username: string;
  fullName: string;
  avatar: string;
  followers?: number; // Optional, for display
  following?: number; // Optional, for display
  isCurrentUser?: boolean; // If true, don't show follow buttons, enable click on stats
  initialFollowStatus?: 'follow' | 'following' | 'unfollow' | 'none'; // For other users
  isFriend?: boolean; // NEW: Added isFriend prop
  onFollowersClick?: () => void; // Click handler for followers count (e.g., for current user)
  onFollowingClick?: () => void; // Click handler for following count (e.g., for current user)
  onToggleFollow?: (userId: string, newStatus: 'follow' | 'following') => Promise<void>; // Callback for follow/unfollow
}

const UserCard: React.FC<UserCardProps> = ({
  id,
  username,
  fullName,
  avatar,
  followers,
  following,
  isCurrentUser = false,
  initialFollowStatus = 'none', // Default to no follow status if not provided
  isFriend = false, // Default isFriend to false
  onFollowersClick,
  onFollowingClick,
  onToggleFollow,
}) => {
  // State for the follow button for other users
  const [followStatus, setFollowStatus] = useState(initialFollowStatus);

  // Effect to update internal followStatus based on props
  // If isFriend is true, always show 'Following' button
  // Otherwise, use the actual initialFollowStatus
  useEffect(() => {
    if (isFriend) {
      setFollowStatus('following'); // If they are friends, always show 'Following' button
    } else {
      setFollowStatus(initialFollowStatus); // Otherwise, use the actual follow status
    }
  }, [initialFollowStatus, isFriend]); // Depend on both props


  const handleFollowToggle = async () => {
    if (isCurrentUser) return; // Prevent self-following/unfollowing

    const previousStatus = followStatus; // Store current status for potential revert

    let newActionStatus: 'follow' | 'following'; // This reflects the action being sent to backend
    // If currently 'Friends' (meaning isFriend is true) OR currently 'Following' (from followStatus)
    // the next action is unfollow.
    if (isFriend || previousStatus === 'following') {
      newActionStatus = 'follow'; // This will send an unfollow request
    } else { // Otherwise, it's 'follow' or 'none', so the next action is to follow
      newActionStatus = 'following'; // This will send a follow request
    }

    // Optimistically update UI state
    setFollowStatus(newActionStatus);

    console.log(`Optimistically updating UI for ${username} to ${newActionStatus}`);

    if (onToggleFollow) {
      try {
        await onToggleFollow(id, newActionStatus); // Pass the user's ID and the new status
        console.log(`Backend call for ${username} (${newActionStatus}) successful.`);
        // Parent will re-fetch data, so this UserCard's state might be reset by the prop change
      } catch (error) {
        console.error(`Error toggling follow for ${username}:`, error);
        // Revert UI on error
        setFollowStatus(previousStatus);
        // A more robust error handling might show a temporary error message on the card
      }
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-xl w-full flex flex-col sm:flex-row items-center justify-between text-white space-y-4 sm:space-y-0 sm:space-x-6 border border-slate-700">
      {/* Left Side: Avatar + Name */}
      <div className="flex items-center space-x-4 flex-shrink-0">
        <img
          src={avatar}
          alt={`${username}'s Avatar`}
          className="w-16 h-16 sm:w-14 sm:h-14 rounded-full border-2 border-indigo-400 object-cover shadow-md transition-transform duration-200 hover:scale-105"
          onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100/334155/64748b?text=U'; }} // Fallback on error
        />
        <div className="text-center sm:text-left">
          <h3 className="text-xl font-semibold break-all">{username}</h3>
          <p className="text-sm text-slate-400">{fullName}</p>
        </div>
      </div>

      {/* Right Side: Stats and Buttons */}
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 w-full sm:w-auto justify-center">
        {/* Stats - Conditionally rendered and clickable for current user */}
        {followers !== undefined && (
          <div
            className={`text-center flex-shrink-0 ${isCurrentUser ? 'cursor-pointer hover:text-indigo-400 transition-colors' : ''}`}
            onClick={isCurrentUser ? onFollowersClick : undefined}
          >
            <p className="text-xl font-bold">{followers}</p>
            <p className="text-sm text-slate-400">Followers</p>
          </div>
        )}
        {following !== undefined && (
          <div
            className={`text-center flex-shrink-0 ${isCurrentUser ? 'cursor-pointer hover:text-indigo-400 transition-colors' : ''}`}
            onClick={isCurrentUser ? onFollowingClick : undefined}
          >
            <p className="text-xl font-bold">{following}</p>
            <p className="text-sm text-slate-400">Following</p>
          </div>
        )}

        {/* Buttons (only for other users) */}
        {!isCurrentUser && (
          <div className="flex flex-col space-y-2 flex-shrink-0">
            {/* If followStatus is 'follow' or 'none', show the blue 'Follow' button */}
            {followStatus === 'follow' || followStatus === 'none' ? (
              <button
                onClick={handleFollowToggle}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm shadow-md transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg"
              >
                Follow
              </button>
            ) : (
              // Otherwise (followStatus is 'following' or isFriend is true, forcing 'following'),
              // show the grayish 'Following' button
              <button
                onClick={handleFollowToggle}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm shadow-md transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg"
              >
                Following
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserCard;
