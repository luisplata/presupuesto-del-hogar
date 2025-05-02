
// components/ProductHistory.tsx

import type { Expense } from '@/types/expense';
import React, { useState, useMemo, useCallback } from 'react';
import { ExpenseList } from './ExpenseList';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface ProductHistoryProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  onDeleteProduct: (productName: string) => void; // Add prop for product delete handler
}

// Helper to get unique products including 'all'
const getUniqueProducts = (expenses: Expense[]): string[] => {
  const products = new Set(expenses.map(e => e.product));
  // Ensure 'all' is always an option and products are sorted
  return ['all', ...Array.from(products).sort()];
};

// Helper to filter expenses based on the selected product
const filterExpenses = (expenses: Expense[], selectedProduct: string): Expense[] => {
  if (selectedProduct === 'all') {
    return expenses; // Return all expenses if 'all' is selected
  }
  // Otherwise, filter by the specific product
  return expenses.filter(expense => expense.product === selectedProduct);
};

export function ProductHistory({ expenses, onDeleteExpense, onDeleteProduct }: ProductHistoryProps) {
  // State for the currently selected product in the dropdown
  const [selectedProduct, setSelectedProduct] = useState<string>('all');

  // Memoize the list of unique products to avoid recalculation unless expenses change
  const uniqueProducts = useMemo(() => getUniqueProducts(expenses), [expenses]);

  // Memoize the filtered list of expenses based on the selected product and expenses array
  const filteredExpenses = useMemo(() => filterExpenses(expenses, selectedProduct), [expenses, selectedProduct]);

  // Memoize the handler function for the Select component's onValueChange event
  const handleProductChange = useCallback((value: string | undefined) => {
     if (value !== undefined) {
        setSelectedProduct(value);
     }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial por Producto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="product-select">Seleccionar Producto:</Label>
          {/* Select component controlled by selectedProduct state */}
          <Select onValueChange={handleProductChange} value={selectedProduct}>
            <SelectTrigger id="product-select" className="w-full md:w-[280px] mt-1">
              {/* Displays the current value or a placeholder */}
              <SelectValue placeholder="Seleccionar Producto" />
            </SelectTrigger>
            <SelectContent>
              {/* Map through unique products to create SelectItem options */}
              {uniqueProducts.map(product => (
                <SelectItem key={product} value={product}>
                  {/* Display 'Todos los Productos' for the 'all' value */}
                  {product === 'all' ? 'Todos los Productos' : product}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Display the list of expenses, filtered based on the selection */}
        <ExpenseList
            expenses={filteredExpenses}
            onDeleteExpense={onDeleteExpense} // Pass expense delete handler down
            onDeleteProduct={selectedProduct !== 'all' ? onDeleteProduct : undefined} // Pass product delete handler only when a specific product is selected
            // Dynamic title and caption based on the selected product
            title={selectedProduct === 'all' ? "Historial Completo" : `Historial de ${selectedProduct}`}
            caption={selectedProduct === 'all' ? "Todos los gastos registrados." : `Gastos registrados para ${selectedProduct}.`}
        />
      </CardContent>
    </Card>
  );
}
