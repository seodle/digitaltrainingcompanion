import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import { BACKEND_URL } from "../config"; 

const AuthUserContext = createContext();

export const useAuthUser = () => useContext(AuthUserContext);

export const AuthUserProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
            const decoded = jwt_decode(token);
            fetchUserDetails(token, decoded._id);
        } else {
            setIsAuthenticated(false);
            setCurrentUser(null);
            setLoading(false);
        }
    }, []);

    const fetchUserDetails = async (token, userId) => {
        try {
            const response = await axios.get(`${BACKEND_URL}/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCurrentUser(response.data); // Sets the current user on successful fetch
        } catch (error) {
            console.error('Failed to fetch user details:', error);
            setIsAuthenticated(false); // Updates authentication status on error
        } finally {
            setLoading(false); // Ensures loading is set to false in both success and error cases
        }
    };

    if (loading) {
        return <div>Loading...</div>; // or other loading indicators
    }


    return (
        <AuthUserContext.Provider value={{ currentUser, isAuthenticated, setCurrentUser, setIsAuthenticated, fetchUserDetails }}>
            {children}
        </AuthUserContext.Provider>
    );
};
