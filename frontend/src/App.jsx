import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute";

// Import all page components
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MapView from "./pages/MapView";
import UserProfile from "./pages/UserProfile";
import UserSearch from "./pages/UserSearch";
import Notifications from "./pages/Notifications";
import ActivityDetails from "./pages/ActivityDetails";
import UserProfileView from "./pages/UserProfileView";
import AuthSuccess from "./pages/AuthSuccess";
import ActivityEdit from "./pages/ActivityEdit";

function App() {
  return (
    <AuthProvider>
      {/* <Router> */}
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth-success" element={<AuthSuccess />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/map" element={
              <ProtectedRoute>
                <MapView />
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />
            
            <Route path="/search" element={
              <ProtectedRoute>
                <UserSearch />
              </ProtectedRoute>
            } />
            
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } />
            
            <Route path="/activity/:id" element={
              <ProtectedRoute>
                <ActivityDetails />
              </ProtectedRoute>
            } />
            
            <Route path="/activity/:id/edit" element={
              <ProtectedRoute>
                <ActivityEdit />
              </ProtectedRoute>
            } />
            
            <Route path="/user/:id" element={
              <ProtectedRoute>
                <UserProfileView />
              </ProtectedRoute>
            } />
            
            {/* Fallback - Redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      {/* </Router> */}
    </AuthProvider>
  );
}

export default App;
