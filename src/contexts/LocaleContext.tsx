
// src/contexts/LocaleContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
// Removed useRouter import as we are managing locale client-side now
import en from '@/locales/en.json';
import es from '@/locales/es.json';
import useLocalStorage from '@/hooks/useLocalStorage'; // Import useLocalStorage

// Define the structure of your translations
interface Translations {
  [key: string]: string | NestedTranslations;
}
interface NestedTranslations {
  [key: string]: string;
}

// Define the context type
interface LocaleContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, options?: Record<string, string | number>) => string; // Add interpolation options
  currentLocale: string;
}

// Default locale determination (client-side only)
const getDefaultLocale = (): string => {
    if (typeof window === 'undefined') return 'en'; // Default on server
    // Check localStorage first
    const storedLocale = window.localStorage.getItem('locale');
    if (storedLocale && ['en', 'es'].includes(storedLocale)) {
        return storedLocale;
    }
    // Fallback to browser language
    const browserLang = navigator.language.split('-')[0];
    return ['en', 'es'].includes(browserLang) ? browserLang : 'en'; // Default to 'en'
};

// Create the context with a default value
export const LocaleContext = createContext<LocaleContextType>({
  locale: 'en', // Sensible default
  setLocale: () => {},
  t: (key) => key, // Default translation function returns the key
  currentLocale: 'en',
});

// Define the provider props
interface LocaleProviderProps {
  children: ReactNode;
}

const translations: Record<string, Translations> = { en, es };

// Function to get nested translation value
const getNestedValue = (obj: Translations, key: string): string | undefined => {
    const keys = key.split('.');
    let current: string | NestedTranslations | undefined = obj;

    for (const k of keys) {
        if (typeof current === 'object' && current !== null && k in current) {
            current = current[k];
        } else {
            return undefined; // Key not found
        }
    }

    return typeof current === 'string' ? current : undefined; // Return only if it's a string
};

// Create the provider component
export const LocaleProvider: React.FC<LocaleProviderProps> = ({ children }) => {
  // Use useLocalStorage to manage locale state persistence
  const [locale, setLocale] = useLocalStorage<string>('locale', getDefaultLocale());
  const [isClient, setIsClient] = useState(false);

  // Track client-side hydration
  useEffect(() => {
      setIsClient(true);
      // Re-evaluate default locale once client is available
      const initialLocale = getDefaultLocale();
      if (locale !== initialLocale) {
          setLocale(initialLocale);
      }
  }, [locale, setLocale]); // Only update if locale differs from evaluated default


  const handleSetLocale = useCallback((newLocale: string) => {
     // Check if the new locale is valid and different from the current one
    if (['en', 'es'].includes(newLocale) && newLocale !== locale) {
        setLocale(newLocale); // Update state and localStorage via useLocalStorage hook
    } else if (newLocale === locale) {
        // console.log(`Locale ${newLocale} is already set.`);
    } else {
        console.warn(`Locale "${newLocale}" is not supported.`);
    }
  }, [locale, setLocale]);


  // Translation function
  const t = useCallback((key: string, options?: Record<string, string | number>): string => {
      // Use the state `locale` which is updated via useLocalStorage
      const currentSelectedLocale = locale || 'en'; // Fallback if locale is somehow null
      const currentTranslations = translations[currentSelectedLocale] || translations['en']; // Fallback to English
      let translation = getNestedValue(currentTranslations, key);

      if (translation === undefined) {
        // Avoid excessive warnings for common keys like favicon during dev
        if (key !== 'favicon.ico') {
            console.warn(`Translation key "${key}" not found for locale "${currentSelectedLocale}"`);
        }
        translation = key; // Return the key if not found
      }

      // Handle interpolation
      if (options && typeof translation === 'string') {
        Object.keys(options).forEach(placeholder => {
            const regex = new RegExp(`{{${placeholder}}}`, 'g');
            translation = translation!.replace(regex, String(options[placeholder]));
        });
      }

      return translation || key; // Return key if translation somehow becomes null/undefined after interpolation
  }, [locale]); // Depend only on the current state `locale`


  const contextValue = {
    locale, // The actual current locale state
    setLocale: handleSetLocale, // Use the handler that updates localStorage
    t,
    currentLocale: locale, // Provide current locale directly
  };

  // Render children only when the client is hydrated to avoid mismatches
  return (
    <LocaleContext.Provider value={contextValue}>
      {isClient ? children : null /* Or a loading indicator */}
    </LocaleContext.Provider>
  );
};
