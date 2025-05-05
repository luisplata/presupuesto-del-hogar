
// src/contexts/LocaleContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

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

const loadMessages = async (locale: string): Promise<Translations> => {
  console.log('loadMessages called with locale:', locale);
  try {
      // Construct the correct path relative to the public directory
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/locales/${locale}.json`);
      if (response.ok) {
          const loadedTranslations = await response.json();
          return loadedTranslations; // Return the fetched JSON
      } else {
          console.error(`Failed to load locale file (${locale}.json): ${response.status} ${response.statusText}`);
          return {}; // Return empty object on fetch failure
      }
  } catch (error) {
      console.error(`Error fetching locale file (${locale}.json):`, error);
      return {}; // Return empty object on network or parsing error
  }
};


// Function to get nested translation value
const getNestedValue = (obj: Translations | undefined, key: string): string | undefined => {
   // Handle cases where obj might be undefined (e.g., locale file not loaded yet)
   if (!obj) {
       return undefined;
   }
  const keys = key.split('.');
  let current: string | NestedTranslations | undefined = obj;

  for (const k of keys) {
    if (typeof current === 'object' && current !== null && k in current) {
      // Type assertion needed because TypeScript doesn't know the structure precisely
      current = (current as NestedTranslations)[k];
    } else {
      return undefined; // Key not found
    }
  }

  // Check if the final value is a string before returning
  return typeof current === 'string' ? current : undefined;
};


// Create the provider component
export const LocaleProvider: React.FC<LocaleProviderProps> = ({ children }) => {
  // Use useLocalStorage to manage locale state persistence
  // Default to 'en' if localStorage is empty or invalid
  const [locale, setLocale] = useLocalStorage<string>('locale', 'en');
  const [isClient, setIsClient] = useState(false);
  const [translations, setTranslations] = useState<Record<string, Translations>>({});
  const [isLoading, setIsLoading] = useState(true); // Add loading state


  // Track client-side hydration
  useEffect(() => {
      setIsClient(true);
  }, []);

   // Load initial locale and translations on client mount
  useEffect(() => {
    if (isClient) {
      const storedLocale = localStorage.getItem('locale');
      const initialLocale = storedLocale && ['en', 'es'].includes(JSON.parse(storedLocale)) ? JSON.parse(storedLocale) : 'en';
      // Set locale state without triggering localStorage write yet if it matches initial
      setLocale(initialLocale);
       // Load messages for the initial locale
       loadMessages(initialLocale).then(loadedTranslations => {
           setTranslations({ [initialLocale]: loadedTranslations });
           setIsLoading(false); // Mark loading as complete
       });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]); // Run only once on client mount

  // Load translations when locale changes (after initial load)
  useEffect(() => {
      if (isClient && !isLoading && !translations[locale]) { // Only load if not already loaded
          setIsLoading(true); // Set loading true when changing locale
          loadMessages(locale).then(loadedTranslations => {
              setTranslations(prev => ({ ...prev, [locale]: loadedTranslations }));
              setIsLoading(false);
          });
      }
  }, [locale, isClient, isLoading, translations]);


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
        const currentTranslations = translations[currentSelectedLocale]; // Use loaded translations

        // If translations haven't loaded for the current locale, return the key
        if (!currentTranslations) {
            // Avoid excessive warnings during initial load or locale change
            if (!isLoading && key !== 'favicon.ico') {
                console.warn(`Translations not loaded yet for locale "${currentSelectedLocale}", key: "${key}"`);
            }
            return key;
        }

        let translation = getNestedValue(currentTranslations, key);

        if (translation === undefined) {
            // Avoid excessive warnings for common keys like favicon during dev
            if (key !== 'favicon.ico') {
                 // Only warn if not loading
                 if (!isLoading) {
                     console.warn(`Translation key "${key}" not found for locale "${currentSelectedLocale}"`);
                 }
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
    }, [locale, translations, isLoading]);


  const contextValue = useMemo(() => ({
    locale, // The actual current locale state
    setLocale: handleSetLocale, // Use the handler that updates localStorage
    t,
    currentLocale: locale, // Provide current locale directly
  }), [locale, handleSetLocale, t]);


  // Render children only when the client is hydrated and initial locale is loaded
  return (
    <LocaleContext.Provider value={contextValue}>
      {(isClient && !isLoading) ? children : null /* Or a loading skeleton */}
    </LocaleContext.Provider>
  );
};
