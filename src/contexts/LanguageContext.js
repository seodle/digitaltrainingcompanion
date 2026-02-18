import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [languageCode, setLanguageCode] = useState('en'); // Default language

    return (
        <LanguageContext.Provider value={{ languageCode, setLanguageCode }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);