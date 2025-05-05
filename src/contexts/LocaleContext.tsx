
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

// Create the context with a default value
export const LocaleContext = createContext<LocaleContextType>({
  locale: 'en', // Default locale
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
  // Initialize state with the most likely default, will be updated by useEffect
  const [locale, setLocaleState] = useState<string>(router.defaultLocale || 'en');

  // Update locale state if router locale changes (runs client-side)
  useEffect(() => {
    // Use router.isReady to ensure router fields are populated client-side
    if (router.isReady) {
      const currentRouterLocale = router.locale || router.defaultLocale || 'en';
      if (locale !== currentRouterLocale) {
        setLocaleState(currentRouterLocale);
      }
    }
  }, [router.isReady, router.locale, router.defaultLocale, locale]); // Depend on router readiness and locale info

  const setLocale = useCallback((newLocale: string) => {
     // Ensure router is ready before attempting to push
    if (!router.isReady) {
        console.warn("Router not ready, skipping locale change");
        return;
    }
    if (router.locales?.includes(newLocale) && newLocale !== locale) {
      // Keep existing query parameters, change locale
      router.push({ pathname: router.pathname, query: router.query }, router.asPath, { locale: newLocale });
      // State update will be triggered by the useEffect above when router.locale changes
    } else if (newLocale === locale) {
        // Do nothing if locale is already set
    } else {
        console.warn(`Locale "${newLocale}" is not supported or router is not ready.`);
    }
  }, [router, locale]); // Depend on the whole router object and current locale


  // Translation function
  const t = useCallback((key: string, options?: Record<string, string | number>): string => {
      const currentTranslations = translations[locale] || translations['en']; // Fallback to English
      let translation = getNestedValue(currentTranslations, key);

      if (translation === undefined) {
        // Avoid excessive warnings for common keys like favicon during dev
        if (key !== 'favicon.ico') {
            console.warn(`Translation key "${key}" not found for locale "${locale}"`);
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
  }, [locale]);


  const contextValue = {
    locale,
    setLocale,
    t,
    currentLocale: locale, // Provide current locale directly
  };

  return (
    <LocaleContext.Provider value={contextValue}>
      {children}
    </LocaleContext.Provider>
  );
};
