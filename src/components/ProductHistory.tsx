
// components/ProductHistory.tsx

import type { Expense } from '@/types/expense';
import React, { useState, useMemo, useCallback } from 'react';
import { ExpenseList } from './ExpenseList';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/hooks/useLocale'; // Import useLocale

interface ProductHistoryProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  onDeleteProduct: (productName: string) => void; // Keep specific prop for clarity in Home
  defaultCategoryKey: string; // Receive the key for the default category
}

// Helper to get unique products including 'all'
const getUniqueProducts = (expenses: Expense[]): string[] => {
  const products = new Set(expenses.map(e => e.product));
  // Ensure 'all' is first, then sort the rest
  return ['all', ...Array.from(products).sort()];
};

// Helper to filter expenses based on the selected product
const filterExpenses = (expenses: Expense[], selectedProduct: string): Expense[] => {
  if (selectedProduct === 'all') {
    return expenses;
  }
  return expenses.filter(expense => expense.product === selectedProduct);
};

export function ProductHistory({ expenses, onDeleteExpense, onDeleteProduct, defaultCategoryKey }: ProductHistoryProps) {
  const { t } = useLocale(); // Use the hook
  const [selectedProduct, setSelectedProduct] = useState<string>('all');

  const uniqueProducts = useMemo(() => getUniqueProducts(expenses), [expenses]);
  const filteredExpenses = useMemo(() => filterExpenses(expenses, selectedProduct), [expenses, selectedProduct]);

  const handleProductChange = useCallback((value: string | undefined) => {
     if (value !== undefined) {
        setSelectedProduct(value);
     }
  }, []);

  const title = selectedProduct === 'all' ? t('history.allProducts') : `${t('history.productHistoryPrefix')} ${selectedProduct}`;
  const caption = selectedProduct === 'all' ? t('history.allExpensesCaption') : `${t('history.productExpensesCaptionPrefix')} ${selectedProduct}.`;


  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('history.titleByProduct')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="product-select">{t('history.selectProductLabel')}:</Label>
          <Select onValueChange={handleProductChange} value={selectedProduct}>
            <SelectTrigger id="product-select" className="w-full md:w-[280px] mt-1">
               {/* Display selected value */}
              <SelectValue placeholder={t('history.selectProductPlaceholder')}>
                {selectedProduct === 'all' ? t('history.allProductsOption') : selectedProduct}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {uniqueProducts.map(product => (
                <SelectItem key={product} value={product}>
                  {product === 'all' ? t('history.allProductsOption') : product}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Use the generic group deletion props for ExpenseList */}
        <ExpenseList
            expenses={filteredExpenses}
            onDeleteExpense={onDeleteExpense}
            groupName={selectedProduct !== 'all' ? selectedProduct : undefined}
            onDeleteGroup={selectedProduct !== 'all' ? onDeleteProduct : undefined}
            groupTypeLabel={selectedProduct !== 'all' ? t('history.productTypeLabel') : undefined}
            groupDisplayName={selectedProduct !== 'all' ? selectedProduct : undefined} // Product name is the display name
            title={title}
            caption={caption}
            defaultCategoryKey={defaultCategoryKey} // Pass key down
        />
      </CardContent>
    </Card>
  );
}
