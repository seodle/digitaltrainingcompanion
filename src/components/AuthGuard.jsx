import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jwt_decode from 'jwt-decode';

const AuthGuard = ({ children }) => {
  const navigate = useNavigate();

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
        navigate("/signin");
      }
    };

    // Check auth immediately
    checkAuth();

    // Set up an interval to check auth periodically (every 5 minutes)
    const intervalId = setInterval(checkAuth, 5 * 60 * 1000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [navigate]);

  return children;
};

export default AuthGuard; 