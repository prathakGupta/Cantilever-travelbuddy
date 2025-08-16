import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
                    onClick={() => navigate("/dashboard")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Dashboard
                  </button>
                  <button 
                    onClick={() => {
                      sessionStorage.removeItem("token");
                      sessionStorage.removeItem("user");
                      navigate("/");
                    }}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => navigate("/login")}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => navigate("/register")}
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
              Join exciting activities, meet new people, and create
              unforgettable memories. Whether you're a local or a traveler, find
              your perfect adventure with TravelBuddy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user ? (
                <>
                  <button 
                    onClick={() => navigate("/register")}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Get Started
                  </button>
                  <button 
                    onClick={() => navigate("/login")}
                    className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => navigate("/dashboard")}
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
              Discover the features that make TravelBuddy the perfect companion
              for your adventures
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Global Community
              </h3>
              <p className="text-gray-600">
                Connect with travelers and locals from around the world. Find
                activities that match your interests.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Diverse Activities
              </h3>
              <p className="text-gray-600">
                From hiking and dining to cultural events and sports. There's
                something for everyone.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Real-time Chat
              </h3>
              <p className="text-gray-600">
                Communicate with activity participants in real-time. Plan and
                coordinate seamlessly.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Location-based
              </h3>
              <p className="text-gray-600">
                Find activities near you with our integrated map view and
                location services.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🔔</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Smart Notifications
              </h3>
              <p className="text-gray-600">
                Stay updated with real-time notifications about activity updates
                and new participants.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Safe & Secure
              </h3>
              <p className="text-gray-600">
                Your data is protected with secure authentication and encrypted
                communications.
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
              { icon: "🍽️", name: "Dinner", desc: "Food & Dining" },
              { icon: "🏔️", name: "Hiking", desc: "Outdoor Adventures" },
              { icon: "💼", name: "Co-working", desc: "Work & Network" },
              { icon: "🏛️", name: "Sightseeing", desc: "Cultural Tours" },
              { icon: "⚽", name: "Sports", desc: "Active Lifestyle" },
              { icon: "🎭", name: "Cultural", desc: "Arts & Events" },
              { icon: "🌙", name: "Nightlife", desc: "Evening Fun" },
              { icon: "🌲", name: "Outdoor", desc: "Nature Activities" },
              { icon: "🏠", name: "Indoor", desc: "Home Activities" },
              { icon: "📌", name: "Other", desc: "Unique Experiences" },
            ].map((category, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
              >
                <div className="text-3xl mb-2">{category.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {category.name}
                </h3>
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
            Join thousands of travelers who are already discovering amazing
            activities and making new friends.
          </p>
          {!user ? (
            <button 
              onClick={() => navigate("/register")}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Create Your Account
            </button>
          ) : (
            <button 
              onClick={() => navigate("/dashboard")}
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

export default Home;
