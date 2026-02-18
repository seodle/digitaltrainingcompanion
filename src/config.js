// Import axios
import axios from 'axios';

// Define FRONTEND_URL based on NODE_ENV
const FRONTEND_URL = process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_FRONTEND_URL_PRODUCTION
    : process.env.REACT_APP_FRONTEND_URL_DEVELOPMENT;

// Define BACKEND_URL based on NODE_ENV
const BACKEND_URL = process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_BACKEND_URL_PRODUCTION
    : process.env.REACT_APP_BACKEND_URL_DEVELOPMENT;

// Add a response interceptor
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Clear the token and redirect to signin
            localStorage.removeItem("token");
            window.location.href = "/signin";
        }
        return Promise.reject(error);
    }
);

// Using ES6 syntax for module export if you are using ES Modules
export { FRONTEND_URL, BACKEND_URL };
