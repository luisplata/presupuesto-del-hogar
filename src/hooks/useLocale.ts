
// src/hooks/useLocale.ts
import { useContext } from 'react';
import { LocaleContext } from '@/contexts/LocaleContext';

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};
