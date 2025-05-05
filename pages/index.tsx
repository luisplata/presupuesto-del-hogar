
// pages/index.tsx

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx'; // Import xlsx library
// import { saveAs } from 'file-saver'; // Optional: For direct download trigger, currently using link click
import { ExpenseForm } from '@/components/ExpenseForm';
import { ExpenseSummary } from '@/components/ExpenseSummary';
import { ProductHistory } from '@/components/ProductHistory';
import { CategoryHistory } from '@/components/CategoryHistory'; // Import CategoryHistory
import { ExpenseCharts } from '@/components/ExpenseCharts'; // Import the charts component
// Toaster is now in _app.tsx
import type { Expense } from '@/types/expense';
import useLocalStorage from '@/hooks/useLocalStorage';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button'; // Import Button
import { Download } from 'lucide-react'; // Import Download icon
import { formatDate, formatCurrency } from '@/lib/dateUtils'; // Import formatters
import Head from 'next/head'; // Import Head for page-specific metadata

const DEFAULT_CATEGORY = 'no definido';

export default function Home() {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [categories, setCategories] = useLocalStorage<string[]>('categories', [DEFAULT_CATEGORY]);

  // Client-side state to prevent hydration mismatch for export button
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);


  const handleAddExpense = (newExpenseData: Omit<Expense, 'id' | 'timestamp'>) => {
     const categoryToAdd = (newExpenseData.category?.trim() || DEFAULT_CATEGORY); // Default if empty/whitespace

     const newExpense: Expense = {
      ...newExpenseData,
      category: categoryToAdd, // Ensure category is set
      id: uuidv4(),
      timestamp: new Date(), // Store as Date object
    };

    // Add new category to the list if it doesn't exist
    if (!categories.includes(categoryToAdd)) {
      setCategories(prevCategories => [...prevCategories, categoryToAdd].sort());
    }

    setExpenses(prevExpenses => [...prevExpenses, newExpense].sort((a, b) => {
       // Safely convert timestamps to numbers for comparison
       const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
       const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
       return timeB - timeA;
    }));
  };

  const handleDeleteExpense = (idToDelete: string) => {
    setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== idToDelete));
  };

   const handleDeleteProduct = (productNameToDelete: string) => {
     setExpenses(prevExpenses => prevExpenses.filter(expense => expense.product !== productNameToDelete));
   };

   // Handler to delete all expenses for a specific category
   const handleDeleteCategory = (categoryNameToDelete: string) => {
        // Also handle the case where the category might be the default one
       setExpenses(prevExpenses => prevExpenses.filter(expense => (expense.category || DEFAULT_CATEGORY) !== categoryNameToDelete));
   };


  const handleExportToExcel = () => {
     // Ensure this runs only on the client
     if (typeof window === 'undefined') return;

    // 1. Format data for Excel
    const dataToExport = expenses
       .sort((a, b) => {
         const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
         const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
         return timeB - timeA;
       }) // Ensure consistent sorting
       .map(exp => ({
          Producto: exp.product,
          Precio: exp.price, // Keep as number for Excel calculations
          Categoría: exp.category || DEFAULT_CATEGORY, // Add category column, default if undefined
          'Fecha y Hora': formatDate(exp.timestamp), // Format date for readability
       }));

    // 2. Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Gastos");

    // Optional: Adjust column widths (example) - added width for category
    worksheet['!cols'] = [ { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 25 } ]; // Adjust widths as needed

    // 3. Generate Excel file and trigger download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"});

    // Generate filename with current date
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    const fileName = `gastos_${formattedDate}.xlsx`;

    // Use a link click for download (more reliable than file-saver with static export)
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href); // Clean up the object URL
  };


  return (
    <>
      <Head>
          <title>Expense Tracker</title>
          <meta name="description" content="Registra y analiza tus gastos fácilmente." />
          {/* Add any other page-specific head elements here if needed */}
      </Head>
      <main className="container mx-auto p-4 min-h-screen">
         <header className="mb-8 text-center">
           <h1 className="text-3xl font-bold text-foreground">Expense Tracker</h1>
           <p className="text-muted-foreground">Registra y analiza tus gastos fácilmente.</p>
           {/* Render Export Button only on the client */}
           {isClient && (
             <Button onClick={handleExportToExcel} variant="outline" className="mt-4">
                <Download className="mr-2 h-4 w-4" />
                Exportar a Excel
             </Button>
           )}
         </header>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
             <ExpenseForm onAddExpense={handleAddExpense} categories={categories} />
          </div>

          <div className="md:col-span-2 space-y-6">
             <ExpenseSummary expenses={expenses} />
             {/* Product History */}
             <ProductHistory
               expenses={expenses}
               onDeleteExpense={handleDeleteExpense}
               onDeleteProduct={handleDeleteProduct} // Specific handler passed
              />
             {/* Category History */}
             <CategoryHistory
               expenses={expenses}
               onDeleteExpense={handleDeleteExpense}
               onDeleteCategory={handleDeleteCategory} // New handler passed
             />
             {/* Expense Charts */}
             <ExpenseCharts expenses={expenses} />
          </div>
         </div>

        {/* Toaster is rendered in _app.tsx */}
      </main>
    </>
  );
}
