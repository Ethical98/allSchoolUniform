import axios from 'axios';

/**
 * Centralized Axios instance for API requests
 * 
 * Usage:
 * - Development: Set REACT_APP_API_BASE_URL=http://localhost:5001 in .env
 * - Production: Set REACT_APP_API_BASE_URL=https://api.allschooluniform.com in .env
 * 
 * If not set, falls back to relative paths (works when served from same origin)
 */
const api = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || '',
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true // Enable sending cookies with cross-origin requests
});

// Optional: Add response interceptor for global error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 unauthorized globally if needed
        if (error.response?.status === 401) {
            // Could dispatch logout action or redirect
            console.error('[API] Unauthorized request:', error.config?.url);
        }
        return Promise.reject(error);
    }
);

export default api;
