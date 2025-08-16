import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { activityAPI, notificationAPI } from "../services/api";
import Navigation from "../components/Navigation";

function Dashboard() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [stats, setStats] = useState({
    totalActivities: 0,
    myActivities: 0,
    joinedActivities: 0,
  });
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    location: "",
    time: "",
    participantLimit: 10,
    category: "dinner",
    tags: "",
  });

  // Date bounds: today .. today + 5 years
  const today = new Date();
  const minDate = today.toISOString().split("T")[0];
  const maxDateObj = new Date(today);
  maxDateObj.setFullYear(maxDateObj.getFullYear() + 5);
  const maxDate = maxDateObj.toISOString().split("T")[0];

  useEffect(() => {
    fetchActivities();
    fetchCategories();
    fetchUnreadNotifications();
  }, []);

  useEffect(() => {
    if (activities.length > 0) {
      const myActivities = activities.filter(
        (activity) => activity.creator._id === user.id
      ).length;
      const joinedActivities = activities.filter(
        (activity) =>
          activity.participants.some((p) => p._id === user.id) &&
          activity.creator._id !== user.id
      ).length;
      setStats({
        totalActivities: activities.length,
        myActivities,
        joinedActivities,
      });
    }
  }, [activities, user]);

  const fetchActivities = async () => {
    try {
      const response = await activityAPI.getActivities();
      setActivities(response.data);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
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

  const fetchUnreadNotifications = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadNotifications(response.data.count);
    } catch (err) {
      console.error("Failed to fetch unread notifications:", err);
    }
  };

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    try {
      const tagsArray = createForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);
      await activityAPI.createActivity({
        ...createForm,
        tags: tagsArray,
      });
      setShowCreateForm(false);
      setCreateForm({ 
        title: "",
        description: "",
        location: "",
        time: "",
        participantLimit: 10,
        category: "dinner",
        tags: "",
      });
      fetchActivities();
    } catch (err) {
      console.error("Failed to create activity:", err);
    }
  };

  const handleJoinActivity = async (activityId) => {
    try {
      await activityAPI.joinActivity(activityId);
      fetchActivities();
    } catch (err) {
      console.error("Failed to join activity:", err);
    }
  };

  const handleLeaveActivity = async (activityId) => {
    try {
      await activityAPI.leaveActivity(activityId);
      fetchActivities();
    } catch (err) {
      console.error("Failed to leave activity:", err);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  const isParticipant = (activity) => {
    return activity.participants.some((p) => p._id === user.id);
  };

  const isCreator = (activity) => {
    return activity.creator._id === user.id;
  };

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.tags?.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesCategory =
      selectedCategory === "all" || activity.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation unreadNotifications={unreadNotifications} />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}! 👋
          </h2>
          <p className="text-gray-600">
            Discover amazing activities and connect with fellow travelers.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📊</div>
              <div>
                <p className="text-sm text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalActivities}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🎯</div>
              <div>
                <p className="text-sm text-gray-600">My Activities</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.myActivities}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="text-3xl mr-4">👥</div>
              <div>
                <p className="text-sm text-gray-600">Joined Activities</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.joinedActivities}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Activity Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Create New Activity
            </h3>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              {showCreateForm ? "✕ Cancel" : "➕ Create Activity"}
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateActivity} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Activity Title"
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, title: e.target.value })
                  }
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <select
                  value={createForm.category}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, category: e.target.value })
                  }
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Location"
                  value={createForm.location}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, location: e.target.value })
                  }
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={createForm.tags}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, tags: e.target.value })
                  }
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <textarea
                placeholder="Describe your activity..."
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({ ...createForm, description: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="date"
                  value={createForm.time}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, time: e.target.value })
                  }
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min={minDate}
                  max={maxDate}
                />
                <input
                  type="number"
                  placeholder="Participant Limit"
                  value={createForm.participantLimit}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      participantLimit: parseInt(e.target.value),
                    })
                  }
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="50"
                />
              </div>
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Create Activity
              </button>
            </form>
          )}
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Search activities by title, location, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Activities Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-gray-600">Loading activities...</p>
            </div>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No activities found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedCategory !== "all"
                ? "Try adjusting your search or filters"
                : "Be the first to create an activity!"}
            </p>
            {!searchTerm && selectedCategory === "all" && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Activity
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredActivities.map((activity) => {
              const category = categories.find(
                (cat) => cat.value === activity.category
              );
              return (
                <div
                  key={activity._id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
                  onClick={() => navigate(`/activity/${activity._id}`)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg text-gray-900 line-clamp-1">
                        {activity.title}
                      </h3>
                      {category && (
                        <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center">
                          <span className="mr-1">{category.icon}</span>
                          {category.label}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {activity.description}
                    </p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">📍</span>
                        {activity.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">📅</span>
                        {new Date(activity.time).toLocaleDateString()} at{" "}
                        {new Date(activity.time).toLocaleTimeString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">👥</span>
                        {activity.participants.length}/
                        {activity.participantLimit} participants
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">👤</span>
                        {activity.creator.name}
                      </div>
                    </div>
                    
                    {activity.tags && activity.tags.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-1">
                        {activity.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      {isCreator(activity) ? (
                        <span className="text-blue-600 font-semibold text-sm">
                          ✨ You created this
                        </span>
                      ) : isParticipant(activity) ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLeaveActivity(activity._id);
                          }}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
                        >
                          Leave Activity
                        </button>
                      ) : activity.participants.length >=
                        activity.participantLimit ? (
                        <span className="text-gray-500 text-sm">Full</span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinActivity(activity._id);
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
                        >
                          Join Activity
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
