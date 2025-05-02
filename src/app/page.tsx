// app/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { ExpenseForm } from '@/components/ExpenseForm';
import { ExpenseSummary } from '@/components/ExpenseSummary';
import { ProductHistory } from '@/components/ProductHistory';
import { Toaster } from '@/components/ui/toaster';
import type { Expense } from '@/types/expense';
import useLocalStorage from '@/hooks/useLocalStorage'; // Import the custom hook
import { v4 as uuidv4 } from 'uuid'; // Import uuid

// Function to generate unique IDs
const generateId = (): string => {
  // Use Math.random for simplicity if uuid is not installed, but uuid is better
  // return Math.random().toString(36).substring(2, 15);
   if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
   }
    // Fallback for environments without crypto.randomUUID (like older browsers or Node < 15.6)
   // Consider adding the 'uuid' package for a robust solution: npm install uuid @types/uuid
   console.warn("crypto.randomUUID not available, falling back to less secure method. Consider installing 'uuid'.");
   // Simple fallback (not cryptographically secure or guaranteed unique)
   return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
};


export default function Home() {
  // Use the custom hook to manage expenses state with localStorage persistence
   // Initialize with empty array only on the client-side after mount
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [isClient, setIsClient] = useState(false);

  // Ensure localStorage logic runs only on the client
  useEffect(() => {
    setIsClient(true);
  }, []);


  const handleAddExpense = (newExpenseData: Omit<Expense, 'id' | 'timestamp'>) => {
    const newExpense: Expense = {
      ...newExpenseData,
      id: generateId(), // Generate a unique ID
      timestamp: new Date(), // Record the current timestamp
    };
    setExpenses(prevExpenses => [...prevExpenses, newExpense]);
  };

  // Render loading state or null until client-side hydration is complete
   if (!isClient) {
    // You can return a loading spinner or placeholder here
    return <div className="container mx-auto p-4 min-h-screen flex items-center justify-center">Loading...</div>;
  }


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
           <ProductHistory expenses={expenses} />
        </div>
       </div>

      <Toaster />
    </main>
  );
}
