// client/src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // This will be proxied to http://localhost:3001/api in dev
});

// Add a request interceptor to include the token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;