
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
import { useLocale } from '@/hooks/useLocale'; // Import the useLocale hook
import { LanguageSelector } from '@/components/LanguageSelector'; // Import LanguageSelector
// LocaleProvider is now in _app.tsx

const DEFAULT_CATEGORY_KEY = 'category.undefined'; // Key for the default category

export default function Home() {
  const { t, currentLocale } = useLocale(); // Use the hook

  // Store the key 'category.undefined' in categories list
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [categories, setCategories] = useLocalStorage<string[]>('categories', [DEFAULT_CATEGORY_KEY]);

  // Client-side state to prevent hydration mismatch for export button
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Ensure the default category key always exists in the list
  useEffect(() => {
    if (!categories.includes(DEFAULT_CATEGORY_KEY)) {
      setCategories(prev => [...prev, DEFAULT_CATEGORY_KEY].sort());
    }
  }, [categories, setCategories]);


  const handleAddExpense = (newExpenseData: Omit<Expense, 'id' | 'timestamp'>) => {
     // If category input is empty or whitespace, use the default key
     const categoryToAdd = newExpenseData.category?.trim() ? newExpenseData.category.trim() : DEFAULT_CATEGORY_KEY;

     const newExpense: Expense = {
      ...newExpenseData,
      category: categoryToAdd, // Store the key or the entered category
      id: uuidv4(),
      timestamp: new Date(), // Store as Date object
    };

    // Add new category to the list if it's not the default and doesn't exist
    if (categoryToAdd !== DEFAULT_CATEGORY_KEY && !categories.includes(categoryToAdd)) {
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

   // Handler to delete all expenses for a specific category (using the key or name)
   const handleDeleteCategory = (categoryIdentifierToDelete: string) => {
       setExpenses(prevExpenses => prevExpenses.filter(expense => expense.category !== categoryIdentifierToDelete));
        // Optional: Remove the category from the list if it's not the default one
       if (categoryIdentifierToDelete !== DEFAULT_CATEGORY_KEY && categories.includes(categoryIdentifierToDelete)) {
           setCategories(prev => prev.filter(cat => cat !== categoryIdentifierToDelete));
       }
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
          [t('excel.product')]: exp.product,
          [t('excel.price')]: exp.price, // Keep as number for Excel calculations
          // Translate the category only for the export
          [t('excel.category')]: exp.category === DEFAULT_CATEGORY_KEY ? t(DEFAULT_CATEGORY_KEY) : exp.category,
          [t('excel.datetime')]: formatDate(exp.timestamp, currentLocale), // Format date for readability, pass locale
       }));

    // 2. Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t('excel.sheetName')); // Use translated sheet name

    // Optional: Adjust column widths (example) - added width for category
    worksheet['!cols'] = [ { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 25 } ]; // Adjust widths as needed

    // 3. Generate Excel file and trigger download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"});

    // Generate filename with current date
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    const fileName = `${t('excel.fileNamePrefix')}_${formattedDate}.xlsx`; // Use translated prefix

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
          <title>{t('home.title')}</title>
          <meta name="description" content={t('home.description')} />
          {/* Add any other page-specific head elements here if needed */}
      </Head>
      <main className="container mx-auto p-4 min-h-screen">
          <header className="mb-8 text-center relative"> {/* Added relative positioning */}
            <div className="absolute top-0 right-0 p-2"> {/* Position LanguageSelector */}
                <LanguageSelector />
            </div>
            <h1 className="text-3xl font-bold text-foreground">{t('home.title')}</h1>
            <p className="text-muted-foreground">{t('home.description')}</p>
           {/* Render Export Button only on the client */}
           {isClient && (
             <Button onClick={handleExportToExcel} variant="outline" className="mt-4">
                <Download className="mr-2 h-4 w-4" />
                {t('home.exportButton')}
             </Button>
           )}
         </header>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
             <ExpenseForm
                 onAddExpense={handleAddExpense}
                 // Pass categories excluding the default key
                 categories={categories.filter(cat => cat !== DEFAULT_CATEGORY_KEY)}
                 defaultCategoryKey={DEFAULT_CATEGORY_KEY} // Pass key instead of translated string
             />
          </div>

          <div className="md:col-span-2 space-y-6">
             <ExpenseSummary expenses={expenses} />
             {/* Product History */}
             <ProductHistory
               expenses={expenses}
               onDeleteExpense={handleDeleteExpense}
               onDeleteProduct={handleDeleteProduct} // Specific handler passed
               defaultCategoryKey={DEFAULT_CATEGORY_KEY} // Pass key
              />
             {/* Category History */}
             <CategoryHistory
               expenses={expenses}
               onDeleteExpense={handleDeleteExpense}
               onDeleteCategory={handleDeleteCategory} // New handler passed
               defaultCategoryKey={DEFAULT_CATEGORY_KEY} // Pass key
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
