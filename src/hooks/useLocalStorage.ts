
// hooks/useLocalStorage.ts

import { useState, useCallback, useEffect } from 'react';

// Function to safely get value from localStorage
const safelyGetLocalStorageItem = <T>(key: string, initialValue: T): T => {
  // Prevent server-side execution
  if (typeof window === 'undefined') {
    return initialValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    // Parse stored json or return initialValue if item is null/undefined
    // Add check for empty string which JSON.parse fails on
    return item ? JSON.parse(item) : initialValue;
  } catch (error) {
    // Don't log error if item is just not found or empty
    if (error instanceof SyntaxError && window.localStorage.getItem(key) === '') {
         return initialValue;
    }
    console.error(`Error reading localStorage key “${key}”:`, error);
    return initialValue;
  }
};

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  // Initialize state with initialValue first.
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // State to track if we are on the client and mounted
  const [isClient, setIsClient] = useState(false);

  // useEffect to set isClient to true after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // useEffect to load the value from localStorage only on the client-side after mount
  useEffect(() => {
    // Only run on the client
    if (isClient) {
        setStoredValue(safelyGetLocalStorageItem(key, initialValue));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, isClient]); // Re-run only if key or isClient changes

  // Return a memoized version of setValue
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      // Only run on the client
      if (typeof window === 'undefined') {
          console.warn(`Attempted to set localStorage key “${key}” on the server.`);
          return;
      }
      try {
        // Allow value to be a function so we have the same API as useState
        // Use a functional update for setStoredValue to ensure we get the latest state
        setStoredValue(prevValue => {
            const valueToStore = value instanceof Function ? value(prevValue) : value;
            // Save to local storage
             window.localStorage.setItem(key, JSON.stringify(valueToStore));
             return valueToStore;
        });

      } catch (error) {
        console.error(`Error setting localStorage key “${key}”:`, error);
      }
    },
    // Remove storedValue from dependencies to make setValue stable
    [key]
  );

  // Return the state value that reflects localStorage only after client mount
  return [isClient ? storedValue : initialValue, setValue];
}

export default useLocalStorage;
