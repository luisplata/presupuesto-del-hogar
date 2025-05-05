
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
  isLoaded: boolean; // Flag to indicate if translations are loaded
}
// Create the context with a default value
export const LocaleContext = createContext<LocaleContextType>({
  locale: 'en', // Sensible default
  setLocale: () => {},
  t: (key) => key, // Default translation function returns the key
  currentLocale: 'en',
  isLoaded: false, // Initially not loaded
});

// Define the provider props
interface LocaleProviderProps {
  children: ReactNode;
}

const loadMessages = async (locale: string): Promise<Translations> => {
  // Prevent server-side execution
  if (typeof window === 'undefined') {
    // console.warn("Attempted to load messages on the server.");
    return {};
  }
  console.log(`[Locale] Attempting to load messages for locale: ${locale}`);
  try {
      // Construct the correct path relative to the public directory
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const path = `${basePath}/locales/${locale}.json`;
      console.log(`[Locale] Fetching from path: ${path}`);
      const response = await fetch(path);
      if (response.ok) {
          const loadedTranslations = await response.json();
          console.log(`[Locale] Successfully loaded translations for ${locale}. Keys: ${Object.keys(loadedTranslations).slice(0, 5).join(', ')}...`);
          return loadedTranslations; // Return the fetched JSON
      } else {
          console.error(`[Locale] Failed to load locale file (${locale}.json) from ${path}: ${response.status} ${response.statusText}`);
          return {}; // Return empty object on fetch failure
      }
  } catch (error) {
      console.error(`[Locale] Error fetching locale file (${locale}.json):`, error);
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
  const [isLoaded, setIsLoaded] = useState(false); // Track loading state

  // Track client-side hydration
  useEffect(() => {
      console.log("[Locale] Component mounted, setting isClient to true.");
      setIsClient(true);
  }, []);

  // Load translations when locale changes or on initial client mount
  useEffect(() => {
    if (isClient && locale) { // Ensure locale is set and we are on the client
      // Check if translations for the current locale are already loaded
       if (!translations[locale]) {
          console.log(`[Locale] Translations for "${locale}" not in state, initiating load...`);
          setIsLoaded(false); // Set loading state
          loadMessages(locale).then(loadedTranslations => {
              // Check if translations were successfully loaded
              if (Object.keys(loadedTranslations).length > 0) {
                 setTranslations(prev => {
                    console.log(`[Locale] Setting translations state for "${locale}"`);
                    return { ...prev, [locale]: loadedTranslations };
                 });
                 setIsLoaded(true); // Set loaded state
                 console.log(`[Locale] Translations for "${locale}" loaded and state set.`);
              } else {
                 console.warn(`[Locale] Loaded empty translations for locale "${locale}". Check file path and content.`);
                 setIsLoaded(true); // Still set loaded to true to avoid blocking render indefinitely
              }
          }).catch(error => {
              console.error(`[Locale] Error during translation loading for "${locale}":`, error);
              setIsLoaded(true); // Set loaded even on error to prevent infinite loading state
          });
       } else {
          console.log(`[Locale] Translations for "${locale}" already in state.`);
          // Ensure isLoaded is true if translations are already present
          if (!isLoaded) {
              setIsLoaded(true);
          }
       }
    } else {
        console.log(`[Locale] Skipping translation load: isClient=${isClient}, locale=${locale}`);
    }
  }, [locale, isClient, translations]); // Depend on translations state as well


  const handleSetLocale = useCallback((newLocale: string) => {
    if (['en', 'es'].includes(newLocale)) {
        console.log(`[Locale] Setting locale to: ${newLocale}`);
        setLocale(newLocale); // Update state and localStorage via useLocalStorage hook
        // No need to manually set isLoaded here, the useEffect will handle it
    } else {
        console.warn(`[Locale] Locale "${newLocale}" is not supported.`);
    }
  }, [setLocale]);


  // Translation function
  const t = useCallback((key: string, options?: Record<string, string | number>): string => {
        // Use the state `locale` which is updated via useLocalStorage
        const currentSelectedLocale = locale || 'en'; // Fallback if locale is somehow null
        const currentTranslations = translations[currentSelectedLocale]; // Use loaded translations

        // If not on client, translations not loaded for the locale, or context not fully loaded yet, return the key
        if (!isClient || !isLoaded || !currentTranslations) {
            // Avoid excessive logging for common issues like missing favicons during dev
            // Log only if client-side, loaded, and it's not a commonly ignored key
            if (isClient && isLoaded && !currentTranslations && key !== 'favicon.ico') {
                console.warn(`[Locale] Translation function 't' called, but translations for locale "${currentSelectedLocale}" are missing in state. Key: "${key}"`);
            } else if (!isClient) {
                 // console.log(`[Locale] Translation function 't' called server-side for key: "${key}"`);
            } else if (!isLoaded) {
                // console.log(`[Locale] Translation function 't' called before fully loaded for locale "${currentSelectedLocale}", key: "${key}"`);
            }
            return key;
        }

        let translation = getNestedValue(currentTranslations, key);

        if (translation === undefined) {
             // Log only if client-side and not a common ignored key
            if (isClient && key !== 'favicon.ico') {
                 console.warn(`[Locale] Translation key "${key}" not found for locale "${currentSelectedLocale}"`);
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
    }, [locale, translations, isClient, isLoaded]); // Add isClient and isLoaded dependency


  const contextValue = useMemo(() => ({
    locale, // The actual current locale state
    setLocale: handleSetLocale, // Use the handler that updates localStorage
    t,
    currentLocale: locale, // Provide current locale directly
    isLoaded, // Provide loading status
  }), [locale, handleSetLocale, t, isLoaded]);

  // Optional: Render a loading state or null while loading initially on the client
  // We rely on individual components using isLoaded or checking state now
  // if (!isClient || !isLoaded) {
  //    return null; // Or a loading spinner
  // }

  return (
    <LocaleContext.Provider value={contextValue}>
      {children}
    </LocaleContext.Provider>
  );
};
