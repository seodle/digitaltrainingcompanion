import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BACKEND_URL } from "../config"; 

const AuthUserContext = createContext();

export const useAuthUser = () => useContext(AuthUserContext);

export const AuthUserProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchUserDetails = useCallback(async (token) => {
        try {
            const response = await axios.get(`${BACKEND_URL}/users/currentUser`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                params: { _: Date.now() },
            });
            setCurrentUser(response.data);
        } catch (error) {
            console.error('Failed to fetch user details:', error);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
            fetchUserDetails(token);
        } else {
            setIsAuthenticated(false);
            setCurrentUser(null);
            setLoading(false);
        }
    }, [fetchUserDetails]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <AuthUserContext.Provider value={{ currentUser, isAuthenticated, setCurrentUser, setIsAuthenticated, fetchUserDetails }}>
            {children}
        </AuthUserContext.Provider>
    );
};