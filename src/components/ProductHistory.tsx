
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
}

// Helper to get unique products including 'all'
const getUniqueProducts = (expenses: Expense[]): string[] => {
  const products = new Set(expenses.map(e => e.product));
  return ['all', ...Array.from(products).sort()];
};

// Helper to filter expenses based on the selected product
const filterExpenses = (expenses: Expense[], selectedProduct: string): Expense[] => {
  if (selectedProduct === 'all') {
    return expenses;
  }
  return expenses.filter(expense => expense.product === selectedProduct);
};

export function ProductHistory({ expenses, onDeleteExpense, onDeleteProduct }: ProductHistoryProps) {
  const { t } = useLocale(); // Use the hook
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const defaultCategoryTranslated = t('category.undefined'); // Get translated default

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
              <SelectValue placeholder={t('history.selectProductPlaceholder')} />
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
            // Pass generic props only when a specific product is selected
            groupName={selectedProduct !== 'all' ? selectedProduct : undefined}
            onDeleteGroup={selectedProduct !== 'all' ? onDeleteProduct : undefined}
            groupTypeLabel={selectedProduct !== 'all' ? t('history.productTypeLabel') : undefined}
            title={title}
            caption={caption}
            defaultCategory={defaultCategoryTranslated} // Pass translated default
        />
      </CardContent>
    </Card>
  );
}
