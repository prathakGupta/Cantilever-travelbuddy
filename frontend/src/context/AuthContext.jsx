import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from "../services/api";


const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = sessionStorage.getItem("token");
        if (savedToken) {
          // Fetch the full user profile from the backend
          const response = await authAPI.getProfile();
          setUser(response.data);
          sessionStorage.setItem("user", JSON.stringify(response.data));
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        setUser(null);
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };
  
    initializeAuth();
  }, []);

  const value = {
    user,
    setUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
