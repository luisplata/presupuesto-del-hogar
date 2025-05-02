
// hooks/useLocalStorage.ts

import { useState, useCallback } from 'react';

// Function to safely get value from localStorage
const safelyGetLocalStorageItem = <T>(key: string, initialValue: T): T => {
  // Prevent server-side execution
  if (typeof window === 'undefined') {
    return initialValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    // Parse stored json or return initialValue if item is null/undefined
    return item ? JSON.parse(item) : initialValue;
  } catch (error) {
    console.error(`Error reading localStorage key “${key}”:`, error);
    return initialValue;
  }
};

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Initialize state directly from localStorage (or initialValue) on the client
  const [storedValue, setStoredValue] = useState<T>(() =>
    safelyGetLocalStorageItem(key, initialValue)
  );

  // Return a memoized version of setValue to prevent unnecessary re-renders
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    // Allow value to be a function so we have the same API as useState
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    // Save state
    setStoredValue(valueToStore);
    // Save to local storage (client-side only)
    if (typeof window !== 'undefined') {
       try {
           window.localStorage.setItem(key, JSON.stringify(valueToStore));
       } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
       }
    }
  }, [key, storedValue]); // Dependencies for useCallback


  return [storedValue, setValue];
}

export default useLocalStorage;
