import { Routes, Route, Link, useNavigate, Navigate, useParams } from 'react-router-dom';
import { useState, useEffect, createContext, useContext, useRef } from 'react';
import axios from 'axios';
import { Loader } from '@googlemaps/js-api-loader';
import io from 'socket.io-client';

const AuthContext = createContext();

function useAuth() {
  return useContext(AuthContext);
}

function Chat({ activityId, user }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChatHistory();
    const newSocket = io('http://localhost:5001');
    setSocket(newSocket);

    // Join activity chat room
    newSocket.emit('join-activity', {
      activityId,
      userId: user.id,
      userName: user.name
    });

    // Listen for new messages
    newSocket.on('new-message', (messageData) => {
      setMessages(prev => [...prev, messageData]);
      // Save to localStorage
      const storageKey = `chat_${activityId}`;
      const existingMessages = JSON.parse(localStorage.getItem(storageKey) || '[]');
      localStorage.setItem(storageKey, JSON.stringify([...existingMessages, messageData]));
    });

    // Listen for user join/leave notifications
    newSocket.on('user-joined', (data) => {
      const systemMessage = {
        type: 'system',
        message: data.message,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, systemMessage]);
      // Save to localStorage
      const storageKey = `chat_${activityId}`;
      const existingMessages = JSON.parse(localStorage.getItem(storageKey) || '[]');
      localStorage.setItem(storageKey, JSON.stringify([...existingMessages, systemMessage]));
    });

    newSocket.on('user-left', (data) => {
      const systemMessage = {
        type: 'system',
        message: data.message,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, systemMessage]);
      // Save to localStorage
      const storageKey = `chat_${activityId}`;
      const existingMessages = JSON.parse(localStorage.getItem(storageKey) || '[]');
      localStorage.setItem(storageKey, JSON.stringify([...existingMessages, systemMessage]));
    });

    return () => {
      newSocket.emit('leave-activity', {
        activityId,
        userId: user.id,
        userName: user.name
      });
      newSocket.disconnect();
    };
  }, [activityId, user]);

  const fetchChatHistory = () => {
    // Load messages from localStorage
    const storageKey = `chat_${activityId}`;
    const savedMessages = JSON.parse(localStorage.getItem(storageKey) || '[]');
    setMessages(savedMessages);
    setLoading(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      const messageData = {
        activityId,
        userId: user.id,
        userName: user.name,
        message: newMessage.trim(),
        timestamp: new Date().toISOString()
      };
      
      socket.emit('send-message', messageData);
      
      // Save message to localStorage immediately
      const storageKey = `chat_${activityId}`;
      const existingMessages = JSON.parse(localStorage.getItem(storageKey) || '[]');
      localStorage.setItem(storageKey, JSON.stringify([...existingMessages, messageData]));
      
      setNewMessage('');
    }
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history? This action cannot be undone.')) {
      const storageKey = `chat_${activityId}`;
      localStorage.removeItem(storageKey);
      setMessages([]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg h-96 flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold">Activity Chat</h3>
        <button
          onClick={clearChat}
          className="text-sm text-red-600 hover:text-red-800"
          title="Clear chat history"
        >
          Clear Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading chat...</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.userId === user.id ? 'justify-end' : 'justify-start'}`}>
              {msg.type === 'system' ? (
                <div className="text-center w-full">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {msg.message}
                  </span>
                </div>
              ) : (
                <div className={`max-w-xs ${msg.userId === user.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-lg px-3 py-2`}>
                  <div className="text-xs font-semibold mb-1">
                    {msg.userName}
                  </div>
                  <div>{msg.message}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">TravelBuddy</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Dashboard
                  </button>
                  <button 
                    onClick={() => {
                      localStorage.removeItem('token');
                      localStorage.removeItem('user');
                      navigate('/');
                    }}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => navigate('/login')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => navigate('/register')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Connect with
              <span className="text-blue-600"> Travelers</span>
              <br />
              Around the World
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Join exciting activities, meet new people, and create unforgettable memories. 
              Whether you're a local or a traveler, find your perfect adventure with TravelBuddy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user ? (
                <>
                  <button 
                    onClick={() => navigate('/register')}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Get Started
                  </button>
                  <button 
                    onClick={() => navigate('/login')}
                    className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Go to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose TravelBuddy?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover the features that make TravelBuddy the perfect companion for your adventures
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Global Community</h3>
              <p className="text-gray-600">
                Connect with travelers and locals from around the world. Find activities that match your interests.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Diverse Activities</h3>
              <p className="text-gray-600">
                From hiking and dining to cultural events and sports. There's something for everyone.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Chat</h3>
              <p className="text-gray-600">
                Communicate with activity participants in real-time. Plan and coordinate seamlessly.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Location-based</h3>
              <p className="text-gray-600">
                Find activities near you with our integrated map view and location services.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🔔</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Notifications</h3>
              <p className="text-gray-600">
                Stay updated with real-time notifications about activity updates and new participants.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Safe & Secure</h3>
              <p className="text-gray-600">
                Your data is protected with secure authentication and encrypted communications.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Categories Preview */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Activity Categories
            </h2>
            <p className="text-xl text-gray-600">
              Explore different types of activities you can join
            </p>
          </div>
          
          <div className="grid md:grid-cols-5 gap-6">
            {[
              { icon: '🍽️', name: 'Dinner', desc: 'Food & Dining' },
              { icon: '🏔️', name: 'Hiking', desc: 'Outdoor Adventures' },
              { icon: '💼', name: 'Co-working', desc: 'Work & Network' },
              { icon: '🏛️', name: 'Sightseeing', desc: 'Cultural Tours' },
              { icon: '⚽', name: 'Sports', desc: 'Active Lifestyle' },
              { icon: '🎭', name: 'Cultural', desc: 'Arts & Events' },
              { icon: '🌙', name: 'Nightlife', desc: 'Evening Fun' },
              { icon: '🌲', name: 'Outdoor', desc: 'Nature Activities' },
              { icon: '🏠', name: 'Indoor', desc: 'Home Activities' },
              { icon: '📌', name: 'Other', desc: 'Unique Experiences' }
            ].map((category, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center">
                <div className="text-3xl mb-2">{category.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Your Adventure?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of travelers who are already discovering amazing activities and making new friends.
          </p>
          {!user ? (
            <button 
              onClick={() => navigate('/register')}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Create Your Account
            </button>
          ) : (
            <button 
              onClick={() => navigate('/dashboard')}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Explore Activities
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">TravelBuddy</h3>
            <p className="text-gray-400 mb-6">
              Connecting travelers, creating memories, building friendships.
            </p>
            <div className="flex justify-center space-x-6 text-gray-400">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Contact Us</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/api/login', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="w-80 space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Login
        </button>
      </form>
      <Link to="/register" className="mt-4 text-blue-600 underline">Don't have an account? Register</Link>
    </div>
  );
}

function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5001/api/register', formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="w-80 space-y-4">
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Register
        </button>
      </form>
      <Link to="/login" className="mt-4 text-blue-600 underline">Already have an account? Login</Link>
    </div>
  );
}

function MapView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    fetchActivities();
    getUserLocation();
  }, []);

  useEffect(() => {
    if (activities.length > 0 && userLocation && !map) {
      initMap();
    }
  }, [activities, userLocation, map]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to a default location if geolocation fails
          setUserLocation({ lat: 40.7128, lng: -74.0060 }); // New York as fallback
        }
      );
    } else {
      // Fallback for browsers that don't support geolocation
      setUserLocation({ lat: 40.7128, lng: -74.0060 });
    }
  };

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/activities', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivities(response.data);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const initMap = async () => {
    const loader = new Loader({
      apiKey: 'AIzaSyDf0CRVSKSKCb3Mx62Zx0mmSMLDmkegEfA', // Replace with your actual API key
      version: 'weekly',
      libraries: ['places']
    });

    try {
      const google = await loader.load();
      
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: userLocation,
        zoom: 12, // Closer zoom for local view
        mapTypeId: google.maps.MapTypeId.ROADMAP
      });

      // Add user location marker
      new google.maps.Marker({
        position: userLocation,
        map: mapInstance,
        title: 'Your Location',
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          scaledSize: new google.maps.Size(32, 32)
        }
      });

      setMap(mapInstance);

      // Add markers for each activity
      const newMarkers = activities.map((activity) => {
        // For demo purposes, generate random coordinates near user's location
        // In a real app, you'd geocode the location string
        const lat = userLocation.lat + (Math.random() - 0.5) * 0.05; // Smaller range for local activities
        const lng = userLocation.lng + (Math.random() - 0.5) * 0.05;

        const marker = new google.maps.Marker({
          position: { lat, lng },
          map: mapInstance,
          title: activity.title,
          animation: google.maps.Animation.DROP
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; max-width: 200px;">
              <h3 style="margin: 0 0 5px 0; font-weight: bold;">${activity.title}</h3>
              <p style="margin: 0 0 5px 0; font-size: 12px;">${activity.location}</p>
              <p style="margin: 0 0 5px 0; font-size: 12px;">${new Date(activity.time).toLocaleDateString()}</p>
              <p style="margin: 0; font-size: 12px;">${activity.participants.length}/${activity.participantLimit} participants</p>
              <button onclick="window.open('/activity/${activity._id}', '_blank')" style="margin-top: 5px; padding: 3px 8px; background: #3b82f6; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">View Details</button>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstance, marker);
        });

        return marker;
      });

      setMarkers(newMarkers);
    } catch (error) {
      console.error('Error loading Google Maps:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">TravelBuddy</h1>
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:text-blue-800">
              Dashboard
            </button>
            <button onClick={() => navigate('/profile')} className="text-blue-600 hover:text-blue-800">
              Profile
            </button>
            <span>Welcome, {user?.name}!</span>
            <button onClick={handleLogout} className="text-red-600 hover:text-red-800">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-2">Activity Map</h2>
          <p className="text-gray-600">Discover activities near your location</p>
          {userLocation && (
            <p className="text-sm text-blue-600">
              📍 Showing activities near your current location
            </p>
          )}
        </div>
        
        {loading || !userLocation ? (
          <div className="flex items-center justify-center h-96">
            <p>Getting your location and loading activities...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div ref={mapRef} className="w-full h-96"></div>
          </div>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activities.slice(0, 6).map((activity) => (
            <div key={activity._id} className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/activity/${activity._id}`)}>
              <h3 className="font-bold text-lg">{activity.title}</h3>
              <p className="text-gray-600">{activity.description}</p>
              <p className="text-sm text-gray-500">📍 {activity.location}</p>
              <p className="text-sm text-gray-500">
                📅 {new Date(activity.time).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">
                👥 {activity.participants.length}/{activity.participantLimit}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UserSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [interestsFilter, setInterestsFilter] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    fetchRecommendations();
    fetchUnreadNotifications();
  }, []);

  useEffect(() => {
    if (searchTerm || locationFilter || interestsFilter) {
      const timeoutId = setTimeout(() => {
        searchUsers();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setUsers([]);
    }
  }, [searchTerm, locationFilter, interestsFilter]);

  const searchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      if (locationFilter) params.append('location', locationFilter);
      if (interestsFilter) params.append('interests', interestsFilter);

      const response = await axios.get(`http://localhost:5001/api/users/search?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/users/recommendations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecommendations(response.data);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    }
  };

  const fetchUnreadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadNotifications(response.data.count);
    } catch (err) {
      console.error('Failed to fetch unread notifications:', err);
    }
  };

  const handleFollow = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5001/api/users/${userId}/follow`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update the user's following status in the lists
      setUsers(prev => prev.map(u => 
        u._id === userId ? { ...u, isFollowing: true } : u
      ));
      setRecommendations(prev => prev.map(u => 
        u._id === userId ? { ...u, isFollowing: true } : u
      ));
    } catch (err) {
      console.error('Failed to follow user:', err);
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5001/api/users/${userId}/unfollow`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update the user's following status in the lists
      setUsers(prev => prev.map(u => 
        u._id === userId ? { ...u, isFollowing: false } : u
      ));
      setRecommendations(prev => prev.map(u => 
        u._id === userId ? { ...u, isFollowing: false } : u
      ));
    } catch (err) {
      console.error('Failed to unfollow user:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-blue-600">TravelBuddy</h1>
              <div className="hidden md:flex space-x-6">
                <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-blue-600 transition-colors">
                  🏠 Dashboard
                </button>
                <button onClick={() => navigate('/map')} className="text-gray-600 hover:text-blue-600 transition-colors">
                  🗺️ Map View
                </button>
                <button onClick={() => navigate('/profile')} className="text-gray-600 hover:text-blue-600 transition-colors">
                  👤 Profile
                </button>
                <button 
                  onClick={() => navigate('/notifications')} 
                  className="text-gray-600 hover:text-blue-600 transition-colors relative"
                >
                  🔔 Notifications
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, <span className="font-semibold">{user?.name}</span>!</span>
              <button onClick={handleLogout} className="text-red-600 hover:text-red-800 transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Discover People</h2>
          <p className="text-gray-600">Find and connect with fellow travelers around the world</p>
        </div>

        {/* Search Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="🔍 Search by name or bio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="📍 Filter by location..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="🎯 Filter by interests (comma separated)..."
              value={interestsFilter}
              onChange={(e) => setInterestsFilter(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Recommendations Section */}
        {recommendations.length > 0 && !searchTerm && !locationFilter && !interestsFilter && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">💡 Recommended for You</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((user) => (
                <UserCard 
                  key={user._id} 
                  user={user} 
                  onFollow={handleFollow}
                  onUnfollow={handleUnfollow}
                  onViewProfile={() => navigate(`/user/${user._id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {(searchTerm || locationFilter || interestsFilter) && (
      <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {loading ? 'Searching...' : `Search Results (${users.length})`}
            </h3>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="text-4xl mb-2">⏳</div>
                  <p className="text-gray-600">Searching users...</p>
      </div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No users found</h3>
                <p className="text-gray-500">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {users.map((user) => (
                  <UserCard 
                    key={user._id} 
                    user={user} 
                    onFollow={handleFollow}
                    onUnfollow={handleUnfollow}
                    onViewProfile={() => navigate(`/user/${user._id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function UserCard({ user, onFollow, onUnfollow, onViewProfile }) {
  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600 mr-4">
            {user.profilePicture ? (
              <img src={user.profilePicture} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{user.name}</h3>
            <p className="text-sm text-gray-500">{user.location || 'Location not set'}</p>
          </div>
        </div>
        
        {user.bio && (
          <p className="text-gray-600 mb-4 line-clamp-2">{user.bio}</p>
        )}
        
        {user.interests && user.interests.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1">
            {user.interests.slice(0, 3).map((interest, index) => (
              <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {interest}
              </span>
            ))}
            {user.interests.length > 3 && (
              <span className="text-xs text-gray-500">+{user.interests.length - 3} more</span>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <button
            onClick={onViewProfile}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Profile
        </button>
          {user.isFollowing ? (
            <button
              onClick={() => onUnfollow(user._id)}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 transition-colors"
            >
              Following
            </button>
          ) : (
            <button
              onClick={() => onFollow(user._id)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              Follow
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function UserProfile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ 
    name: user?.name || '', 
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    interests: user?.interests || [],
    profilePicture: user?.profilePicture || '',
    isPublic: user?.isPublic !== false
  });
  const [myActivities, setMyActivities] = useState({ created: [], joined: [] });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    fetchProfile();
    fetchMyActivities();
    fetchUnreadNotifications();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      // Set default values if profile fetch fails
      setProfile({
        name: user?.name || '',
        email: user?.email || '',
        bio: '',
        location: '',
        interests: [],
        profilePicture: '',
        isPublic: true,
        createdAt: new Date()
      });
    }
  };

  const fetchMyActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/my-activities', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyActivities(response.data);
    } catch (err) {
      console.error('Failed to fetch my activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadNotifications(response.data.count);
    } catch (err) {
      console.error('Failed to fetch unread notifications:', err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('http://localhost:5001/api/profile', profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      setUser(response.data);
      setEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-blue-600">TravelBuddy</h1>
              <div className="hidden md:flex space-x-6">
                <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-blue-600 transition-colors">
                  🏠 Dashboard
                </button>
                <button onClick={() => navigate('/users')} className="text-gray-600 hover:text-blue-600 transition-colors">
                  👥 Discover
                </button>
                <button onClick={() => navigate('/map')} className="text-gray-600 hover:text-blue-600 transition-colors">
                  🗺️ Map View
                </button>
                <button 
                  onClick={() => navigate('/notifications')} 
                  className="text-gray-600 hover:text-blue-600 transition-colors relative"
                >
                  🔔 Notifications
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, <span className="font-semibold">{user?.name}</span>!</span>
              <button onClick={handleLogout} className="text-red-600 hover:text-red-800 transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h2>
          <p className="text-gray-600">Manage your profile and view your activities</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Profile Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Profile Information</h3>
              <button
                onClick={() => setEditing(!editing)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}
            {success && <p className="text-green-500 mb-4">{success}</p>}

            {editing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="City, Country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interests (comma separated)</label>
                  <input
                    type="text"
                    value={profile.interests.join(', ')}
                    onChange={(e) => setProfile({ ...profile, interests: e.target.value.split(',').map(i => i.trim()).filter(i => i) })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="hiking, photography, food..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture URL</label>
                  <input
                    type="url"
                    value={profile.profilePicture}
                    onChange={(e) => setProfile({ ...profile, profilePicture: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={profile.isPublic}
                    onChange={(e) => setProfile({ ...profile, isPublic: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                    Make my profile public
                  </label>
                </div>
                <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-xl font-bold text-blue-600">
                    {profile.profilePicture ? (
                      <img src={profile.profilePicture} alt={profile.name} className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      profile.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{profile.name}</h4>
                    <p className="text-gray-600">{profile.email}</p>
                  </div>
                </div>
                
                {profile.bio && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">Bio</h5>
                    <p className="text-gray-600">{profile.bio}</p>
                  </div>
                )}
                
                {profile.location && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">Location</h5>
                    <p className="text-gray-600">📍 {profile.location}</p>
                  </div>
                )}
                
                {profile.interests && profile.interests.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Interests</h5>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest, index) => (
                        <span key={index} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    <strong>Member since:</strong> {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500">
                    <strong>Profile:</strong> {profile.isPublic ? 'Public' : 'Private'}
        </p>
      </div>
              </div>
            )}
          </div>

          {/* My Activities Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">My Activities</h3>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="text-4xl mb-2">⏳</div>
                  <p className="text-gray-600">Loading activities...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Created ({myActivities.created.length})</h4>
                  {myActivities.created.length === 0 ? (
                    <p className="text-gray-500 text-sm">No activities created yet</p>
                  ) : (
                    <div className="space-y-3">
                      {myActivities.created.slice(0, 3).map((activity) => (
                        <div key={activity._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <h5 className="font-semibold text-gray-900">{activity.title}</h5>
                          <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>📍 {activity.location}</span>
                            <span>📅 {new Date(activity.time).toLocaleDateString()}</span>
                            <span>👥 {activity.participants.length} participants</span>
                          </div>
                        </div>
                      ))}
                      {myActivities.created.length > 3 && (
                        <p className="text-sm text-blue-600">View all {myActivities.created.length} created activities</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Joined ({myActivities.joined.length})</h4>
                  {myActivities.joined.length === 0 ? (
                    <p className="text-gray-500 text-sm">No activities joined yet</p>
                  ) : (
                    <div className="space-y-3">
                      {myActivities.joined.slice(0, 3).map((activity) => (
                        <div key={activity._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <h5 className="font-semibold text-gray-900">{activity.title}</h5>
                          <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>📍 {activity.location}</span>
                            <span>📅 {new Date(activity.time).toLocaleDateString()}</span>
                            <span>👤 by {activity.creator.name}</span>
                          </div>
                        </div>
                      ))}
                      {myActivities.joined.length > 3 && (
                        <p className="text-sm text-blue-600">View all {myActivities.joined.length} joined activities</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityDetails();
  }, [id]);

  const fetchActivityDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5001/api/activities/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivity(response.data);
    } catch (err) {
      console.error('Failed to fetch activity details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinActivity = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5001/api/activities/${id}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchActivityDetails();
    } catch (err) {
      console.error('Failed to join activity:', err);
    }
  };

  const handleLeaveActivity = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5001/api/activities/${id}/leave`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchActivityDetails();
    } catch (err) {
      console.error('Failed to leave activity:', err);
    }
  };

  const handleDeleteActivity = async () => {
    if (window.confirm('Are you sure you want to delete this activity? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5001/api/activities/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        navigate('/dashboard');
      } catch (err) {
        console.error('Failed to delete activity:', err);
        alert('Failed to delete activity. Please try again.');
      }
    }
  };

  const isParticipant = () => {
    return activity?.participants.some(p => p._id === user.id);
  };

  const isCreator = () => {
    return activity?.creator._id === user.id;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading activity details...</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Activity not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">TravelBuddy</h1>
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:text-blue-800">
              ← Back to Dashboard
            </button>
            <span>Welcome, {user?.name}!</span>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Activity Details */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-3xl font-bold mb-4">{activity.title}</h1>
            
            <div className="space-y-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Details</h3>
                <p className="text-gray-600 mb-2">{activity.description}</p>
                <p className="text-sm text-gray-500 mb-1">
                  <strong>Location:</strong> {activity.location}
                </p>
                <p className="text-sm text-gray-500 mb-1">
                  <strong>Time:</strong> {new Date(activity.time).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mb-1">
                  <strong>Created by:</strong> {activity.creator.name}
                </p>
                <p className="text-sm text-gray-500">
                  <strong>Participants:</strong> {activity.participants.length}/{activity.participantLimit}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Participants</h3>
                <div className="space-y-2">
                  {activity.participants.map((participant) => (
                    <div key={participant._id} className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm">
                        {participant.name}
                        {participant._id === activity.creator._id && (
                          <span className="text-blue-600 ml-1">(Creator)</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              {isCreator() ? (
                <div className="flex space-x-4">
                  <span className="text-blue-600 font-semibold">You created this activity</span>
                  <button
                    onClick={handleDeleteActivity}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Delete Activity
                  </button>
                </div>
              ) : isParticipant() ? (
                <button
                  onClick={handleLeaveActivity}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Leave Activity
                </button>
              ) : activity.participants.length >= activity.participantLimit ? (
                <span className="text-gray-500">This activity is full</span>
              ) : (
                <button
                  onClick={handleJoinActivity}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Join Activity
                </button>
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div>
            <Chat activityId={id} user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [stats, setStats] = useState({
    totalActivities: 0,
    myActivities: 0,
    joinedActivities: 0
  });
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    location: '',
    time: '',
    participantLimit: 10,
    category: 'dinner',
    tags: ''
  });

  useEffect(() => {
    fetchActivities();
    fetchCategories();
    fetchUnreadNotifications();
  }, []);

  useEffect(() => {
    if (activities.length > 0) {
      const myActivities = activities.filter(activity => activity.creator._id === user.id).length;
      const joinedActivities = activities.filter(activity => 
        activity.participants.some(p => p._id === user.id) && activity.creator._id !== user.id
      ).length;
      setStats({
        totalActivities: activities.length,
        myActivities,
        joinedActivities
      });
    }
  }, [activities, user]);

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/activities', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivities(response.data);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchUnreadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadNotifications(response.data.count);
    } catch (err) {
      console.error('Failed to fetch unread notifications:', err);
    }
  };

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const tagsArray = createForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      await axios.post('http://localhost:5001/api/activities', {
        ...createForm,
        tags: tagsArray
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowCreateForm(false);
      setCreateForm({ 
        title: '', 
        description: '', 
        location: '', 
        time: '', 
        participantLimit: 10,
        category: 'dinner',
        tags: ''
      });
      fetchActivities();
    } catch (err) {
      console.error('Failed to create activity:', err);
    }
  };

  const handleJoinActivity = async (activityId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5001/api/activities/${activityId}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchActivities();
    } catch (err) {
      console.error('Failed to join activity:', err);
    }
  };

  const handleLeaveActivity = async (activityId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5001/api/activities/${activityId}/leave`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchActivities();
    } catch (err) {
      console.error('Failed to leave activity:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const isParticipant = (activity) => {
    return activity.participants.some(p => p._id === user.id);
  };

  const isCreator = (activity) => {
    return activity.creator._id === user.id;
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || activity.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-blue-600">TravelBuddy</h1>
              <div className="hidden md:flex space-x-6">
                <button onClick={() => navigate('/map')} className="text-gray-600 hover:text-blue-600 transition-colors">
                  🗺️ Map View
                </button>
                <button onClick={() => navigate('/users')} className="text-gray-600 hover:text-blue-600 transition-colors">
                  👥 Discover
                </button>
                <button onClick={() => navigate('/profile')} className="text-gray-600 hover:text-blue-600 transition-colors">
                  👤 Profile
                </button>
                <button 
                  onClick={() => navigate('/notifications')} 
                  className="text-gray-600 hover:text-blue-600 transition-colors relative"
                >
                  🔔 Notifications
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, <span className="font-semibold">{user?.name}</span>!</span>
              <button onClick={handleLogout} className="text-red-600 hover:text-red-800 transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}! 👋</h2>
          <p className="text-gray-600">Discover amazing activities and connect with fellow travelers.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📊</div>
              <div>
                <p className="text-sm text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalActivities}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🎯</div>
              <div>
                <p className="text-sm text-gray-600">My Activities</p>
                <p className="text-2xl font-bold text-gray-900">{stats.myActivities}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="text-3xl mr-4">👥</div>
              <div>
                <p className="text-sm text-gray-600">Joined Activities</p>
                <p className="text-2xl font-bold text-gray-900">{stats.joinedActivities}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Activity Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Create New Activity</h3>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              {showCreateForm ? '✕ Cancel' : '➕ Create Activity'}
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateActivity} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Activity Title"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <select
                  value={createForm.category}
                  onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
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
                  onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={createForm.tags}
                  onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <textarea
                placeholder="Describe your activity..."
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="datetime-local"
                  value={createForm.time}
                  onChange={(e) => setCreateForm({ ...createForm, time: e.target.value })}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  type="number"
                  placeholder="Participant Limit"
                  value={createForm.participantLimit}
                  onChange={(e) => setCreateForm({ ...createForm, participantLimit: parseInt(e.target.value) })}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="50"
                />
              </div>
              <button type="submit" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
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
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No activities found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Be the first to create an activity!'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && (
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
              const category = categories.find(cat => cat.value === activity.category);
              return (
                <div key={activity._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200" onClick={() => navigate(`/activity/${activity._id}`)}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{activity.title}</h3>
                      {category && (
                        <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center">
                          <span className="mr-1">{category.icon}</span>
                          {category.label}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2">{activity.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">📍</span>
                        {activity.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">📅</span>
                        {new Date(activity.time).toLocaleDateString()} at {new Date(activity.time).toLocaleTimeString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">👥</span>
                        {activity.participants.length}/{activity.participantLimit} participants
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">👤</span>
                        {activity.creator.name}
                      </div>
                    </div>
                    
                    {activity.tags && activity.tags.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-1">
                        {activity.tags.map((tag, index) => (
                          <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      {isCreator(activity) ? (
                        <span className="text-blue-600 font-semibold text-sm">✨ You created this</span>
                      ) : isParticipant(activity) ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleLeaveActivity(activity._id); }}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
                        >
                          Leave Activity
                        </button>
                      ) : activity.participants.length >= activity.participantLimit ? (
                        <span className="text-gray-500 text-sm">Full</span>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleJoinActivity(activity._id); }}
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

function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    setupSocket();
  }, []);

  const setupSocket = () => {
    const newSocket = io('http://localhost:5001');
    setSocket(newSocket);

    newSocket.emit('join-user-room', user.id);

    newSocket.on('new-notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      newSocket.disconnect();
    };
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5001/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5001/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'activity_joined': return '👋';
      case 'activity_left': return '👋';
      case 'activity_updated': return '📝';
      case 'new_participant': return '👥';
      case 'activity_reminder': return '⏰';
      case 'message_received': return '💬';
      case 'new_follower': return '👤';
      default: return '🔔';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">TravelBuddy</h1>
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:text-blue-800">
              Dashboard
            </button>
            <button onClick={() => navigate('/profile')} className="text-blue-600 hover:text-blue-800">
              Profile
            </button>
            <span>Welcome, {user?.name}!</span>
            <button onClick={handleLogout} className="text-red-600 hover:text-red-800">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Notifications</h2>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Mark All as Read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No notifications yet</h3>
            <p className="text-gray-500">You'll see notifications here when you have activity updates</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow ${
                  !notification.isRead ? 'border-l-4 border-blue-500' : ''
                }`}
                onClick={() => markAsRead(notification._id)}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">{notification.message}</p>
                    {notification.activity && (
                      <p className="text-sm text-blue-600 mt-2">
                        Activity: {notification.activity.title}
                      </p>
                    )}
                    {!notification.isRead && (
                      <div className="mt-2">
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span className="text-xs text-blue-600 ml-2">New</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserProfileView({ userId }) {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activities');
  const [userActivities, setUserActivities] = useState({ created: [], joined: [] });
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    fetchUserProfile();
    fetchUserActivities();
    fetchUnreadNotifications();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5001/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5001/api/my-activities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter activities for this specific user
      const created = response.data.created.filter(activity => activity.creator._id === userId);
      const joined = response.data.joined.filter(activity => 
        activity.participants.some(p => p._id === userId) && activity.creator._id !== userId
      );
      setUserActivities({ created, joined });
    } catch (err) {
      console.error('Failed to fetch user activities:', err);
    }
  };

  const fetchUnreadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadNotifications(response.data.count);
    } catch (err) {
      console.error('Failed to fetch unread notifications:', err);
    }
  };

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5001/api/users/${userId}/follow`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(prev => ({ ...prev, isFollowing: true, followers: [...prev.followers, currentUser] }));
    } catch (err) {
      console.error('Failed to follow user:', err);
    }
  };

  const handleUnfollow = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5001/api/users/${userId}/unfollow`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(prev => ({ 
        ...prev, 
        isFollowing: false, 
        followers: prev.followers.filter(f => f._id !== currentUser.id) 
      }));
    } catch (err) {
      console.error('Failed to unfollow user:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">👤</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">User not found</h3>
          <button onClick={() => navigate('/users')} className="text-blue-600 hover:text-blue-800">
            Back to User Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-blue-600">TravelBuddy</h1>
              <div className="hidden md:flex space-x-6">
                <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-blue-600 transition-colors">
                  🏠 Dashboard
                </button>
                <button onClick={() => navigate('/users')} className="text-gray-600 hover:text-blue-600 transition-colors">
                  👥 Discover
                </button>
                <button onClick={() => navigate('/map')} className="text-gray-600 hover:text-blue-600 transition-colors">
                  🗺️ Map View
                </button>
                <button 
                  onClick={() => navigate('/notifications')} 
                  className="text-gray-600 hover:text-blue-600 transition-colors relative"
                >
                  🔔 Notifications
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, <span className="font-semibold">{currentUser?.name}</span>!</span>
              <button onClick={handleLogout} className="text-red-600 hover:text-red-800 transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-start space-x-6">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt={user.name} className="w-24 h-24 rounded-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                  <p className="text-gray-600">{user.location || 'Location not set'}</p>
                </div>
                {currentUser.id !== userId && (
                  <button
                    onClick={user.isFollowing ? handleUnfollow : handleFollow}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      user.isFollowing 
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {user.isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
              
              {user.bio && (
                <p className="text-gray-700 mb-4">{user.bio}</p>
              )}
              
              {user.interests && user.interests.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.interests.map((interest, index) => (
                      <span key={index} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-6 text-sm text-gray-600">
                <span>{user.followers.length} followers</span>
                <span>{user.following.length} following</span>
                <span>Member since {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('activities')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'activities'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Activities
              </button>
              <button
                onClick={() => setActiveTab('followers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'followers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Followers ({user.followers.length})
              </button>
              <button
                onClick={() => setActiveTab('following')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'following'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Following ({user.following.length})
              </button>
            </nav>
          </div>
          
          <div className="p-6">
            {activeTab === 'activities' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Created Activities</h3>
                {userActivities.created.length === 0 ? (
                  <p className="text-gray-500">No activities created yet.</p>
                ) : (
                  <div className="space-y-4">
                    {userActivities.created.map((activity) => (
                      <div key={activity._id} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                        <p className="text-gray-600 text-sm">{activity.description}</p>
                        <p className="text-gray-500 text-sm">📍 {activity.location}</p>
                        <p className="text-gray-500 text-sm">📅 {new Date(activity.time).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'followers' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Followers</h3>
                {user.followers.length === 0 ? (
                  <p className="text-gray-500">No followers yet.</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {user.followers.map((follower) => (
                      <div key={follower._id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                          {follower.profilePicture ? (
                            <img src={follower.profilePicture} alt={follower.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            follower.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{follower.name}</p>
                          <p className="text-sm text-gray-500">{follower.location || 'Location not set'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'following' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Following</h3>
                {user.following.length === 0 ? (
                  <p className="text-gray-500">Not following anyone yet.</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {user.following.map((following) => (
                      <div key={following._id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                          {following.profilePicture ? (
                            <img src={following.profilePicture} alt={following.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            following.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{following.name}</p>
                          <p className="text-sm text-gray-500">{following.location || 'Location not set'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        } />
        <Route path="/map" element={
          <ProtectedRoute>
            <MapView />
          </ProtectedRoute>
        } />
        <Route path="/activity/:id" element={
          <ProtectedRoute>
            <ActivityDetails />
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute>
            <UserSearch />
          </ProtectedRoute>
        } />
        <Route path="/user/:id" element={
          <ProtectedRoute>
            <UserProfileView />
          </ProtectedRoute>
        } />
      </Routes>
    </AuthContext.Provider>
  );
}

export default App;
