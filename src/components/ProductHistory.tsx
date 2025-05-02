// components/ProductHistory.tsx
"use client";

import type { Expense } from '@/types/expense';
import { useState, useMemo } from 'react';
import { ExpenseList } from './ExpenseList';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface ProductHistoryProps {
  expenses: Expense[];
}

export function ProductHistory({ expenses }: ProductHistoryProps) {
  // Use 'all' as the default state value instead of undefined
  const [selectedProduct, setSelectedProduct] = useState<string>('all');

  const uniqueProducts = useMemo(() => {
    const products = new Set(expenses.map(e => e.product));
    return Array.from(products).sort(); // Sort products alphabetically
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    // Check against 'all' directly
    if (selectedProduct === 'all') {
      return expenses;
    }
    return expenses.filter(expense => expense.product === selectedProduct);
  }, [expenses, selectedProduct]);

  const handleProductChange = (value: string) => {
    // Directly set the selected value
    setSelectedProduct(value);
  };

  const displayProduct = selectedProduct === 'all' ? 'Todos los Productos' : selectedProduct;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial por Producto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="product-select">Seleccionar Producto:</Label>
          {/* Pass selectedProduct directly as the value */}
          <Select onValueChange={handleProductChange} value={selectedProduct}>
            <SelectTrigger id="product-select" className="w-full md:w-[280px] mt-1">
              {/* Ensure SelectValue displays the correct placeholder/value */}
              <SelectValue placeholder="Todos los Productos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Productos</SelectItem>
              {uniqueProducts.map(product => (
                <SelectItem key={product} value={product}>
                  {product}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ExpenseList
            expenses={filteredExpenses}
            // Adjust title and caption based on 'all'
            title={selectedProduct === 'all' ? "Historial Completo" : `Historial de ${selectedProduct}`}
            caption={selectedProduct === 'all' ? "Todos los gastos registrados." : `Gastos registrados para ${selectedProduct}.`}
        />
      </CardContent>
    </Card>
  );
}
