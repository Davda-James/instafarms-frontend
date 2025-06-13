// src/pages/Admin.tsx
import { useState, useEffect, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import LoadingSpinner from '../components/LoadingSpinner'; // Re-use your loading spinner
import { useNavigate } from 'react-router-dom';

// Modals for admin actions (we'll define these as needed, placeholders for now)
interface UserToManage {
  id: string; // Frontend expects 'id'
  username: string;
  fullName: string;
  email: string;
  avatarUrl: string; // CHANGED: Renamed from 'avatar' to 'avatarUrl' for consistency with backend
  followersCount: number;
  followingCount: number;
  bio?: string;
  isFriend?: boolean; // For display consistency, though admin views might not use it
  first_name?: string; // Added for explicit editing
  last_name?: string;  // Added for explicit editing
  // Add any other fields you want to display/edit, e.g., first_name, last_name, etc.
}

// Dummy Modal Components (These would be in separate files like AdminEditUserModal.tsx etc.)
const AdminEditUserModal: React.FC<{ user: UserToManage; onClose: () => void; onSave: (updatedUser: Partial<UserToManage>) => void; }> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<UserToManage>>({
    username: user.username,
    first_name: user.first_name || '', // Initialize with first_name
    last_name: user.last_name || '',   // Initialize with last_name
    email: user.email,
    avatarUrl: user.avatarUrl || '', // CHANGED: Initialized from user.avatarUrl
    bio: user.bio,
    // Add other editable fields here
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // Pass the relevant fields from formData. fullName is derived, not edited directly.
    onSave({
      username: formData.username,
      first_name: formData.first_name,
      last_name: formData.last_name,
      bio: formData.bio,
      avatarUrl: formData.avatarUrl, // CHANGED: Passed avatarUrl instead of avatar
      email: formData.email, // Include email even if disabled, in case backend needs it for context
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-700 animate-scale-in">
        <h3 className="text-2xl font-bold text-indigo-300 mb-4">Edit User: {user.username}</h3>
        <div className="space-y-4 text-white">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Username</label>
            <input type="text" name="username" value={formData.username || ''} onChange={handleChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">First Name</label>
            <input type="text" name="first_name" value={formData.first_name || ''} onChange={handleChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Last Name</label>
            <input type="text" name="last_name" value={formData.last_name || ''} onChange={handleChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Email</label>
            <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg opacity-70 cursor-not-allowed" disabled />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Bio</label>
            <textarea name="bio" value={formData.bio || ''} onChange={handleChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg"></textarea>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Avatar URL</label>
            <input type="text" name="avatarUrl" value={formData.avatarUrl || ''} onChange={handleChange} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg" />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white rounded-lg border border-slate-600 hover:bg-slate-700 transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminConfirmDeleteModal: React.FC<{ user: UserToManage; onClose: () => void; onDelete: () => void; }> = ({ user, onClose, onDelete }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 border border-slate-700 animate-scale-in">
        <h3 className="text-xl font-bold text-red-400 mb-4">Confirm Deletion</h3>
        <p className="text-white mb-6">Are you sure you want to delete user "<span className="font-semibold">{user.username}</span>"? This action cannot be undone.</p>
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white rounded-lg border border-slate-600 hover:bg-slate-700 transition-colors">Cancel</button>
          <button onClick={onDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">Delete User</button>
        </div>
      </div>
    </div>
  );
};

// Represents a single follower/following item within the ManageFollowsModal
const FollowRelationshipCard: React.FC<{ user: UserToManage; type: 'follower' | 'following'; onRemove: (relUserId: string) => void; }> = ({ user, type, onRemove }) => {
  return (
    <div className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg border border-slate-600">
      <div className="flex items-center space-x-3">
        {/* Directly using user.avatarUrl and user.username/fullName now that mapping is correct */}
        <img src={user.avatarUrl} alt={`${user.username}'s avatar`} className="w-10 h-10 rounded-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100/334155/64748b?text=U'; }} />
        <span className="text-white font-medium">{user.username} ({user.fullName})</span>
      </div>
      <button
        onClick={() => onRemove(user.id)} // user.id should now be correctly mapped from uid
        className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded-md transition-colors"
      >
        Remove
      </button>
    </div>
  );
};


const AdminManageFollowsModal: React.FC<{
  user: UserToManage;
  onClose: () => void;
  onRemoveFollow: (removeUrl: string, followerId: string, followingId: string) => void;
  adminUserFollowersUrl: string; // Prop for followers endpoint
  adminUserFollowingUrl: string; // Prop for following endpoint
  adminRemoveFollowerUrl: string; // Prop for removing a follower
  adminRemoveFollowingUrl: string; // Prop for removing a following
}> = ({
  user,
  onClose,
  onRemoveFollow,
  adminUserFollowersUrl,
  adminUserFollowingUrl,
  adminRemoveFollowerUrl,
  adminRemoveFollowingUrl,
}) => {
  const [userFollowers, setUserFollowers] = useState<UserToManage[]>([]);
  const [userFollowing, setUserFollowing] = useState<UserToManage[]>([]);
  const [loadingFollows, setLoadingFollows] = useState(true);
  const [errorFollows, setErrorFollows] = useState<string | null>(null);
  const { getToken } = useAuth();

  // Helper to map backend's 'uid' to frontend's 'id' and create fullName
  const mapBackendUserToFrontendUser = (backendUser: any): UserToManage => {
    return {
      id: backendUser.uid, // Map uid to id
      username: backendUser.username,
      first_name: backendUser.first_name || '',
      last_name: backendUser.last_name || '',
      fullName: `${backendUser.first_name || ''} ${backendUser.last_name || ''}`.trim() || backendUser.username,
      email: backendUser.email, // Assuming email is available
      avatarUrl: backendUser.avatarUrl || 'https://placehold.co/100x100/334155/64748b?text=U',
      followersCount: backendUser.followersCount || 0,
      followingCount: backendUser.followingCount || 0,
      bio: backendUser.bio || '',
    };
  };

  const fetchUserFollows = useCallback(async () => {
    setLoadingFollows(true);
    setErrorFollows(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token missing.");

      // Fetch user's followers
      const followersResponse = await fetch(`${adminUserFollowersUrl}/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!followersResponse.ok) {
        const errorText = await followersResponse.text();
        throw new Error(`HTTP error fetching followers! status: ${followersResponse.status} - ${errorText}`);
      }
      const rawFollowersData = await followersResponse.json();
      // Explicitly map uid to id and generate fullName
      const followersData: UserToManage[] = rawFollowersData.map(mapBackendUserToFrontendUser);
      setUserFollowers(followersData);
      console.log("Mapped Followers Data:", followersData); // Debugging

      // Fetch user's following
      const followingResponse = await fetch(`${adminUserFollowingUrl}/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!followingResponse.ok) {
        const errorText = await followingResponse.text();
        throw new Error(`HTTP error fetching following! status: ${followingResponse.status} - ${errorText}`);
      }
      const followingRawData = await followingResponse.json();
      // Backend's getFollowingDetails might return { follwings: [...] } or direct array
      const dataToMap = followingRawData.follwings || followingRawData;
      // Explicitly map uid to id and generate fullName
      const followingData: UserToManage[] = dataToMap.map(mapBackendUserToFrontendUser);
      setUserFollowing(followingData);
      console.log("Mapped Following Data:", followingData); // Debugging

    } catch (error) {
      console.error("Failed to fetch user follows for admin:", error);
      setErrorFollows(`Failed to load follows: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoadingFollows(false);
    }
  }, [user.id, getToken, adminUserFollowersUrl, adminUserFollowingUrl]);

  useEffect(() => {
    fetchUserFollows();
  }, [fetchUserFollows]);

  const handleRemoveFollower = async (followerId: string) => {
    // User being managed (user.id) is the 'following'. The person to remove (followerId) is the 'follower'.
    await onRemoveFollow(adminRemoveFollowerUrl, followerId, user.id);
    await fetchUserFollows(); // Re-fetch to update the list after removal
  };

  const handleRemoveFollowing = async (followingId: string) => {
    // User being managed (user.id) is the 'follower'. The person they are following (followingId) is the 'following'.
    await onRemoveFollow(adminRemoveFollowingUrl, user.id, followingId);
    await fetchUserFollows(); // Re-fetch to update the list after removal
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-slate-700 animate-scale-in">
        <div className="sticky top-0 bg-slate-800/90 backdrop-blur-md p-6 flex justify-between items-center border-b border-slate-700 z-10 rounded-t-2xl">
          <h3 className="text-2xl font-bold text-indigo-300">Manage Follows for {user.username}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl font-light focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full w-8 h-8 flex items-center justify-center">&times;</button>
        </div>

        <div className="p-6 space-y-6 flex-grow overflow-y-auto custom-scrollbar">
          {loadingFollows ? (
            <LoadingSpinner />
          ) : errorFollows ? (
            <p className="text-red-400 text-center">{errorFollows}</p>
          ) : (
            <>
              <section>
                <h4 className="text-xl font-semibold text-slate-300 mb-3">Followers ({userFollowers.length})</h4>
                <div className="space-y-3">
                  {userFollowers.length > 0 ? (
                    userFollowers.map(f => (
                      <FollowRelationshipCard key={f.id} user={f} type="follower" onRemove={handleRemoveFollower} />
                    ))
                  ) : (
                    <p className="text-slate-400">No followers to display.</p>
                  )}
                </div>
              </section>

              <section>
                <h4 className="text-xl font-semibold text-slate-300 mb-3">Following ({userFollowing.length})</h4>
                <div className="space-y-3">
                  {userFollowing.length > 0 ? (
                    userFollowing.map(f => (
                      <FollowRelationshipCard key={f.id} user={f} type="following" onRemove={handleRemoveFollowing} />
                    ))
                  ) : (
                    <p className="text-slate-400">Not following anyone.</p>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


// Main Admin Page Component
export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [allUsers, setAllUsers] = useState<UserToManage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null); // Specific error if not admin

  const [showEditModal, setShowEditModal] = useState<UserToManage | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<UserToManage | null>(null);
  const [showManageFollowsModal, setShowManageFollowsModal] = useState<UserToManage | null>(null);

  // Backend endpoint for fetching all users (admin-specific)
  const BACKEND_ALL_USERS_URL = import.meta.env.VITE_BACKEND_ALL_USERS_URL;
  const BACKEND_ADMIN_DELETE_USER_URL = import.meta.env.VITE_BACKEND_DELETE_USER_URL;
  const BACKEND_ADMIN_UPDATE_USER_URL = import.meta.env.VITE_BACKEND_ADMIN_UPDATE_USER_URL;
  // Use explicit environment variables for remove URLs
  const BACKEND_ADMIN_REMOVE_FOLLOWER_URL = import.meta.env.VITE_BACKEND_DELETE_FOLLOWER_URL as string;
  const BACKEND_ADMIN_REMOVE_FOLLOWING_URL = import.meta.env.VITE_BACKEND_DELETE_FOLLOWING_URL as string;


  // Updated URLs for fetching followers/following in the admin panel
  const BACKEND_ADMIN_USER_FOLLOWERS_URL = import.meta.env.VITE_BACKEND_FOLLOWERSBYID_URL || `${import.meta.env.VITE_BACKEND_BASE_URL}/users/followers`;
  const BACKEND_ADMIN_USER_FOLLOWING_URL = import.meta.env.VITE_BACKEND_FOLLOWINGSBYID_URL || `${import.meta.env.VITE_BACKEND_BASE_URL}/users/followings`;


  const fetchAllUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user?.id || !getToken || !BACKEND_ALL_USERS_URL) {
        throw new Error("Clerk user, token, or backend URL for all users not available.");
      }
      const token = await getToken();
      const response = await fetch(BACKEND_ALL_USERS_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 403) {
        setAdminError("Access Denied: You do not have administrator privileges.");
        setLoading(false);
        return;
      }
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const formattedUsers: UserToManage[] = (data || []).map((u: any) => ({
        id: u.uid, // Assuming backend provides 'uid' as the user ID
        username: u.username,
        first_name: u.first_name || '', // Map first_name
        last_name: u.last_name || '',   // Map last_name
        fullName: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
        email: u.email,
        avatarUrl: u.avatarUrl || 'https://placehold.co/100x100/334155/64748b?text=U', // CHANGED: Map to avatarUrl
        followersCount: u.followersCount || 0,
        followingCount: u.followingCount || 0,
        bio: u.bio || '',
      }));
      setAllUsers(formattedUsers);
      setAdminError(null); // Clear admin error if successful
    } catch (err) {
      console.error("Error fetching all users for admin:", err);
      setError(`Failed to load users: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [user, getToken, BACKEND_ALL_USERS_URL]);

  useEffect(() => {
    if (isLoaded && user) {
      // Basic client-side check for admin status (NEVER rely solely on this for security)
      // Ensure you set 'isAdmin: true' in Clerk's publicMetadata for admin users
      if (!(user.publicMetadata as any)?.isAdmin) {
        setAdminError("Access Denied: You do not have administrator privileges.");
        setLoading(false); // Stop loading if not admin
        return;
      }
      fetchAllUsers();
    }
  }, [isLoaded, user, fetchAllUsers]);

  const handleDeleteUser = useCallback(async (userId: string) => {
    if (!BACKEND_ADMIN_DELETE_USER_URL || !getToken) return;

    setLoading(true);
    try {
      const token = await getToken();
      // The URL construction directly appends the userId as a path parameter
      const response = await fetch(`${BACKEND_ADMIN_DELETE_USER_URL}/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      console.log(`User ${userId} deleted successfully.`);
      setShowDeleteConfirm(null); // Close modal
      await fetchAllUsers(); // Refresh the list
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(`Failed to delete user: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [BACKEND_ADMIN_DELETE_USER_URL, getToken, fetchAllUsers]);

  const handleSaveUser = useCallback(async (userId: string, updatedFields: Partial<UserToManage>) => {
    if (!BACKEND_ADMIN_UPDATE_USER_URL || !getToken) return;

    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(`${BACKEND_ADMIN_UPDATE_USER_URL}/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields) // updatedFields now directly contains first_name, last_name, avatarUrl
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      console.log(`User ${userId} updated successfully.`);
      setShowEditModal(null); // Close modal
      await fetchAllUsers(); // Refresh the list
    } catch (err) {
      console.error("Error updating user:", err);
      setError(`Failed to update user: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [BACKEND_ADMIN_UPDATE_USER_URL, getToken, fetchAllUsers]);

  // CHANGED: handleRemoveFollow now accepts the specific URL to use
  const handleRemoveFollow = useCallback(async (removeUrl: string, followerId: string, followingId: string) => {
    if (!removeUrl || !getToken) return;

    setLoading(true);
    try {
      const token = await getToken();
      // Use the provided removeUrl
      const response = await fetch(`${removeUrl}/${followerId}/${followingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      console.log(`Follow relationship between ${followerId} and ${followingId} removed successfully from ${removeUrl}.`);
      // The modal's internal fetchUserFollows will handle the refresh
      // Also, refresh main user list to potentially update follower/following counts if backend updates them immediately
      await fetchAllUsers();
    } catch (err) {
      console.error("Error removing follow relationship:", err);
      setError(`Failed to remove follow: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [getToken, fetchAllUsers]); // Dependencies for useCallback: only getToken and fetchAllUsers

  if (!isLoaded || !user) {
    return <LoadingSpinner />;
  }

  if (adminError) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-4">
        <h2 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h2>
        <p className="text-lg text-slate-300 mb-6">{adminError}</p>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">Go to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col p-8">
      <div className="absolute top-[-100px] left-1/2 transform -translate-x-1/2 w-[700px] h-[350px] bg-indigo-500 opacity-30 rounded-full filter blur-[120px] z-0" />

      <h1 className="relative z-10 text-4xl font-bold text-indigo-400 mb-8 text-center">Admin Dashboard</h1>

      <div className="relative z-10 bg-slate-800/60 backdrop-blur-md rounded-2xl p-6 w-full max-w-5xl mx-auto shadow-xl border border-slate-700">
        <h2 className="text-2xl font-bold text-slate-200 mb-6">All Users</h2>
        {loading && <LoadingSpinner />}
        {error && <p className="text-red-400 text-center mb-4">{error}</p>}

        {!loading && allUsers.length === 0 && !error && (
          <p className="text-slate-400 text-lg text-center">No users found in the system.</p>
        )}

        {/* Changed grid layout to always be one column */}
        <div className="grid grid-cols-1 gap-6 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
          {allUsers.map((u) => (
            <div key={u.id} className="bg-slate-700/50 p-4 rounded-xl shadow-md flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 border border-slate-600">
              <img
                src={u.avatarUrl}
                alt={`${u.username}'s Avatar`}
                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-400 flex-shrink-0"
                onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100/334155/64748b?text=U'; }}
              />
              <div className="flex-grow text-center sm:text-left">
                <h3 className="text-xl font-semibold break-all text-white">{u.username}</h3>
                <p className="text-sm text-slate-300">{u.fullName}</p>
                <p className="text-sm text-slate-400">{u.email}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Followers: {u.followersCount} | Following: {u.followingCount}
                </p>
              </div>
              <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-2 mt-3 sm:mt-0">
                <button
                  onClick={() => setShowEditModal(u)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors shadow-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowManageFollowsModal(u)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors shadow-sm"
                >
                  Manage Follows
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(u)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors shadow-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showEditModal && (
        <AdminEditUserModal
          user={showEditModal}
          onClose={() => setShowEditModal(null)}
          onSave={(updatedFields) => handleSaveUser(showEditModal.id, updatedFields)}
        />
      )}

      {showDeleteConfirm && (
        <AdminConfirmDeleteModal
          user={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(null)}
          onDelete={() => handleDeleteUser(showDeleteConfirm.id)}
        />
      )}

      {showManageFollowsModal && (
        <AdminManageFollowsModal
          user={showManageFollowsModal}
          onClose={() => setShowManageFollowsModal(null)}
          onRemoveFollow={handleRemoveFollow}
          adminUserFollowersUrl={BACKEND_ADMIN_USER_FOLLOWERS_URL}
          adminUserFollowingUrl={BACKEND_ADMIN_USER_FOLLOWING_URL}
          adminRemoveFollowerUrl={BACKEND_ADMIN_REMOVE_FOLLOWER_URL}
          adminRemoveFollowingUrl={BACKEND_ADMIN_REMOVE_FOLLOWING_URL}
        />
      )}
    </div>
  );
}
