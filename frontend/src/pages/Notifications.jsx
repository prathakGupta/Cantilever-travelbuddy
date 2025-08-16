import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { notificationAPI } from "../services/api";
import Navigation from "../components/Navigation";

function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications();
      setNotifications(response.data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.data.count);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      // Update unread count
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "activity_join":
        return "👥";
      case "activity_update":
        return "📝";
      case "new_message":
        return "💬";
      case "follow":
        return "👤";
      case "reminder":
        return "⏰";
      default:
        return "🔔";
    }
  };

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case "activity_join":
        return `${notification.data?.userName || "Someone"} joined your activity "${notification.data?.activityTitle || "an activity"}"`;
      case "activity_update":
        return `Your activity "${notification.data?.activityTitle || "an activity"}" has been updated`;
      case "new_message":
        return `New message in "${notification.data?.activityTitle || "an activity"}" from ${notification.data?.userName || "someone"}`;
      case "follow":
        return `${notification.data?.userName || "Someone"} started following you`;
      case "reminder":
        return `Reminder: "${notification.data?.activityTitle || "Your activity"}" starts in ${notification.data?.timeUntil || "soon"}`;
      default:
        return notification.message || "You have a new notification";
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case "activity_join":
      case "activity_update":
      case "new_message":
        if (notification.data?.activityId) {
          navigate(`/activity/${notification.data.activityId}`);
        }
        break;
      case "follow":
        if (notification.data?.userId) {
          navigate(`/user/${notification.data.userId}`);
        }
        break;
      default:
        // For other types, just mark as read
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation unreadNotifications={unreadCount} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation unreadNotifications={unreadCount} />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Notifications 🔔
              </h2>
              <p className="text-gray-600">
                Stay updated with your latest activities and connections.
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Mark All as Read
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔔</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No notifications yet
              </h3>
              <p className="text-gray-500 mb-4">
                When you have notifications, they'll appear here.
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Explore Activities
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.isRead ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm ${
                          !notification.isRead ? "font-semibold text-gray-900" : "text-gray-700"
                        }`}>
                          {getNotificationText(notification)}
                        </p>
                        <div className="flex items-center space-x-2">
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      {notification.data?.additionalInfo && (
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.data.additionalInfo}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notification Types Info */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            📋 Notification Types
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <p className="font-medium mb-1">👥 Activity Join</p>
              <p>When someone joins your created activity.</p>
            </div>
            <div>
              <p className="font-medium mb-1">📝 Activity Update</p>
              <p>When an activity you're part of gets updated.</p>
            </div>
            <div>
              <p className="font-medium mb-1">💬 New Message</p>
              <p>When someone sends a message in an activity chat.</p>
            </div>
            <div>
              <p className="font-medium mb-1">👤 New Follower</p>
              <p>When someone starts following you.</p>
            </div>
            <div>
              <p className="font-medium mb-1">⏰ Reminders</p>
              <p>When an activity is about to start.</p>
            </div>
            <div>
              <p className="font-medium mb-1">🔔 General</p>
              <p>Other important updates and announcements.</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              🏠 Go to Dashboard
            </button>
            <button
              onClick={() => navigate("/map")}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              🗺️ View Map
            </button>
            <button
              onClick={() => navigate("/search")}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              🔍 Search Users
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              👤 Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Notifications;
