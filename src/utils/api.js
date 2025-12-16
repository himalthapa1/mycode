import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Handle specific error codes
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
        case 429:
          // Rate limit exceeded
          console.error('Too many requests. Please try again later.');
          break;
        default:
          break;
      }
    } else if (error.request) {
      // Network error
      console.error('Network error. Please check your connection.');
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  verify: () => api.get('/auth/verify'),
};

// Groups API functions
export const groupsAPI = {
  createGroup: (groupData) => api.post('/groups/create', groupData),
  joinGroup: (groupId) => api.post('/groups/join', { groupId }),
  leaveGroup: (groupId) => api.post('/groups/leave', { groupId }),
  listGroups: (params) => api.get('/groups/list', { params }),
  getMyGroups: (params) => api.get('/groups/my-groups', { params }),
  getGroupById: (groupId) => api.get(`/groups/${groupId}`),
  // Resources
  getResources: (groupId) => api.get(`/groups/${groupId}/resources`),
  addResource: (groupId, data) => api.post(`/groups/${groupId}/resources`, data),
  updateResource: (groupId, resourceId, data) => api.put(`/groups/${groupId}/resources/${resourceId}`, data),
  deleteResource: (groupId, resourceId) => api.delete(`/groups/${groupId}/resources/${resourceId}`),
};

export default api;
