
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
  isValid,
  startOfDay,
  endOfDay,
  format, // Import format for better control
  parse // Import parse for custom formats
} from 'date-fns';
// Correct import paths for locales
import { es } from 'date-fns/locale/es';
import { enUS } from 'date-fns/locale/en-US'; // Keep enUS for fallback logic if needed elsewhere
import type { Expense } from '@/types/expense';

// Helper to safely parse date strings or use Date objects
export const safelyParseDate = (date: Date | string | number): Date | null => {
  if (date instanceof Date && isValid(date)) {
    return date;
  }
  if (typeof date === 'string') {
    // 1. Try parsing ISO format first (more robust)
    const parsedISO = parseISO(date);
    if (isValid(parsedISO)) {
      return parsedISO;
    }
    // 2. Try parsing the 'dd/MM/yyyy HH:mm' format (common in Excel export/import)
    try {
        // Reference date 'new Date()' is needed for parse if only time is provided, but here we have full date/time
        const parsedCustom = parse(date, 'dd/MM/yyyy HH:mm', new Date(), { locale: es });
        if (isValid(parsedCustom)) {
            return parsedCustom;
        }
    } catch (e) {
        // Ignore parsing errors for this format and continue trying others
    }
    // 3. Try parsing just the date part 'dd/MM/yyyy' (potential Excel format)
     try {
        const parsedDateOnly = parse(date, 'dd/MM/yyyy', new Date(), { locale: es });
        if (isValid(parsedDateOnly)) {
            return parsedDateOnly; // Return date at start of day
        }
     } catch (e) {
         // Ignore parsing errors
     }

    // Add other potential string format parsing if needed here
  }
  if (typeof date === 'number') {
      // Assume it's a timestamp if it's a number
      const parsedTimestamp = new Date(date);
      if (isValid(parsedTimestamp)) {
          return parsedTimestamp;
      }
  }
  console.warn('Fecha inválida encontrada o formato no reconocido:', date); // Hardcoded Spanish warning
  return null;
};

export const filterExpensesByPeriod = (
  expenses: Expense[],
  period: 'week' | 'bi-weekly' | 'month'
): Expense[] => {
  const now = new Date();
  let start: Date;
  let end: Date;

  switch (period) {
    case 'week':
      // Start week on Monday (locale can influence this, adjust if needed)
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case 'month':
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
    case 'bi-weekly':
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const midMonth = endOfDay(new Date(now.getFullYear(), now.getMonth(), 15)); // End of the 15th

      if (now <= midMonth) {
        // First half of the month (1st to 15th)
        start = startOfDay(monthStart);
        end = midMonth;
      } else {
        // Second half of the month (16th to end)
        start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 16));
        end = endOfDay(monthEnd); // Ensure it covers the full end day
      }
      break;
    default:
      return [];
  }

  // Ensure start and end cover the entire day boundaries precisely
  start = startOfDay(start);
  end = endOfDay(end); // Ensure end of the period includes the whole day

  return expenses.filter((expense) => {
    const expenseDate = safelyParseDate(expense.timestamp);
    // Make sure the date is valid and falls within the interval
    return expenseDate && isWithinInterval(expenseDate, { start, end });
  });
};

export const calculateTotal = (expenses: Expense[]): number => {
  return expenses.reduce((sum, expense) => sum + (expense.price || 0), 0); // Handle potential undefined price
};

// Keep using es-CO for currency formatting as it's specific to Colombian Pesos
const COP_FORMATTER = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

export const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        amount = 0; // Default to 0 if null, undefined, or NaN
    }
    return COP_FORMATTER.format(amount);
};

export const parseCurrency = (formattedValue: string | number | null | undefined): number => {
    if (formattedValue === null || formattedValue === undefined) {
        return 0;
    }
    // Convert to string if it's a number
    const stringValue = String(formattedValue);
    // Remove non-digit characters EXCEPT the decimal separator if needed (not needed for COP integer format)
    const numericString = stringValue.replace(/[^\d]/g, '');
    const number = parseInt(numericString, 10);
    return isNaN(number) ? 0 : number; // Return 0 if parsing fails or result is NaN
};

// Updated formatDate to default to Spanish locale
export const formatDate = (date: Date | string | number): string => {
    const validDate = safelyParseDate(date);
    if (!validDate) return 'Fecha inválida'; // Hardcoded Spanish

    // Use Spanish locale by default
    const dateFnsLocale = es;

    try {
        // Use date-fns format with the Spanish locale for consistency with export/import
        return format(validDate, 'dd/MM/yyyy HH:mm', { locale: dateFnsLocale });
    } catch (error) {
        console.error("Error al formatear fecha:", error, "Fecha de entrada:", date, "Fecha parseada:", validDate);
        // Fallback or simpler format if locale causes issues
        return validDate.toLocaleDateString('es-ES') + ' ' + validDate.toLocaleTimeString('es-ES'); // Use Spanish locale for fallback
    }
}

