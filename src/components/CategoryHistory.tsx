
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
  onDeleteCategory: (categoryIdentifier: string) => void; // Handler accepts the key or name
  defaultCategoryKey: string; // Receive the key for the default category
}

// Helper to get unique category identifiers (keys or names) including 'all'
const getUniqueCategoryIdentifiers = (expenses: Expense[], defaultCategoryKey: string): string[] => {
  const identifiers = new Set(expenses.map(e => e.category || defaultCategoryKey));
  // Ensure 'all' is first, then sort the rest (keys and names mixed)
  return ['all', ...Array.from(identifiers).sort()];
};

// Helper to filter expenses based on the selected category identifier
const filterExpensesByCategory = (expenses: Expense[], selectedIdentifier: string, defaultCategoryKey: string): Expense[] => {
  if (selectedIdentifier === 'all') {
    return expenses;
  }
  // Handle the default category key case during filtering
  return expenses.filter(expense => (expense.category || defaultCategoryKey) === selectedIdentifier);
};

export function CategoryHistory({ expenses, onDeleteExpense, onDeleteCategory, defaultCategoryKey }: CategoryHistoryProps) {
  const [selectedCategoryIdentifier, setSelectedCategoryIdentifier] = useState<string>('all'); // State holds the key or name

  const uniqueCategoryIdentifiers = useMemo(() => getUniqueCategoryIdentifiers(expenses, defaultCategoryKey), [expenses, defaultCategoryKey]);
  const filteredExpenses = useMemo(() => filterExpensesByCategory(expenses, selectedCategoryIdentifier, defaultCategoryKey), [expenses, selectedCategoryIdentifier, defaultCategoryKey]);

  const handleCategoryChange = useCallback((value: string | undefined) => {
     if (value !== undefined) {
        setSelectedCategoryIdentifier(value);
     }
  }, []);

  // Hardcoded Spanish text
  const selectedCategoryDisplay = selectedCategoryIdentifier === 'all' ? 'Todas las Categorías' : selectedCategoryIdentifier;

  const title = selectedCategoryIdentifier === 'all' ? 'Historial Completo por Categoría' : `Historial de ${selectedCategoryDisplay}`;
  const caption = selectedCategoryIdentifier === 'all' ? 'Todos los gastos registrados.' : `Gastos registrados para la categoría ${selectedCategoryDisplay}.`;


  return (
    <Card>
       {/* Adjust padding */}
      <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
        <CardTitle className="text-lg sm:text-xl">Historial por Categoría</CardTitle>
      </CardHeader>
       {/* Adjust padding and select width */}
      <CardContent className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
        <div>
          <Label htmlFor="category-select" className="text-xs sm:text-sm">Seleccionar Categoría:</Label>
           {/* Make select full width on small screens */}
          <Select onValueChange={handleCategoryChange} value={selectedCategoryIdentifier}>
            <SelectTrigger id="category-select" className="w-full mt-1">
              <SelectValue placeholder="Seleccionar Categoría">
                  {selectedCategoryDisplay}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {uniqueCategoryIdentifiers.map(identifier => (
                <SelectItem key={identifier} value={identifier}>
                  {identifier === 'all' ? 'Todas las Categorías' : identifier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Pass down props to ExpenseList which handles its own responsiveness */}
        <ExpenseList
            expenses={filteredExpenses}
            onDeleteExpense={onDeleteExpense}
            groupName={selectedCategoryIdentifier !== 'all' ? selectedCategoryIdentifier : undefined} // Pass the identifier
            onDeleteGroup={selectedCategoryIdentifier !== 'all' ? onDeleteCategory : undefined}
            groupTypeLabel={selectedCategoryIdentifier !== 'all' ? 'Categoría' : undefined} // Hardcoded Spanish label
            groupDisplayName={selectedCategoryDisplay} // Pass display name for UI display in ExpenseList
            title={title}
            caption={caption}
            defaultCategoryKey={defaultCategoryKey} // Pass default category key down
        />
      </CardContent>
    </Card>
  );
}

    