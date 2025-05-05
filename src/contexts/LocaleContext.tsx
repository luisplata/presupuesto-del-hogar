
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
  // Prevent server-side execution
  if (typeof window === 'undefined') {
    console.warn("Attempted to load messages on the server.");
    return {};
  }
  console.log(`Loading messages for locale: ${locale}`);
  try {
      // Construct the correct path relative to the public directory
      // Ensure NEXT_PUBLIC_BASE_PATH is defined in your env or default to ''
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const path = `${basePath}/locales/${locale}.json`;
      console.log(`Fetching from path: ${path}`);
      const response = await fetch(path);
      if (response.ok) {
          const loadedTranslations = await response.json();
          console.log(`Successfully loaded translations for ${locale}`);
          return loadedTranslations; // Return the fetched JSON
      } else {
          console.error(`Failed to load locale file (${locale}.json) from ${path}: ${response.status} ${response.statusText}`);
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
  const [locale, setLocale] = useLocalStorage<string>('locale', 'en');
  const [isClient, setIsClient] = useState(false);
  const [translations, setTranslations] = useState<Record<string, Translations>>({});

  // Track client-side hydration
  useEffect(() => {
      setIsClient(true);
       // Determine initial locale on client mount
       const storedLocale = localStorage.getItem('locale');
       let initialLocale = 'en'; // Default
       if (storedLocale) {
           try {
               const parsedLocale = JSON.parse(storedLocale);
               if (['en', 'es'].includes(parsedLocale)) {
                   initialLocale = parsedLocale;
               }
           } catch (e) {
               console.error("Error parsing stored locale", e);
               // Use default 'en' if parsing fails
           }
       }
        // Important: Set the locale state *after* confirming client-side
        // This avoids potential mismatches if useLocalStorage initializes differently server-side
        setLocale(initialLocale);
  }, [setLocale]); // Add setLocale as dependency

  // Load translations when locale changes or on initial client mount
  useEffect(() => {
    if (isClient && locale) { // Ensure locale is set
      // Check if translations for the current locale are already loaded
      if (!translations[locale]) {
          console.log(`Translations for "${locale}" not found, loading...`);
          loadMessages(locale).then(loadedTranslations => {
              // Check if translations were successfully loaded
              if (Object.keys(loadedTranslations).length > 0) {
                 setTranslations(prev => ({ ...prev, [locale]: loadedTranslations }));
              } else {
                 console.warn(`Loaded empty translations for locale "${locale}". Check file path and content.`);
              }
          });
      } else {
          console.log(`Translations for "${locale}" already loaded.`);
      }
    }
  }, [locale, isClient, translations]); // Depend on translations to avoid re-fetching if already loaded


  const handleSetLocale = useCallback((newLocale: string) => {
    if (['en', 'es'].includes(newLocale)) {
        setLocale(newLocale); // Update state and localStorage via useLocalStorage hook
    } else {
        console.warn(`Locale "${newLocale}" is not supported.`);
    }
  }, [setLocale]);


  // Translation function
  const t = useCallback((key: string, options?: Record<string, string | number>): string => {
        // Use the state `locale` which is updated via useLocalStorage
        const currentSelectedLocale = locale || 'en'; // Fallback if locale is somehow null
        const currentTranslations = translations[currentSelectedLocale]; // Use loaded translations

        // If translations haven't loaded for the current locale, return the key
        if (!isClient || !currentTranslations) {
            // Log only if client-side and not a common ignored key
            if (isClient && key !== 'favicon.ico') {
                 console.warn(`Translations not available yet for locale "${currentSelectedLocale}", key: "${key}"`);
            }
            return key;
        }

        let translation = getNestedValue(currentTranslations, key);

        if (translation === undefined) {
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
    }, [locale, translations, isClient]); // Add isClient dependency


  const contextValue = useMemo(() => ({
    locale, // The actual current locale state
    setLocale: handleSetLocale, // Use the handler that updates localStorage
    t,
    currentLocale: locale, // Provide current locale directly
  }), [locale, handleSetLocale, t]);

  // Render children only when the client is hydrated AND translations for the current locale are loaded
  const translationsLoaded = isClient && !!translations[locale];

  // Optional: Render a loading state or null while loading
  if (!translationsLoaded) {
     // You might want to return null or a loading indicator here
     // console.log(`Waiting for client hydration or translations for locale "${locale}"...`);
     return null;
  }

  return (
    <LocaleContext.Provider value={contextValue}>
      {children}
    </LocaleContext.Provider>
  );
};

