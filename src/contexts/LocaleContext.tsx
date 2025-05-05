
// src/contexts/LocaleContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/router';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

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
  currentLocale: string; // Add currentLocale for easier access outside components if needed
}

// Default locale determination (runs on both server and client initially)
const getDefaultLocale = (router: ReturnType<typeof useRouter>): string => {
    // On the server, router.locale might not be available yet, rely on defaultLocale
    // On the client, router.locale should be preferred after hydration
    return router.locale || router.defaultLocale || 'en';
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
  const router = useRouter();
  // Initialize state using the router's default locale or fallback
  const [locale, setLocaleState] = useState<string>(() => getDefaultLocale(router));
  const [isRouterReady, setIsRouterReady] = useState(false);

  // Track router readiness separately
  useEffect(() => {
      if (router.isReady) {
          setIsRouterReady(true);
      }
  }, [router.isReady]);


  // Update locale state based on router changes, only when router is ready
  useEffect(() => {
    if (isRouterReady) {
      const currentRouterLocale = router.locale || router.defaultLocale || 'en';
      if (locale !== currentRouterLocale) {
        // console.log(`Router locale changed to: ${currentRouterLocale}. Updating context.`);
        setLocaleState(currentRouterLocale);
      }
    }
     // Only depend on isRouterReady and router.locale (and defaultLocale for stability)
  }, [isRouterReady, router.locale, router.defaultLocale, locale]); // Added locale back as it should update if changed externally too


  const setLocale = useCallback((newLocale: string) => {
     // Ensure router is ready before attempting to push
    if (!isRouterReady) {
        console.warn("Router not ready, skipping locale change");
        return;
    }
    // Check if the new locale is valid and different from the current one
    if (router.locales?.includes(newLocale) && newLocale !== locale) {
      // console.log(`Attempting to change locale from ${locale} to ${newLocale}`);
      // Keep existing query parameters, change locale
      router.push({ pathname: router.pathname, query: router.query }, router.asPath, { locale: newLocale, scroll: false });
      // State update will be triggered by the useEffect above when router.locale changes
    } else if (newLocale === locale) {
        // console.log(`Locale ${newLocale} is already set.`);
        // Do nothing if locale is already set
    } else {
        console.warn(`Locale "${newLocale}" is not supported.`);
    }
    // Depend on router object fields that affect the push behavior and the current locale state
  }, [isRouterReady, router.pathname, router.query, router.asPath, router.locales, locale]);


  // Translation function
  const t = useCallback((key: string, options?: Record<string, string | number>): string => {
      // Use the state `locale` which is updated via useEffect
      const currentSelectedLocale = locale;
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
    setLocale,
    t,
    currentLocale: locale, // Provide current locale directly
  };

  // Render children only when the router is ready and locale is definitively set
  return (
    <LocaleContext.Provider value={contextValue}>
      {isRouterReady ? children : null /* Or a loading indicator */}
    </LocaleContext.Provider>
  );
};
