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

// Handle 401 unauthorized globally - clear auth state when token is invalid/expired
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error('[API] Unauthorized - clearing auth state:', error.config?.url);
            
            // Clear localStorage auth data
            localStorage.removeItem('userInfo');
            localStorage.removeItem('cartItems');
            localStorage.removeItem('shippingAddress');
            localStorage.removeItem('cartSuccess');
            
            // Redirect to login page if not already there
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
