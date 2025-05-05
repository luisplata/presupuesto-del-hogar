
// src/components/LanguageSelector.tsx
import React from 'react';
import { useLocale } from '@/hooks/useLocale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label"; // Import Label for accessibility

export function LanguageSelector() {
  const { locale, setLocale, t } = useLocale();

  const handleLocaleChange = (newLocale: string) => {
    setLocale(newLocale);
  };

  return (
    <div className="flex items-center space-x-2">
        {/* Hide label visually but keep for screen readers */}
        <Label htmlFor="language-select" className="sr-only">{t('languageSelector.change')}</Label>
        <Select onValueChange={handleLocaleChange} value={locale}>
            <SelectTrigger id="language-select" className="w-[120px]">
                <SelectValue placeholder={t('languageSelector.change')} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="en">{t('languageSelector.en')}</SelectItem>
                <SelectItem value="es">{t('languageSelector.es')}</SelectItem>
                {/* Add more languages here */}
            </SelectContent>
        </Select>
    </div>

  );
}
