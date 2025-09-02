import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    // If already authenticated, redirect
    const existingToken = sessionStorage.getItem("token");
    const existingUser = sessionStorage.getItem("user");
    console.log("Checking existing auth:", { existingToken: !!existingToken, existingUser: !!existingUser });
    
    if (existingToken && existingUser) {
      try {
        const userData = JSON.parse(existingUser);
        console.log("Found existing user:", userData);
        setUser(userData);
        navigate("/dashboard");
        return;
      } catch (error) {
        console.error("Error parsing existing user:", error);
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");
      }
    }

    // If redirected back with token/user in URL (edge cases)
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    const userStr = url.searchParams.get("user");
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("user", JSON.stringify(user));
        setUser(user);
        navigate("/dashboard");
      } catch {
        // no-op; fallback to normal
      }
    }

    const errorParam = url.searchParams.get("error");
    if (errorParam) {
      if (errorParam === "google_auth_failed") {
        setError("Google sign-in failed. Please try again or use email/password login.");
      } else {
        setError("Authentication failed. Please try again.");
      }
    }
  }, [navigate, setUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Attempting login with:", formData);
      const response = await authAPI.login(formData);
      console.log("Login response:", response.data);
      
      // Ensure we have both token and user
      if (!response.data.token || !response.data.user) {
        throw new Error("Invalid response format from server");
      }
      
      // Store in session storage
      sessionStorage.setItem("token", response.data.token);
      sessionStorage.setItem("user", JSON.stringify(response.data.user));
      
      // Update auth context
      setUser(response.data.user);
      
      console.log("Login successful, navigating to dashboard");
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Login failed");
    }
  };

  const handleGoogleLogin = () => {
    // Check if we're in development mode and show appropriate message
    if (process.env.NODE_ENV === 'development') {
      console.log('Attempting Google OAuth login...');
    }
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
    const oauthBase = apiBase.replace(/\/api$/, '');
    window.location.href = `${oauthBase}/auth/google`;
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
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          className="w-full p-2 border rounded"
          required
          autoComplete="current-password"
        />
        <button
          type="submit"
          className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Login
        </button>
      </form>
      
      <div className="w-80 mt-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Or continue with
            </span>
          </div>
        </div>
        
        <button
          onClick={handleGoogleLogin}
          className="w-full mt-4 p-2 border border-gray-300 rounded flex items-center justify-center space-x-2 hover:bg-gray-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Login with Google</span>
        </button>
      </div>
      
      <a href="/register" className="mt-4 text-blue-600 underline">
        Don't have an account? Register
      </a>
    </div>
  );
}

export default Login;
