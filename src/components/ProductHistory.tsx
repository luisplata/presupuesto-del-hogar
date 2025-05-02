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
  const [selectedProduct, setSelectedProduct] = useState<string | undefined>(undefined);

  const uniqueProducts = useMemo(() => {
    const products = new Set(expenses.map(e => e.product));
    return Array.from(products).sort(); // Sort products alphabetically
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    if (!selectedProduct || selectedProduct === 'all') {
      return expenses;
    }
    return expenses.filter(expense => expense.product === selectedProduct);
  }, [expenses, selectedProduct]);

  const handleProductChange = (value: string) => {
    setSelectedProduct(value === 'all' ? undefined : value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial por Producto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="product-select">Seleccionar Producto:</Label>
          <Select onValueChange={handleProductChange} value={selectedProduct || 'all'}>
            <SelectTrigger id="product-select" className="w-full md:w-[280px] mt-1">
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
            title={selectedProduct ? `Historial de ${selectedProduct}` : "Historial Completo"}
            caption={selectedProduct ? `Gastos registrados para ${selectedProduct}.` : "Todos los gastos registrados."}
        />
      </CardContent>
    </Card>
  );
}
