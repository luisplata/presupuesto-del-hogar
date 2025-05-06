
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
  onDeleteProduct: (productName: string) => void; // Keep specific prop for clarity in Home
  defaultCategoryKey: string; // Receive the key for the default category
}

// Helper to get unique products including 'all'
const getUniqueProducts = (expenses: Expense[]): string[] => {
  const products = new Set(expenses.map(e => e.product.name));
  // Ensure 'all' is first, then sort the rest
  return ['all', ...Array.from(products).sort()];
};

// Helper to filter expenses based on the selected product
const filterExpenses = (expenses: Expense[], selectedProduct: string): Expense[] => {
  if (selectedProduct === 'all') {
    return expenses;
  }
  return expenses.filter(expense => expense.product.name === selectedProduct);
};

export function ProductHistory({ expenses, onDeleteExpense, onDeleteProduct, defaultCategoryKey }: ProductHistoryProps) {
  const [selectedProduct, setSelectedProduct] = useState<string>('all');

  const uniqueProducts = useMemo(() => getUniqueProducts(expenses), [expenses]);
  const filteredExpenses = useMemo(() => filterExpenses(expenses, selectedProduct), [expenses, selectedProduct]);

  const handleProductChange = useCallback((value: string | undefined) => {
     if (value !== undefined) {
        setSelectedProduct(value);
     }
  }, []);

  // Hardcoded Spanish text
  const selectedProductDisplay = selectedProduct === 'all' ? 'Todos los Productos' : selectedProduct;
  const title = selectedProduct === 'all' ? 'Historial Completo por Producto' : `Historial de ${selectedProduct}`;
  const caption = selectedProduct === 'all' ? 'Todos los gastos registrados.' : `Gastos registrados para ${selectedProduct}.`;


  return (
    <Card>
       {/* Adjust padding */}
      <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
        <CardTitle className="text-lg sm:text-xl">Historial por Producto</CardTitle>
      </CardHeader>
       {/* Adjust padding and select width */}
      <CardContent className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
        <div>
          <Label htmlFor="product-select" className="text-xs sm:text-sm">Seleccionar Producto:</Label>
           {/* Make select full width on small screens */}
          <Select onValueChange={handleProductChange} value={selectedProduct}>
            <SelectTrigger id="product-select" className="w-full mt-1">
              <SelectValue placeholder="Seleccionar Producto">
                {selectedProductDisplay}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {uniqueProducts.map(product => (
                <SelectItem key={product} value={product}>
                  {product === 'all' ? 'Todos los Productos' : product}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

         {/* Pass down props to ExpenseList which handles its own responsiveness */}
        <ExpenseList
            expenses={filteredExpenses}
            onDeleteExpense={onDeleteExpense}
            groupName={selectedProduct !== 'all' ? selectedProduct : undefined}
            onDeleteGroup={selectedProduct !== 'all' ? onDeleteProduct : undefined}
            groupTypeLabel={selectedProduct !== 'all' ? 'Producto' : undefined} // Hardcoded Spanish label
            groupDisplayName={selectedProduct !== 'all' ? selectedProduct : undefined} // Product name is the display name
            title={title}
            caption={caption}
            defaultCategoryKey={defaultCategoryKey} // Pass key down
        />
      </CardContent>
    </Card>
  );
}

    