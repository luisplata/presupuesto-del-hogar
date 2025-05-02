
// pages/index.tsx

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx'; // Import xlsx library
// import { saveAs } from 'file-saver'; // Optional: Only if needed
import { ExpenseForm } from '@/components/ExpenseForm';
import { ExpenseSummary } from '@/components/ExpenseSummary';
import { ProductHistory } from '@/components/ProductHistory';
// Toaster is now in _app.tsx
import type { Expense } from '@/types/expense';
import useLocalStorage from '@/hooks/useLocalStorage';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button'; // Import Button
import { Download } from 'lucide-react'; // Import Download icon
import { formatDate, formatCurrency } from '@/lib/dateUtils'; // Import formatters
import Head from 'next/head'; // Import Head for page-specific metadata

export default function Home() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);

  const handleAddExpense = (newExpenseData: Omit<Expense, 'id' | 'timestamp'>) => {
    const newExpense: Expense = {
      ...newExpenseData,
      id: uuidv4(),
      timestamp: new Date(),
    };
    setExpenses(prevExpenses => [...prevExpenses, newExpense].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())); // Sort after adding
  };

  const handleDeleteExpense = (idToDelete: string) => {
    setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== idToDelete));
  };

   const handleDeleteProduct = (productNameToDelete: string) => {
     setExpenses(prevExpenses => prevExpenses.filter(expense => expense.product !== productNameToDelete));
   };


  const handleExportToExcel = () => {
    // 1. Format data for Excel
    const dataToExport = expenses
       .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) // Ensure consistent sorting
       .map(exp => ({
      Producto: exp.product,
      Precio: exp.price, // Keep as number for Excel calculations
      'Fecha y Hora': formatDate(exp.timestamp), // Format date for readability
    }));

    // 2. Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Gastos");

    // Optional: Adjust column widths (example)
    worksheet['!cols'] = [ { wch: 20 }, { wch: 10 }, { wch: 25 } ]; // Adjust widths as needed

    // 3. Generate Excel file and trigger download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"});

    // Generate filename with current date
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    const fileName = `gastos_${formattedDate}.xlsx`;

    // Use file-saver or a simple link click for download
    // saveAs(blob, fileName); // If you installed file-saver
    // Or use a link:
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <>
      <Head>
          <title>Expense Tracker</title>
          {/* Add any other page-specific head elements here if needed */}
      </Head>
      <main className="container mx-auto p-4 min-h-screen">
         <header className="mb-8 text-center">
           <h1 className="text-3xl font-bold text-foreground">Expense Tracker</h1>
           <p className="text-muted-foreground">Registra y analiza tus gastos fácilmente.</p>
           {/* Add Export Button */}
           <Button onClick={handleExportToExcel} variant="outline" className="mt-4">
              <Download className="mr-2 h-4 w-4" />
              Exportar a Excel
           </Button>
         </header>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
             <ExpenseForm onAddExpense={handleAddExpense} />
          </div>

          <div className="md:col-span-2 space-y-6">
             <ExpenseSummary expenses={expenses} />
             <ProductHistory
               expenses={expenses}
               onDeleteExpense={handleDeleteExpense}
               onDeleteProduct={handleDeleteProduct}
              />
          </div>
         </div>

        {/* Toaster is rendered in _app.tsx */}
      </main>
    </>
  );
}
