import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { auth } from './firebase';

// Create an axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to automatically add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Try to get the token
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      // Add token to headers if it exists
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Items API
export const itemsApi = {
  getItems: () => api.get('/items'),
  getItem: (id: string) => api.get(`/items/${id}`),
  createItem: (itemData: any) => api.post('/items', itemData),
  updateItem: (id: string, itemData: any) => api.put(`/items/${id}`, itemData),
  deleteItem: (id: string) => api.delete(`/items/${id}`),
  claimItem: (id: string) => api.post(`/items/${id}/claim`),
  completeItem: (id: string, claimedByUserId?: string) => api.post(`/items/${id}/complete`, { claimedByUserId }),
  getUserItems: () => api.get('/items/user'),
  markItemAsGiven: (id: string) => api.post(`/items/${id}/given`),
};

// API methods for users
export const usersApi = {
  // Get current user profile
  getProfile: () => api.get('/users/profile'),
  
  // Get user profile by ID
  getUserById: (userId: string) => api.get(`/users/${userId}`),
  
  // Update user profile
  updateProfile: (profileData: any) => api.put('/users/profile', profileData),
  
  // Create or update user profile after authentication
  createOrUpdateProfile: () => api.post('/users/profile', {}),
  
  // Get user statistics
  getUserStats: () => api.get('/users/stats'),
  
  // Get user statistics (alias for consistency with ProfilePage)
  getStats: () => api.get('/users/stats')
};

// API methods for authentication
export const authApi = {
  // Verify token and get user data
  verifyToken: (idToken: string) => 
    api.post('/auth/verify', { idToken }),
    
  // Get current user profile
  getCurrentUser: () => api.get('/auth/me')
};

export default api;
