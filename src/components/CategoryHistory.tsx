
// components/CategoryHistory.tsx

import type { Expense } from '@/types/expense';
import React, { useState, useMemo, useCallback } from 'react';
import { ExpenseList } from './ExpenseList';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface CategoryHistoryProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  onDeleteCategory: (categoryName: string) => void; // Handler to delete all expenses for a category
}

const DEFAULT_CATEGORY = 'no definido';

// Helper to get unique categories including 'all' and handling undefined/default
const getUniqueCategories = (expenses: Expense[]): string[] => {
  const categories = new Set(expenses.map(e => e.category || DEFAULT_CATEGORY));
  // Ensure 'all' is first, then sort the rest
  return ['all', ...Array.from(categories).sort()];
};

// Helper to filter expenses based on the selected category
const filterExpensesByCategory = (expenses: Expense[], selectedCategory: string): Expense[] => {
  if (selectedCategory === 'all') {
    return expenses;
  }
  // Handle the default category case during filtering
  return expenses.filter(expense => (expense.category || DEFAULT_CATEGORY) === selectedCategory);
};

export function CategoryHistory({ expenses, onDeleteExpense, onDeleteCategory }: CategoryHistoryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const uniqueCategories = useMemo(() => getUniqueCategories(expenses), [expenses]);
  const filteredExpenses = useMemo(() => filterExpensesByCategory(expenses, selectedCategory), [expenses, selectedCategory]);

  const handleCategoryChange = useCallback((value: string | undefined) => {
     if (value !== undefined) {
        setSelectedCategory(value);
     }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial por Categoría</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="category-select">Seleccionar Categoría:</Label>
          <Select onValueChange={handleCategoryChange} value={selectedCategory}>
            <SelectTrigger id="category-select" className="w-full md:w-[280px] mt-1">
              <SelectValue placeholder="Seleccionar Categoría" />
            </SelectTrigger>
            <SelectContent>
              {uniqueCategories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'Todas las Categorías' : category}
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
            groupTypeLabel={selectedCategory !== 'all' ? "Categoría" : undefined}
            title={selectedCategory === 'all' ? "Historial Completo por Categoría" : `Historial de ${selectedCategory}`}
            caption={selectedCategory === 'all' ? "Todos los gastos registrados." : `Gastos registrados para la categoría ${selectedCategory}.`}
        />
      </CardContent>
    </Card>
  );
}
