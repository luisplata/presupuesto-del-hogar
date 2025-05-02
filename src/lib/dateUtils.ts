
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
} from 'date-fns';
import { es } from 'date-fns/locale'; // Import Spanish locale if needed
import type { Expense } from '@/types/expense';

// Helper to safely parse date strings or use Date objects
const safelyParseDate = (date: Date | string | number): Date | null => {
  if (date instanceof Date && isValid(date)) {
    return date;
  }
  if (typeof date === 'string') {
    // Try parsing ISO format first
    const parsedISO = parseISO(date);
    if (isValid(parsedISO)) {
      return parsedISO;
    }
    // Add other potential string format parsing if needed
  }
  if (typeof date === 'number') {
      // Assume it's a timestamp if it's a number
      const parsedTimestamp = new Date(date);
      if (isValid(parsedTimestamp)) {
          return parsedTimestamp;
      }
  }
  console.warn('Invalid date encountered:', date);
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

const COP_FORMATTER = new Intl.NumberFormat('es-CO', { // Use Spanish - Colombia locale
    style: 'currency',
    currency: 'COP', // Set currency code to COP
    minimumFractionDigits: 0, // COP typically doesn't use cents
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
    // Remove non-digit characters (currency symbols, dots, commas)
    const numericString = stringValue.replace(/[^\d]/g, '');
    const number = parseInt(numericString, 10);
    return isNaN(number) ? 0 : number; // Return 0 if parsing fails or result is NaN
};


export const formatDate = (date: Date | string | number): string => {
    const validDate = safelyParseDate(date);
    if (!validDate) return 'Fecha inválida';

    // Use date-fns format for flexible and localized date formatting
    // Example: 'dd/MM/yyyy HH:mm:ss'
    // Locale can be passed for month/day names: format(validDate, 'Pp', { locale: es })
    try {
        return format(validDate, 'dd/MM/yyyy HH:mm', { locale: es }); // Format with Spanish locale
    } catch (error) {
        console.error("Error formatting date:", error, "Input date:", date, "Parsed date:", validDate);
        // Fallback or simpler format if locale causes issues
        return validDate.toLocaleDateString() + ' ' + validDate.toLocaleTimeString();
    }
}
