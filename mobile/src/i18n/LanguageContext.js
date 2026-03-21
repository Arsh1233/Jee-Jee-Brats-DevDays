import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import translations from './translations';

const LANG_KEY = 'app_language';

const LanguageContext = createContext({
    lang: 'en',
    t: translations.en,
    setLang: () => { },
});

export function LanguageProvider({ children }) {
    const [lang, setLangState] = useState('en');

    // Load persisted language on mount
    useEffect(() => {
        AsyncStorage.getItem(LANG_KEY).then(saved => {
            if (saved === 'hi' || saved === 'en') setLangState(saved);
        });
    }, []);

    const setLang = async (newLang) => {
        setLangState(newLang);
        await AsyncStorage.setItem(LANG_KEY, newLang);
    };

    return (
        <LanguageContext.Provider value={{ lang, t: translations[lang], setLang }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext;
