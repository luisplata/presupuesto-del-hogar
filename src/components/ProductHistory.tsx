
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
      <CardHeader>
        <CardTitle>Historial por Producto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="product-select">Seleccionar Producto:</Label>
          <Select onValueChange={handleProductChange} value={selectedProduct}>
            <SelectTrigger id="product-select" className="w-full md:w-[280px] mt-1">
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
