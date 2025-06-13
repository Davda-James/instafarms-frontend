// src/pages/Dashboard.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useClerk, useAuth } from '@clerk/clerk-react';
import FollowListModal from '../components/FollowListModal'; // Modal for followers/following lists
import UserCard from '../components/UserCard'; // Flexible user card for main profile and other users
import LoadingSpinner from '../components/LoadingSpinner'; // Assuming you have this component

// Define a type for a simplified user object for lists, matching backend output
interface UserInList {
  id: string; // Corresponds to backend's 'uid'
  username: string;
  fullName: string; // Derived from first_name and last_name
  avatar: string; // Corresponds to backend's 'avatarUrl'
  followersCount?: number; // From backend
  followingCount?: number; // From backend
  first_name?: string; // Raw field from backend
  last_name?: string; // Raw field from backend
  isFriend?: boolean; // NEW: Added isFriend status
  // Add other raw fields from backend if directly needed, e.g., email, bio
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [selectedTab, setSelectedTab] = useState<'all_users' | 'followers' | 'following'>('all_users');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  // States for all users data
  const [allUsersList, setAllUsersList] = useState<UserInList[]>([]);
  const [allUsersLoading, setAllUsersLoading] = useState(true);
  const [allUsersError, setAllUsersError] = useState<string | null>(null);

  // States for logged-in user's specific details (for their profile card)
  const [loggedInUserDetails, setLoggedInUserDetails] = useState<UserInList | null>(null);
  const [loggedInUserLoading, setLoggedInUserLoading] = useState(true);
  const [loggedInUserError, setLoggedInUserError] = useState<string | null>(null);

  // States for real followers and following data
  const [followersList, setFollowersList] = useState<UserInList[]>([]);
  const [followingList, setFollowingList] = useState<UserInList[]>([]);
  const [followersLoading, setFollowersLoading] = useState(true);
  const [followingLoading, setFollowingLoading] = useState(true);
  const [followersError, setFollowersError] = useState<string | null>(null);
  const [followingError, setFollowingError] = useState<string | null>(null);

  const [followActionLoading, setFollowActionLoading] = useState(false); // New state for follow/unfollow action
  const [followActionError, setFollowActionError] = useState<string | null>(null); // New state for follow/unfollow error

  // --- Backend API Endpoints (IMPORTANT: Define these in your .env file) ---
  const BACKEND_ALL_USERS_URL = import.meta.env.VITE_BACKEND_ALL_USERS_URL;
  const BACKEND_FOLLOWERS_URL = import.meta.env.VITE_BACKEND_FOLLOWERS_URL;
  const BACKEND_FOLLOWING_URL = import.meta.env.VITE_BACKEND_FOLLOWING_URL;
  const BACKEND_PROFILE_URL = import.meta.env.VITE_BACKEND_PROFILE_URL;
  const BACKEND_FOLLOW_URL = import.meta.env.VITE_BACKEND_FOLLOW_URL;
  const BACKEND_UNFOLLOW_URL = import.meta.env.VITE_BACKEND_UNFOLLOW_URL;


