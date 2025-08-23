import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userAPI, activityAPI } from "../services/api";
import Navigation from "../components/Navigation";

function UserProfileView() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activities, setActivities] = useState({ created: [], joined: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);

  useEffect(() => {
    fetchUserProfile();
    fetchUserActivities();
    checkFollowStatus();
  }, [id]);

  const fetchUserProfile = async () => {
    try {
      const response = await userAPI.getUserProfile(id);
      setUser(response.data);
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      setError("Failed to load user profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivities = async () => {
    try {
      const response = await activityAPI.getUserActivities(id);
      setActivities(response.data);
    } catch (err) {
      console.error("Failed to fetch user activities:", err);
    }
  };

  const checkFollowStatus = async () => {
    try {
      // This would typically check if current user is following the profile user
      // For now, we'll set it to false
      setIsFollowing(false);
    } catch (err) {
      console.error("Failed to check follow status:", err);
    }
  };

  const handleFollow = async () => {
    try {
      await userAPI.followUser(id);
      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);
    } catch (err) {
      console.error("Failed to follow user:", err);
    }
  };

  const handleUnfollow = async () => {
    try {
      await userAPI.unfollowUser(user._id);
      setIsFollowing(false);
      setFollowersCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to unfollow user:", err);
    }
  };

  const isOwnProfile = () => currentUser?._id === id;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              User not found
            </h3>
            <p className="text-gray-500 mb-4">{error || "The user you're looking for doesn't exist."}</p>
            <button
              onClick={() => navigate("/search")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search Users
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto p-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          ← Go Back
        </button>

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-4xl">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {user.name}
                </h1>
                {user.location && (
                  <p className="text-gray-600 mb-2 flex items-center">
                    <span className="mr-2">📍</span>
                    {user.location}
                  </p>
                )}
                {user.bio && (
                  <p className="text-gray-700 text-lg max-w-2xl">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              {!isOwnProfile() ? (
                isFollowing ? (
                  <button
                    onClick={handleUnfollow}
                    className="px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Unfollow
                  </button>
                ) : (
                  <button
                    onClick={handleFollow}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Follow
                  </button>
                )
              ) : (
                <button
                  onClick={() => navigate("/profile")}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Profile
                </button>
              )}
              
              <button
                onClick={() => navigate("/map")}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                View on Map
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid md:grid-cols-4 gap-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {activities.created.length + activities.joined.length}
              </div>
              <div className="text-sm text-gray-600">Activities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {followersCount}
              </div>
              <div className="text-sm text-gray-600">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {followingCount}
              </div>
              <div className="text-sm text-gray-600">Following</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {user.coordinates && user.coordinates[0] !== 0 ? "📍" : "❌"}
              </div>
              <div className="text-sm text-gray-600">Location Set</div>
            </div>
          </div>

          {/* Interests */}
          {user.interests && user.interests.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Interests & Hobbies</h3>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Activities Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Activities by {user.name}
          </h3>

          {/* Created Activities */}
          {activities.created && activities.created.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-semibold mb-2">Created Activities</h4>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activities.created.map((activity) => (
                  <div
                    key={activity._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
                    onClick={() => navigate(`/activity/${activity._id}`)}
                  >
                    <h4 className="font-bold text-lg text-gray-900 mb-2">
                      {activity.title}
                    </h4>
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {activity.description}
                    </p>
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">📍</span>
                        {activity.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">📅</span>
                        {new Date(activity.time).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">👥</span>
                        {activity.participants.length}/{activity.participantLimit} participants
                      </div>
                    </div>
                    {activity.tags && activity.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {activity.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                        {activity.tags.length > 3 && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            +{activity.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Joined Activities */}
          {activities.joined && activities.joined.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-2">Joined Activities</h4>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activities.joined.map((activity) => (
                  <div
                    key={activity._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
                    onClick={() => navigate(`/activity/${activity._id}`)}
                  >
                    <h4 className="font-bold text-lg text-gray-900 mb-2">
                      {activity.title}
                    </h4>
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {activity.description}
                    </p>
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">📍</span>
                        {activity.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">📅</span>
                        {new Date(activity.time).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">👥</span>
                        {activity.participants.length}/{activity.participantLimit} participants
                      </div>
                    </div>
                    {activity.tags && activity.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {activity.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                        {activity.tags.length > 3 && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            +{activity.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* If no activities at all */}
          {(!activities.created || activities.created.length === 0) &&
           (!activities.joined || activities.joined.length === 0) && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h4 className="text-lg font-semibold text-gray-600 mb-2">
                No activities yet
              </h4>
              <p className="text-gray-500 mb-4">
                {isOwnProfile()
                  ? "You haven't created or joined any activities yet. Start by creating your first one!"
                  : `${user.name} hasn't created or joined any activities yet.`}
              </p>
              {isOwnProfile() && (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Activity
                </button>
              )}
            </div>
          )}
        </div>

        {/* Connection Section */}
        {!isOwnProfile() && (
          <div className="mt-6 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Connect with {user.name}
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <p className="font-medium mb-1">• Join their activities</p>
                <p>Participate in activities they create to get to know them better.</p>
              </div>
              <div>
                <p className="font-medium mb-1">• Send a message</p>
                <p>Start a conversation through activity chats.</p>
              </div>
              <div>
                <p className="font-medium mb-1">• Follow their updates</p>
                <p>Stay updated with their new activities and posts.</p>
              </div>
              <div>
                <p className="font-medium mb-1">• Meet in person</p>
                <p>Join activities together and meet face-to-face.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfileView;
