import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { useAuthUser } from './AuthUserContext';

const LanguageContext = createContext();
const STORAGE_KEY = 'dtc_language';
const SUPPORTED = ['en', 'fr', 'de', 'it', 'es'];

const readStoredLanguage = () => {
    const stored = String(localStorage.getItem(STORAGE_KEY) || '').toLowerCase().slice(0, 2);
    return SUPPORTED.includes(stored) ? stored : 'en';
};

export const LanguageProvider = ({ children }) => {
    const [languageCode, setLanguageCodeState] = useState(readStoredLanguage);
    const { currentUser, isAuthenticated } = useAuthUser();

    useEffect(() => {
        if (currentUser?.language && SUPPORTED.includes(currentUser.language) && !localStorage.getItem(STORAGE_KEY)) {
            setLanguageCodeState(currentUser.language);
        }
    }, [currentUser?.language]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!isAuthenticated || !token) {
            return;
        }
        axios.patch(
            `${BACKEND_URL}/users/me/language`,
            { language: languageCode },
            { headers: { Authorization: `Bearer ${token}` } }
        ).catch(() => {});
    }, [isAuthenticated, languageCode]);

    const setLanguageCode = (newLanguage) => {
        const next = SUPPORTED.includes(newLanguage) ? newLanguage : 'en';
        setLanguageCodeState(next);
        localStorage.setItem(STORAGE_KEY, next);
    };

    return (
        <LanguageContext.Provider value={{ languageCode, setLanguageCode }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
