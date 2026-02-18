import React, { useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthUser } from '../contexts/AuthUserContext';  // Import useAuthUser hook
import jwt_decode from 'jwt-decode';

const PrivateRoute = ({ children, authorizedEmails }) => {
  const { isAuthenticated, currentUser } = useAuthUser(); // Use the hook to get auth user context
  const navigate = useNavigate();
  const location = useLocation();

  // Function to check if the token is expired
  const isTokenExpired = (token) => {
    if (!token) {
      console.log("🔐 Token not found in localStorage");
      return true;
    }
    try {
      const decoded = jwt_decode(token);
      const currentTime = Date.now() / 1000;
      const isExpired = decoded.exp < currentTime;
      
      if (isExpired) {
        console.log("🚫 Token expired!", {
          expirationTime: new Date(decoded.exp * 1000).toLocaleString(),
          currentTime: new Date().toLocaleString()
        });
      }
      return isExpired;
    } catch (error) {
      console.log("❌ Error decoding token:", error.message);
      return true;
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      if (isTokenExpired(token)) {
        console.log("🔐 Authentication required - redirecting to signin");
        const redirect = encodeURIComponent(location.pathname + location.search);
        navigate(`/signin?redirect=${redirect}`, { replace: true });
      }
    };

    // Check auth immediately
    checkAuth();

    // Set up an interval to check auth periodically (every 5 minutes)
    const intervalId = setInterval(checkAuth, 5 * 60 * 1000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [navigate]);

  // First, check if the user is authenticated.
  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/signin?redirect=${redirect}`} replace />;
  }

  // Next, if a list of authorized emails is provided, check against it.
  if (authorizedEmails && currentUser && !authorizedEmails.includes(currentUser.email)) {
    return <Navigate to="/unauthorized" />; // Redirect to an "unauthorized" page if not authorized
  }

  return children;
};

export default PrivateRoute;