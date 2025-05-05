
// components/CategoryHistory.tsx

import type { Expense } from '@/types/expense';
import React, { useState, useMemo, useCallback } from 'react';
import { ExpenseList } from './ExpenseList';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/hooks/useLocale'; // Import useLocale

interface CategoryHistoryProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  onDeleteCategory: (categoryName: string) => void; // Handler to delete all expenses for a category
  defaultCategory: string; // Receive translated default category name
}

// Helper to get unique categories including 'all' and handling undefined/default
const getUniqueCategories = (expenses: Expense[], defaultCategory: string): string[] => {
  const categories = new Set(expenses.map(e => e.category || defaultCategory));
  // Ensure 'all' is first, then sort the rest
  return ['all', ...Array.from(categories).sort()];
};

// Helper to filter expenses based on the selected category
const filterExpensesByCategory = (expenses: Expense[], selectedCategory: string, defaultCategory: string): Expense[] => {
  if (selectedCategory === 'all') {
    return expenses;
  }
  // Handle the default category case during filtering
  return expenses.filter(expense => (expense.category || defaultCategory) === selectedCategory);
};

export function CategoryHistory({ expenses, onDeleteExpense, onDeleteCategory, defaultCategory }: CategoryHistoryProps) {
  const { t } = useLocale(); // Use the hook
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const uniqueCategories = useMemo(() => getUniqueCategories(expenses, defaultCategory), [expenses, defaultCategory]);
  const filteredExpenses = useMemo(() => filterExpensesByCategory(expenses, selectedCategory, defaultCategory), [expenses, selectedCategory, defaultCategory]);

  const handleCategoryChange = useCallback((value: string | undefined) => {
     if (value !== undefined) {
        setSelectedCategory(value);
     }
  }, []);

  const title = selectedCategory === 'all' ? t('history.allCategories') : `${t('history.categoryHistoryPrefix')} ${selectedCategory}`;
  const caption = selectedCategory === 'all' ? t('history.allExpensesCaption') : `${t('history.categoryExpensesCaptionPrefix')} ${selectedCategory}.`;


  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('history.titleByCategory')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="category-select">{t('history.selectCategoryLabel')}:</Label>
          <Select onValueChange={handleCategoryChange} value={selectedCategory}>
            <SelectTrigger id="category-select" className="w-full md:w-[280px] mt-1">
              <SelectValue placeholder={t('history.selectCategoryPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {uniqueCategories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? t('history.allCategoriesOption') : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Use the generic group deletion props for ExpenseList */}
        <ExpenseList
            expenses={filteredExpenses}
            onDeleteExpense={onDeleteExpense}
            // Pass generic props only when a specific category is selected
            groupName={selectedCategory !== 'all' ? selectedCategory : undefined}
            onDeleteGroup={selectedCategory !== 'all' ? onDeleteCategory : undefined}
            groupTypeLabel={selectedCategory !== 'all' ? t('history.categoryTypeLabel') : undefined}
            title={title}
            caption={caption}
            defaultCategory={defaultCategory} // Pass default category down
        />
      </CardContent>
    </Card>
  );
}
