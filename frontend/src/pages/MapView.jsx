import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userAPI } from "../services/api";
import Navigation from "../components/Navigation";
import { Loader } from "@googlemaps/js-api-loader";

function MapView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getUserLocation();
  }, []);

  // Update markers whenever nearbyUsers or map changes
  useEffect(() => {
    if (!map) return;
    // Clear existing markers
    markers.forEach((m) => m.setMap(null));

    const newMarkers = nearbyUsers
      .map((user) => {
        const coords = user?.coordinates?.coordinates;
        if (coords && coords[0] !== 0 && coords[1] !== 0) {
          return new google.maps.Marker({
            position: { lat: coords[1], lng: coords[0] },
            map,
            title: user.name,
            icon: {
              url:
                "data:image/svg+xml;charset=UTF-8," +
                encodeURIComponent(`
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10" cy="10" r="6" fill="#10B981" stroke="white" stroke-width="2"/>
                    <path d="M10 4a6 6 0 0 1 6 6c0 3.314-2.686 6-6 6s-6-2.686-6-6a6 6 0 0 1 6-6z" fill="#10B981"/>
                  </svg>
                `),
              scaledSize: new google.maps.Size(20, 20),
            },
          });
        }
        return null;
      })
      .filter(Boolean);

    setMarkers(newMarkers);
  }, [map, nearbyUsers]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          fetchNearbyUsers(latitude, longitude);
          initMap(latitude, longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Fallback to default location (e.g., city center)
          const defaultLat = 40.7128;
          const defaultLng = -74.0060;
          setUserLocation({ lat: defaultLat, lng: defaultLng });
          fetchNearbyUsers(defaultLat, defaultLng);
          initMap(defaultLat, defaultLng);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
      // Fallback to default location
      const defaultLat = 40.7128;
      const defaultLng = -74.0060;
      setUserLocation({ lat: defaultLat, lng: defaultLng });
      fetchNearbyUsers(defaultLat, defaultLng);
      initMap(defaultLat, defaultLng);
    }
  };

  const fetchNearbyUsers = async (lat, lng) => {
    try {
      const response = await userAPI.getNearbyUsers({ lat, lng });
      setNearbyUsers(response.data);
    } catch (err) {
      console.error("Failed to fetch nearby users:", err);
      setError("Failed to load nearby users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const initMap = async (lat, lng) => {
    try {
      const loader = new Loader({
        apiKey: "AIzaSyB41DRuKWuJEnGdnL6vwp4FqtnTf098HhM",
        version: "weekly",
        libraries: ["places"],
      });

      const { Map } = await loader.importLibrary("maps");
      
      const mapInstance = new Map(mapRef.current, {
        center: { lat, lng },
        zoom: 12,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      setMap(mapInstance);

      // Add user's location marker
      new google.maps.Marker({
        position: { lat, lng },
        map: mapInstance,
        title: "Your Location",
        icon: {
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
        },
      });

      // Add nearby users markers (using GeoJSON [lng, lat])
      const userMarkers = nearbyUsers
        .map((user) => {
          const coords = user?.coordinates?.coordinates;
          if (coords && coords[0] !== 0 && coords[1] !== 0) {
            return new google.maps.Marker({
              position: { lat: coords[1], lng: coords[0] },
              map: mapInstance,
              title: user.name,
              icon: {
                url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10" cy="10" r="6" fill="#10B981" stroke="white" stroke-width="2"/>
                    <path d="M10 4a6 6 0 0 1 6 6c0 3.314-2.686 6-6 6s-6-2.686-6-6a6 6 0 0 1 6-6z" fill="#10B981"/>
                  </svg>
                `),
                scaledSize: new google.maps.Size(20, 20),
              },
            });
          }
          return null;
        })
        .filter(Boolean);

      setMarkers(userMarkers);
    } catch (err) {
      console.error("Failed to initialize map:", err);
      setError("Failed to load map. Please check your internet connection.");
    }
  };

  const handleRetry = () => {
    setError("");
    setLoading(true);
    getUserLocation();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Something went wrong
            </h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Discover People Near You 📍
          </h2>
          <p className="text-gray-600">
            Find and connect with travelers and locals in your area.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Interactive Map
                </h3>
                <p className="text-sm text-gray-600">
                  Blue marker: Your location | Green markers: Nearby users
                </p>
              </div>
              
              <div 
                ref={mapRef} 
                className="w-full h-96 rounded-lg border border-gray-200"
                style={{ minHeight: "400px" }}
              >
                {loading && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-4xl mb-4">⏳</div>
                      <p className="text-gray-600">Loading map...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Nearby Users List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Nearby Users ({nearbyUsers.length})
              </h3>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">⏳</div>
                  <p className="text-gray-600">Finding people near you...</p>
                </div>
              ) : nearbyUsers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">👥</div>
                  <h4 className="text-lg font-semibold text-gray-600 mb-2">
                    No users found nearby
                  </h4>
                  <p className="text-gray-500 text-sm">
                    Try expanding your search radius or check back later.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {nearbyUsers.map((user) => (
                    <div
                      key={user._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
                      onClick={() => navigate(`/user/${user._id}`)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-lg">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {user.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {(() => {
                              const coords = user?.coordinates?.coordinates;
                              if (coords && coords[0] !== 0 && coords[1] !== 0) {
                                return `${calculateDistance(
                                  userLocation?.lat || 0,
                                  userLocation?.lng || 0,
                                  coords[1],
                                  coords[0]
                                ).toFixed(1)} km away`;
                              }
                              return "Location not available";
                            })()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/user/${user._id}`);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            💡 Tips for Meeting People
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <p className="font-medium mb-1">• Update your location</p>
              <p>Make sure your location is accurate to find people nearby.</p>
            </div>
            <div>
              <p className="font-medium mb-1">• Join activities</p>
              <p>Create or join activities to meet people with similar interests.</p>
            </div>
            <div>
              <p className="font-medium mb-1">• Be respectful</p>
              <p>Always be polite and respectful when reaching out to others.</p>
            </div>
            <div>
              <p className="font-medium mb-1">• Stay safe</p>
              <p>Meet in public places and trust your instincts.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default MapView;
