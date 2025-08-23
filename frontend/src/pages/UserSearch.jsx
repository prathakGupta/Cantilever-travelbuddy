import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userAPI } from "../services/api";
import Navigation from "../components/Navigation";

function UserSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState(new Set());
  const [searchPerformed, setSearchPerformed] = useState(false);

  useEffect(() => {
    // Load user's following list
    if (user) {
      loadFollowingStatus();
    }
  }, [user]);

  const loadFollowingStatus = async () => {
    try {
      // This would typically come from a user's profile or following list
      // For now, we'll use an empty set
      setFollowing(new Set());
    } catch (err) {
      console.error("Failed to load following status:", err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setSearchPerformed(true);

    try {
      console.log('Searching for users with term:', searchTerm);
      const searchParams = { q: searchTerm };
      console.log('Search parameters:', searchParams);
      
      const response = await userAPI.searchUsers(searchParams);
      console.log('Search response:', response);
      setUsers(response.data);
    } catch (err) {
      console.error("Failed to search users:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      await userAPI.followUser(userId);
      setFollowing(prev => new Set([...prev, userId]));
    } catch (err) {
      console.error("Failed to follow user:", err);
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      await userAPI.unfollowUser(userId);
      setFollowing(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    } catch (err) {
      console.error("Failed to unfollow user:", err);
    }
  };

  const isFollowing = (userId) => following.has(userId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Discover People 🔍
          </h2>
          <p className="text-gray-600">
            Search for users by name, interests, or location to connect with.
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <form onSubmit={handleSearch} className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, interests, or location..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchTerm.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>

        {/* Search Results */}
        {searchPerformed && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Search Results ({users.length})
            </h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-gray-600">Searching for users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🔍</div>
                <h4 className="text-lg font-semibold text-gray-600 mb-2">
                  No users found
                </h4>
                <p className="text-gray-500">
                  Try adjusting your search terms or check back later.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((userResult) => (
                  <div
                    key={userResult._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-xl">
                            {userResult.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">
                            {userResult.name}
                          </h4>
                          {userResult.location && (
                            <p className="text-sm text-gray-600 mb-2">
                              📍 {userResult.location}
                            </p>
                          )}
                          {userResult.bio && (
                            <p className="text-gray-700 text-sm mb-2">
                              {userResult.bio}
                            </p>
                          )}
                          {userResult.interests && userResult.interests.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {userResult.interests.slice(0, 5).map((interest) => (
                                <span
                                  key={interest}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                >
                                  {interest}
                                </span>
                              ))}
                              {userResult.interests.length > 5 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                  +{userResult.interests.length - 5} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => navigate(`/user/${userResult._id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Profile
                        </button>
                        
                        {userResult._id !== user?.id && (
                          isFollowing(userResult._id) ? (
                            <button
                              onClick={() => handleUnfollow(userResult._id)}
                              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              Unfollow
                            </button>
                          ) : (
                            <button
                              onClick={() => handleFollow(userResult._id)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Follow
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Tips */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            💡 Search Tips
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <p className="font-medium mb-1">• Use specific terms</p>
              <p>Try searching for specific interests like "hiking" or "photography".</p>
            </div>
            <div>
              <p className="font-medium mb-1">• Location-based search</p>
              <p>Search for cities or countries to find people in specific areas.</p>
            </div>
            <div>
              <p className="font-medium mb-1">• Name variations</p>
              <p>Try different spellings or partial names if exact matches don't work.</p>
            </div>
            <div>
              <p className="font-medium mb-1">• Interest combinations</p>
              <p>Combine multiple interests to find people with similar hobbies.</p>
            </div>
          </div>
        </div>

        {/* Popular Searches */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Popular Searches
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              "Travel", "Food", "Sports", "Music", "Art", "Technology",
              "Nature", "Photography", "Reading", "Gaming", "Fitness"
            ].map((term) => (
              <button
                key={term}
                onClick={() => {
                  setSearchTerm(term);
                  // Auto-trigger search
                  setTimeout(() => {
                    const form = document.querySelector('form');
                    if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                  }, 100);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserSearch;
