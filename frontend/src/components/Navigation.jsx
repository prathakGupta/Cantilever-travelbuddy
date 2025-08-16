import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navigation({ unreadNotifications = 0 }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/");
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-blue-600">TravelBuddy</h1>
            <div className="hidden md:flex space-x-6">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                🏠 Dashboard
              </button>
              <button
                onClick={() => navigate("/search")}
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                🔍 Discover
              </button>
              <button
                onClick={() => navigate("/map")}
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                🗺️ Map View
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                👤 Profile
              </button>
              <button 
                onClick={() => navigate("/notifications")}
                className="text-gray-600 hover:text-blue-600 transition-colors relative"
              >
                🔔 Notifications
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">
              Welcome, <span className="font-semibold">{user?.name}</span>!
            </span>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
