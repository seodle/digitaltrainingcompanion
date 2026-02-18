// Centralized backend configuration (similar to a settings.py)
// Prefer environment variables; fall back to sensible defaults for development.

// Define FRONTEND_URL based on the environment
const FRONTEND_URL = process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL_PRODUCTION
    : process.env.FRONTEND_URL_DEVELOPMENT;

console.log("FRONTEND URL NODE_ENV:", FRONTEND_URL)

// Define BACKEND_URL based on the environment
const BACKEND_URL = process.env.NODE_ENV === "production"
    ? process.env.BACKEND_URL_PRODUCTION
    : process.env.BACKEND_URL_DEVELOPMENT;

console.log("BACKEND URL NODE_ENV:", BACKEND_URL)


// Using ES6 syntax for module export if you are using ES Modules
module.exports = { FRONTEND_URL, BACKEND_URL };