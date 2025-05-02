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
} from 'date-fns';
import type { Expense } from '@/types/expense';

// Helper to safely parse date strings or use Date objects
const safelyParseDate = (date: Date | string): Date | null => {
  if (date instanceof Date && isValid(date)) {
    return date;
  }
  if (typeof date === 'string') {
    const parsed = parseISO(date);
    if (isValid(parsed)) {
      return parsed;
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
      start = startOfWeek(now);
      end = endOfWeek(now);
      break;
    case 'month':
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
    case 'bi-weekly':
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const midMonth = new Date(now.getFullYear(), now.getMonth(), 15);

      if (now <= midMonth) {
        // First half of the month (1st to 15th)
        start = startOfDay(monthStart);
        end = endOfDay(midMonth);
      } else {
        // Second half of the month (16th to end)
        start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 16));
        end = endOfDay(monthEnd);
      }
      break;
    default:
      return [];
  }

  // Ensure start and end cover the entire day
  start = startOfDay(start);
  end = endOfDay(end);

  return expenses.filter((expense) => {
    const expenseDate = safelyParseDate(expense.timestamp);
    return expenseDate && isWithinInterval(expenseDate, { start, end });
  });
};

export const calculateTotal = (expenses: Expense[]): number => {
  return expenses.reduce((sum, expense) => sum + expense.price, 0);
};

export const formatCurrency = (amount: number): string => {
  // Simple formatter, consider using Intl.NumberFormat for better localization
  return `$${amount.toFixed(2)}`;
};

export const formatDate = (date: Date | string): string => {
    const validDate = safelyParseDate(date);
    if (!validDate) return 'Invalid Date';
    // Simple formatter, consider using date-fns format or Intl.DateTimeFormat
    return validDate.toLocaleString();
}
