// app/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { ExpenseForm } from '@/components/ExpenseForm';
import { ExpenseSummary } from '@/components/ExpenseSummary';
import { ProductHistory } from '@/components/ProductHistory';
import { Toaster } from '@/components/ui/toaster';
import type { Expense } from '@/types/expense';
import useLocalStorage from '@/hooks/useLocalStorage'; // Import the custom hook
import { v4 as uuidv4 } from 'uuid'; // Keep uuid for ID generation if needed elsewhere or as fallback

export default function Home() {
  // Use the custom hook to manage expenses state with localStorage persistence
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);

  const handleAddExpense = (newExpenseData: Omit<Expense, 'id' | 'timestamp'>) => {
    const newExpense: Expense = {
      ...newExpenseData,
      id: uuidv4(), // Generate a unique ID using uuid
      timestamp: new Date(), // Record the current timestamp
    };
    setExpenses(prevExpenses => [...prevExpenses, newExpense]);
  };

  const handleDeleteExpense = (idToDelete: string) => {
    setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== idToDelete));
    // Optionally show a toast confirmation for deletion
    // toast({ title: "Gasto eliminado" });
  };


  return (
    <main className="container mx-auto p-4 min-h-screen">
       <header className="mb-8">
         <h1 className="text-3xl font-bold text-center text-foreground">Expense Tracker</h1>
         <p className="text-center text-muted-foreground">Registra y analiza tus gastos fácilmente.</p>
       </header>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
           <ExpenseForm onAddExpense={handleAddExpense} />
        </div>

        <div className="md:col-span-2 space-y-6">
           <ExpenseSummary expenses={expenses} />
           <ProductHistory expenses={expenses} onDeleteExpense={handleDeleteExpense} /> {/* Pass delete handler */}
        </div>
       </div>

      <Toaster />
    </main>
  );
}