  // Function to re-fetch all necessary data after a follow/unfollow action or tab change
  const refetchAllDashboardData = useCallback(async () => {
    if (!user?.id || !getToken) {
      console.log("refetchAllDashboardData skipped: user ID or token not available.");
      return;
    }

    const token = await getToken();

    // Re-fetch logged-in user details
    setLoggedInUserLoading(true);
    setLoggedInUserError(null);
    try {
      if (BACKEND_PROFILE_URL) {
        const response = await fetch(`${BACKEND_PROFILE_URL}/${user.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setLoggedInUserDetails({
          id: data.uid,
          username: data.username,
          fullName: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.username,
          avatar: data.avatarUrl,
          followersCount: data.followersCount || 0,
          followingCount: data.followingCount || 0,
          isFriend: data.isFriend || false,
        });
      }
    } catch (error) {
      console.error("Error re-fetching logged-in user details:", error);
      setLoggedInUserError(`Failed to update your details: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoggedInUserLoading(false);
    }

    // Re-fetch followers list
    setFollowersLoading(true);
    setFollowersError(null);
    try {
      if (BACKEND_FOLLOWERS_URL) {
        // Removed ?userId=${user.id} as per instruction
        const response = await fetch(BACKEND_FOLLOWERS_URL, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const rawData = await response.json();
        console.log("Fetched raw followers data:", rawData);
        // Corrected mapping: rawData is an array of objects, and user details are nested under 'follower'
        const formattedFollowers = (rawData || []).map((item: any) => ({
          id: item.follower.uid,
          username: item.follower.username,
          // Assuming backend's getFollowersDetails might include first_name/last_name for fullName
          fullName: `${item.follower.first_name || ''} ${item.follower.last_name || ''}`.trim() || item.follower.username,
          avatar: item.follower.avatarUrl,
          // These counts/isFriend status might not be directly available from the current backend `getFollowersDetails` artifact.
          // They will default to 0/false if not provided by the backend.
          followersCount: item.follower.followersCount || 0,
          followingCount: item.follower.followingCount || 0,
          isFriend: item.isFriend || false, // Assuming isFriend is at the top-level of each item
        }));
        setFollowersList(formattedFollowers);
        console.log("Formatted followers list:", formattedFollowers);
      }
    } catch (error) {
      console.error("Error re-fetching followers:", error);
      setFollowersError(`Failed to update followers list: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setFollowersLoading(false);
    }

    // Re-fetch following list
    setFollowingLoading(true);
    setFollowingError(null);
    try {
      if (BACKEND_FOLLOWING_URL) {
        // Removed ?userId=${user.id} as per instruction
        const response = await fetch(BACKEND_FOLLOWING_URL, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const rawData = await response.json(); // rawData is directly the array as per user's latest log
        console.log("Fetched raw following data:", rawData);

        // Corrected mapping: rawData is an array of objects, and user details are nested under 'following'
        const formattedFollowing = (rawData || []).map((item: any) => ({
          id: item.following.uid, // Access user details nested under 'following'
          username: item.following.username,
          fullName: `${item.following.first_name || ''} ${item.following.last_name || ''}`.trim() || item.following.username,
          avatar: item.following.avatarUrl,
          followersCount: item.following.followersCount || 0,
          followingCount: item.following.followingCount || 0,
          isFriend: item.isFriend || false, // Assuming isFriend is at the top-level of each item
        }));
        setFollowingList(formattedFollowing);
        console.log("Formatted following list:", formattedFollowing);
      }
    } catch (error) {
      console.error("Error re-fetching following:", error);
      setFollowingError(`Failed to update following list: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setFollowingLoading(false);
    }
  }, [user, getToken, BACKEND_PROFILE_URL, BACKEND_FOLLOWERS_URL, BACKEND_FOLLOWING_URL]);


  // Effect to fetch All Users data. This needs to run *after* followingList is available.
  useEffect(() => {
    const fetchAllUsers = async () => {
      console.log("Attempting to fetch all users...");
      if (!getToken || !BACKEND_ALL_USERS_URL || !user?.id) {
        setAllUsersLoading(false);
        setAllUsersError("Authentication token or backend URL for all users not available.");
        console.error("All users fetch skipped: Clerk not loaded or getToken/user missing.");
        return;
      }
      setAllUsersLoading(true);
      setAllUsersError(null);
      try {
        const token = await getToken();
        console.log("Fetching all users from:", BACKEND_ALL_USERS_URL);
        const response = await fetch(BACKEND_ALL_USERS_URL, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        const data: any[] | null | undefined = await response.json();
        console.log("RAW BACKEND RESPONSE (All Users):", data);

        const formattedUsers: UserInList[] = (data || []).map(u => {
          // Determine if the current logged-in user is following this 'u' user
          const isUserFollowingThisPerson = followingList.some(f => f.id === u.uid);
          // Note: initialStatus is used within UserCard, here we prepare the data for UserCard
          // const initialStatusForCard = isUserFollowingThisPerson ? 'following' : 'follow'; // This line is not needed for the returned object

          const userWithStatus = {
            id: u.uid,
            username: u.username,
            fullName: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
            avatar: u.avatarUrl,
            followersCount: u.followersCount || 0,
            followingCount: u.followingCount || 0,
            isFriend: u.isFriend || false, // Mapping isFriend from backend
          };
          console.log(`User ${userWithStatus.username} (All Users Tab): isFriend=${userWithStatus.isFriend}, isFollowingLoggedInUser=${isUserFollowingThisPerson}`);
          return userWithStatus;
        });
        setAllUsersList(formattedUsers);
        console.log("All users data fetched successfully:", formattedUsers);
      } catch (error) {
        console.error("Error fetching all users:", error);
        setAllUsersError(`Failed to load all users: ${error instanceof Error ? error.message : String(error)}`);
        setAllUsersList([]);
      } finally {
        setAllUsersLoading(false);
      }
    };

    // This effect runs whenever isLoaded, getToken, user, or followingList changes.
    // It's crucial for ensuring allUsersList gets updated correctly after followingList is fetched.
    if (isLoaded &&     user) {
      fetchAllUsers();
    } else {
      console.log("All users fetch deferred: Clerk not loaded or getToken/user missing.");
    }
  }, [isLoaded, getToken, user, BACKEND_ALL_USERS_URL, followingList]); // Depend on followingList


  // Primary effect to load initial data and re-load when tab changes or auth state changes
  useEffect(() => {
    if (isLoaded && user) {
      refetchAllDashboardData();
    }
  }, [isLoaded, user, getToken, refetchAllDashboardData, selectedTab]); // ADDED selectedTab as dependency

  // Handle follow/unfollow action for any user
  const handleUserFollowToggle = useCallback(async (targetUserId: string, newStatus: 'follow' | 'following') => {
    if (!user?.id || !getToken || !BACKEND_FOLLOW_URL || !BACKEND_UNFOLLOW_URL) {
      setFollowActionError("User ID, authentication token, or backend URL for follow/unfollow action not available.");
      console.error("Follow action skipped:", { userId: user?.id, getTokenAvailable: !!getToken, followUrl: BACKEND_FOLLOW_URL, unfollowUrl: BACKEND_UNFOLLOW_URL });
      return;
    }

    setFollowActionLoading(true);
    setFollowActionError(null);
    try {
      const token = await getToken();
      let endpoint: string;

      if (newStatus === 'following') { // User is now 'following', so perform a follow action
        endpoint = `${BACKEND_FOLLOW_URL}/${targetUserId}`;
      } else { // User is now 'follow' (meaning they were 'following' and clicked to unfollow)
        endpoint = `${BACKEND_UNFOLLOW_URL}/${targetUserId}`;
      }

      const method = 'POST'; // Assuming POST for both follow and unfollow

      console.log(`${newStatus === 'following' ? 'Following' : 'Unfollowing'} user ${targetUserId} via ${endpoint}`);

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      console.log(`Successfully ${newStatus === 'following' ? 'followed' : 'unfollowed'} user ${targetUserId}. Re-fetching dashboard data...`);
      await refetchAllDashboardData(); // Re-fetch all relevant lists to update counts and states
    } catch (error) {
      console.error(`Error during ${newStatus} action:`, error);
      setFollowActionError(`Failed to ${newStatus === 'following' ? 'follow' : 'unfollow'} user: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setFollowActionLoading(false);
    }
  }, [user, getToken, BACKEND_FOLLOW_URL, BACKEND_UNFOLLOW_URL, refetchAllDashboardData]);


  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await signOut();
    navigate('/sign-in');
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    navigate('/profile');
  };

  // --- Initial Loading Check ---
  if (!isLoaded || !user || loggedInUserLoading) {
    console.log("Dashboard: Clerk data or logged-in user details not ready. Showing LoadingSpinner.");
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
      {/* Background blur effect */}
      <div className="absolute top-[-100px] left-1/2 transform -translate-x-1/2 w-[700px] h-[350px] bg-indigo-500 opacity-30 rounded-full filter blur-[120px] z-0" />

      {/* Top Navigation Bar */}
      <nav className="relative z-20 w-full bg-slate-900/70 backdrop-blur-md p-4 flex justify-between items-center border-b border-slate-700">
        <h1 className="text-2xl font-bold text-indigo-400">Dashboard</h1>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 text-white hover:text-indigo-300 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <img
              src={user.imageUrl || 'https://placehold.co/100x100/334155/64748b?text=U'}
              alt="User Avatar"
              className="w-9 h-9 rounded-full border-2 border-slate-600 object-cover"
            />
            {/* Display logged-in user's username in the top nav */}
            <span className="font-medium text-lg hidden sm:inline">{loggedInUserDetails?.username || user.username || user.fullName || 'User'}</span>
            <svg
              className={`w-5 h-5 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''} hidden sm:inline`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl py-1 z-30 border border-slate-700 animate-fade-in-down">
              <button
                onClick={handleProfileClick}
                className="block px-4 py-2 text-sm text-white hover:bg-slate-700 w-full text-left transition-colors"
              >
                Profile
              </button>
              <div className="border-t border-slate-700 my-1"></div>
              <button
                onClick={handleLogout}
                className="block px-4 py-2 text-sm text-red-400 hover:bg-red-900 hover:text-white w-full text-left transition-colors"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center p-4 md:p-8">
        <div className="relative z-10 w-full max-w-4xl space-y-8 mt-4">
          {/* User's Own Profile Card */}
          <section className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-xl border border-slate-700">
            <h2 className="text-2xl font-bold text-indigo-300 mb-4">Your Profile</h2>
            {loggedInUserError && <p className="text-red-400 text-center mt-2">{loggedInUserError}</p>}
            {loggedInUserDetails && (
              <UserCard
                id={loggedInUserDetails.id} // Pass current user's ID
                username={loggedInUserDetails.username || user.username || user.fullName || 'User'}
                fullName={loggedInUserDetails.fullName || ''}
                avatar={loggedInUserDetails.avatar || user.imageUrl || 'https://placehold.co/100x100/334155/64748b?text=U'}
                followers={loggedInUserDetails.followersCount}
                following={loggedInUserDetails.followingCount}
                isCurrentUser={true}
                // isFriend is not applicable for current user's own card, so no prop here
                onFollowersClick={() => setShowFollowersModal(true)}
                onFollowingClick={() => setShowFollowingModal(true)}
              />
            )}
            {/* Display general errors for followers/following lists if they occurred */}
            {followersError && <p className="text-red-400 text-center mt-2">Error: {followersError}</p>}
            {followingError && <p className="text-red-400 text-center mt-2">Error: {followingError}</p>}
            {followActionError && <p className="text-red-400 text-center mt-2">Follow Action Error: {followActionError}</p>}
          </section>

          {/* Tab Navigation */}
          <div className="flex justify-center bg-slate-800/60 rounded-xl p-2 border border-slate-700 shadow-lg mb-2">
            <button
              onClick={() => setSelectedTab('all_users')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
                selectedTab === 'all_users' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Users
            </button>
            <button
              onClick={() => setSelectedTab('followers')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
                selectedTab === 'followers' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700'
              } ml-2`}
            >
              Followers
            </button>
            <button
              onClick={() => setSelectedTab('following')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
                selectedTab === 'following' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700'
              } ml-2`}
            >
              Following
            </button>
          </div>

          {/* Conditional Content Rendering Based on Tab */}
          <section className="bg-slate-800/60 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-slate-700 min-h-[300px] flex flex-col items-center">
            {followActionLoading && <LoadingSpinner />}
            {selectedTab === 'all_users' && (
              <>
                <h2 className="text-2xl font-bold text-indigo-300 mb-4">All Users</h2>
                {allUsersLoading && <LoadingSpinner />}
                {allUsersError && <p className="text-red-400 text-center">{allUsersError}</p>}
                {!allUsersLoading && !allUsersError && allUsersList.length === 0 && (
                  <p className="text-slate-400 text-lg">No users found.</p>
                )}
                <div className="grid grid-cols-1 gap-4 w-full mt-4 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
                  {allUsersList.map((person) => (
                    <UserCard
                      key={person.id}
                      id={person.id}
                      username={person.username}
                      fullName={person.fullName}
                      avatar={person.avatar}
                      followers={person.followersCount}
                      following={person.followingCount}
                      isCurrentUser={person.id === user.id}
                      // Determine initial follow status based on whether the user is in the 'followingList'
                      initialFollowStatus={followingList.some(f => f.id === person.id) ? 'following' : 'follow'}
                      // Pass the isFriend status directly from the backend data
                      isFriend={person.isFriend}
                      onToggleFollow={handleUserFollowToggle}
                    />
                  ))}
                </div>
              </>
            )}

            {selectedTab === 'followers' && (
              <>
                <h2 className="text-2xl font-bold text-indigo-300 mb-4">Your Followers</h2>
                {followersLoading && <LoadingSpinner />}
                {followersError && <p className="text-red-400 text-center">{followersError}</p>}
                {!followersLoading && !followersError && followersList.length === 0 && (
                  <p className="text-slate-400 text-lg">You don't have any followers yet.</p>
                )}
                <div className="grid grid-cols-1 gap-4 w-full mt-4 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
                  {followersList.map((person) => (
                    <UserCard
                      key={person.id}
                      id={person.id}
                      username={person.username}
                      fullName={person.fullName}
                      avatar={person.avatar}
                      followers={person.followersCount}
                      following={person.followingCount}
                      isCurrentUser={person.id === user.id}
                      initialFollowStatus={'none'} // No follow button on this list
                      isFriend={person.isFriend} // Passing isFriend prop
                      onToggleFollow={handleUserFollowToggle}
                    />
                  ))}
                </div>
              </>
            )}

            {selectedTab === 'following' && (
              <>
                <h2 className="text-2xl font-bold text-indigo-300 mb-4">People You Follow</h2>
                {followingLoading && <LoadingSpinner />}
                {followingError && <p className="text-red-400 text-center">{followingError}</p>}
                {!followingLoading && !followingError && followingList.length === 0 && (
                  <p className="text-slate-400 text-lg">You are not following anyone yet.</p>
                )}
                <div className="grid grid-cols-1 gap-4 w-full mt-4 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
                  {followingList.map((person) => (
                    <UserCard
                      key={person.id}
                      id={person.id}
                      username={person.username}
                      fullName={person.fullName}
                      avatar={person.avatar}
                      followers={person.followersCount}
                      following={person.followingCount}
                      isCurrentUser={person.id === user.id}
                      initialFollowStatus="following" // This user is definitely 'following' them
                      isFriend={person.isFriend} // Passing isFriend prop
                      onToggleFollow={handleUserFollowToggle}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {/* Followers Modal */}
      {showFollowersModal && (
        <FollowListModal
          title="Followers"
          users={followersLoading ? [] : followersList}
          onClose={() => setShowFollowersModal(false)}
          loading={followersLoading}
          error={followersError}
        />
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <FollowListModal
          title="Following"
          users={followingLoading ? [] : followingList}
          onClose={() => setShowFollowingModal(false)}
          loading={followingLoading}
          error={followingError}
        />
      )}
    </div>
  );
}
