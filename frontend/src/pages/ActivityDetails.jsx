import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { activityAPI, chatAPI } from "../services/api";
import Navigation from "../components/Navigation";
import Chat from "../components/Chat";

function ActivityDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchActivity();
    fetchCategories();
  }, [id]);

  const fetchActivity = async () => {
    try {
      console.log("Fetching activity with ID:", id);
      const response = await activityAPI.getActivity(id);
      console.log("Activity response:", response.data);
      setActivity(response.data);
    } catch (err) {
      console.error("Failed to fetch activity:", err);
      setError("Failed to load activity. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await activityAPI.getCategories();
      setCategories(response.data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const handleJoinActivity = async () => {
    try {
      await activityAPI.joinActivity(id);
      fetchActivity(); // Refresh activity data
    } catch (err) {
      console.error("Failed to join activity:", err);
    }
  };

  const handleLeaveActivity = async () => {
    try {
      await activityAPI.leaveActivity(id);
      fetchActivity(); // Refresh activity data
    } catch (err) {
      console.error("Failed to leave activity:", err);
    }
  };

  const handleDeleteActivity = async () => {
    if (window.confirm("Are you sure you want to delete this activity? This action cannot be undone.")) {
      try {
        await activityAPI.deleteActivity(id);
        navigate("/dashboard");
      } catch (err) {
        console.error("Failed to delete activity:", err);
      }
    }
  };

  const isParticipant = () => {
    console.log("Checking if user is participant:", {
      userId: user?._id,
      participants: activity?.participants,
      participantIds: activity?.participants?.map(p => p._id)
    });
    return activity?.participants.some(p => p._id === user?._id);
  };

  const isCreator = () => {
    console.log("Checking if user is creator:", {
      userId: user?._id,
      creatorId: activity?.creator?._id
    });
    return activity?.creator._id === user?._id;
  };

  const canJoin = () => {
    return !isParticipant() && !isCreator() && 
           activity?.participants.length < activity?.participantLimit;
  };

  const getCategoryInfo = () => {
    return categories.find(cat => cat.value === activity?.category);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading activity...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Activity not found
            </h3>
            <p className="text-gray-500 mb-4">{error || "The activity you're looking for doesn't exist."}</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const category = getCategoryInfo();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto p-6">
        {/* Back Button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          ← Back to Dashboard
        </button>

        {/* Activity Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {activity.title}
                </h1>
                {category && (
                  <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center">
                    <span className="mr-1">{category.icon}</span>
                    {category.label}
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-lg mb-4">
                {activity.description}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col space-y-2 ml-4">
              {isCreator() ? (
                <>
                  <button
                    onClick={() => navigate(`/activity/${id}/edit`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit Activity
                  </button>
                  <button
                    onClick={handleDeleteActivity}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Activity
                  </button>
                </>
              ) : isParticipant() ? (
                <button
                  onClick={handleLeaveActivity}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Leave Activity
                </button>
              ) : canJoin() ? (
                <button
                  onClick={handleJoinActivity}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Join Activity
                </button>
              ) : (
                <span className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg">
                  Activity Full
                </span>
              )}
            </div>
          </div>

          {/* Activity Details Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center text-gray-600">
                <span className="mr-3 text-xl">📍</span>
                <span>{activity.location}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <span className="mr-3 text-xl">📅</span>
                <span>
                  {new Date(activity.time).toLocaleDateString()} at{" "}
                  {new Date(activity.time).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center text-gray-600">
                <span className="mr-3 text-xl">👥</span>
                <span>
                  {activity.participants.length} / {activity.participantLimit} participants
                </span>
              </div>
              <div className="flex items-center text-gray-600">
                <span className="mr-3 text-xl">👤</span>
                <span>Created by {activity.creator.name}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {activity.tags && activity.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Tags:</h4>
                  <div className="flex flex-wrap gap-2">
                    {activity.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Status:</h4>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  activity.participants.length >= activity.participantLimit
                    ? "bg-red-100 text-red-800"
                    : "bg-green-100 text-green-800"
                }`}>
                  {activity.participants.length >= activity.participantLimit
                    ? "Full"
                    : "Open for participants"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Participants Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Participants ({activity.participants.length})
          </h3>
          
          {activity.participants.length === 0 ? (
            <p className="text-gray-500">No participants yet. Be the first to join!</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activity.participants.map((participant) => (
                <div
                  key={participant._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => navigate(`/user/${participant._id}`)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-lg">
                        {participant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {participant.name}
                      </h4>
                      {participant._id === activity.creator._id && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Creator
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Activity Chat 💬
            </h3>
            <button
              onClick={() => setShowChat(!showChat)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showChat ? "Hide Chat" : "Show Chat"}
            </button>
          </div>
          
          {showChat && (
            <div className="mt-6">
              <Chat activityId={id} user={user} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ActivityDetails;
