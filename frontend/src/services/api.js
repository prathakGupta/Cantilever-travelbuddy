import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/register', userData),
  login: (credentials) => api.post('/login', credentials),
  getProfile: () => api.get('/profile'),
  updateProfile: (profileData) => api.put('/profile', profileData),
};

// User API calls
export const userAPI = {
  getNearbyUsers: (params) => api.get('/nearby', { params }),
  searchUsers: (params) => api.get('/search', { params }),
  followUser: (userId) => api.post(`/${userId}/follow`),
  unfollowUser: (userId) => api.post(`/${userId}/unfollow`),
  getUserProfile: (userId) => api.get(`/${userId}`),
};

// Activity API calls
export const activityAPI = {
  getActivities: () => api.get('/activities'),
  getActivity: (id) => api.get(`/activities/${id}`),
  createActivity: (activityData) => api.post('/activities', activityData),
  joinActivity: (id) => api.post(`/activities/${id}/join`),
  leaveActivity: (id) => api.post(`/activities/${id}/leave`),
  deleteActivity: (id) => api.delete(`/activities/${id}`),
  getMyActivities: () => api.get('/activities/my-activities'),
  getCategories: () => api.get('/activities/categories'),
};

// Chat API calls
export const chatAPI = {
  getMessages: (activityId) => api.get(`/activities/${activityId}/chat`),
  sendMessage: (activityId, message) => api.post(`/activities/${activityId}/chat`, { message }),
};

// Notification API calls
export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export default api;
