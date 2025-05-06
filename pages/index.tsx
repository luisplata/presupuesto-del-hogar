// pages/index.tsx
import { useState, useEffect, useRef } from 'react';
import { ExpenseForm } from '@/components/ExpenseForm';
import { ExpenseSummary } from '@/components/ExpenseSummary';
import { ProductHistory } from '@/components/ProductHistory';
import { CategoryHistory } from '@/components/CategoryHistory'; // Import CategoryHistory
import { ExpenseCharts } from '@/components/ExpenseCharts'; // Import the charts component
import type { Expense } from '@/types/expense';
import useLocalStorage from '@/hooks/useLocalStorage';
import { v4 as uuidv4 } from 'uuid';
import { safelyParseDate } from '@/lib/dateUtils'; // Import formatters and safelyParseDate

import Head from 'next/head'; // Import Head for page-specific metadata
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Import Card components
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton for loading state
// Removed unused imports for Excel functionality:
// import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver';
// import { Button } from '@/components/ui/button';
// import { Upload, Download } from 'lucide-react';


const DEFAULT_CATEGORY_KEY = 'no definido'; // Key for the default category (now hardcoded Spanish)
export default function Home() {




  const { toast } = useToast(); // Use toast for feedback

  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [categories, setCategories] = useLocalStorage<string[]>('categories', [DEFAULT_CATEGORY_KEY]);

  // Client-side state to prevent hydration mismatch for export/import buttons
  const [isClient, setIsClient] = useState(false);
  // Removed unused ref:
  // const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input

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

     const newExpense = {
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
      const timeA = safelyParseDate(a.timestamp)?.getTime() ?? 0;
      const timeB = safelyParseDate(b.timestamp)?.getTime() ?? 0;
      return timeB - timeA;
    }));
  };

  const handleDeleteExpense = (idToDelete: string) => {
    setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== idToDelete));
  };

   const handleDeleteProduct = (productNameToDelete: string) => {
     setExpenses(prevExpenses => prevExpenses.filter(expense => expense.product.name !== productNameToDelete));
   };

   const handleDeleteCategory = (categoryIdentifierToDelete: string) => {
       setExpenses(prevExpenses => prevExpenses.filter(expense => expense.category !== categoryIdentifierToDelete));
       if (categoryIdentifierToDelete !== DEFAULT_CATEGORY_KEY && categories.includes(categoryIdentifierToDelete)) {
           setCategories(prev => prev.filter(cat => cat !== categoryIdentifierToDelete));
       }
   };

  // Removed handleExport function
  // Removed handleImportClick function
  // Removed handleFileChange function


  return (
    <>
      <Head>
          <title>Control de Gastos</title>
          <meta name="description" content="Registra y analiza tus gastos fácilmente." />
      </Head>
      {/* Adjust main container padding for responsiveness */}
      <main className="container mx-auto px-2 sm:px-4 py-4 min-h-screen">
          <header className="mb-6 md:mb-8 text-center relative">
            {/* Removed LanguageSelector */}
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Control de Gastos</h1>
            <p className="text-sm md:text-base text-muted-foreground">Registra y analiza tus gastos fácilmente.</p>
         </header>

        <Tabs defaultValue="control" className="w-full">
          {/* Make TabsList grid adapt better on smaller screens if needed, but grid-cols-3 is often okay */}
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="control">Control de gastos</TabsTrigger>
            <TabsTrigger value="reporting">Reportería</TabsTrigger>
            <TabsTrigger value="data">Exportar/Importar Data</TabsTrigger>
          </TabsList>

          {/* Tab 1: Control de Gastos */}
          <TabsContent value="control">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="md:col-span-1">
                   <ExpenseForm
                       onAddExpense={handleAddExpense}
                       categories={categories.filter(cat => cat !== DEFAULT_CATEGORY_KEY)}
                       defaultCategoryKey={DEFAULT_CATEGORY_KEY}
                   />
                </div>
                <div className="md:col-span-2">
                    <ExpenseSummary expenses={expenses} />
                </div>
            </div>
          </TabsContent>

          {/* Tab 2: Reportería */}
          <TabsContent value="reporting">
             <div className="space-y-4 md:space-y-6">
                 <ExpenseCharts expenses={expenses} />
                 <ProductHistory
                     expenses={expenses}
                     onDeleteExpense={handleDeleteExpense}
                     onDeleteProduct={handleDeleteProduct}
                     defaultCategoryKey={DEFAULT_CATEGORY_KEY}
                 />
                 <CategoryHistory
                     expenses={expenses}
                     onDeleteExpense={handleDeleteExpense}
                     onDeleteCategory={handleDeleteCategory}
                     defaultCategoryKey={DEFAULT_CATEGORY_KEY}
                 />
             </div>
          </TabsContent>

          {/* Tab 3: Exportar/Importar Data */}
          <TabsContent value="data">
             <Card>
                <CardHeader>
                    <CardTitle>Exportar/Importar Data</CardTitle>
                    <CardDescription>Funcionalidad de Exportar/Importar deshabilitada temporalmente.</CardDescription> {/* Updated description */}
                </CardHeader>

                 <CardContent className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                     {/* Removed Export and Import buttons and file input */}
                     {/* <input
                         type="file"
                         ref={fileInputRef}
                         onChange={handleFileChange}
                         accept=".xlsx, .xls"
                         style={{ display: 'none' }} // Hide the actual file input
                         id="import-excel-input"
                     />
                     {isClient ? (
                         <>
                             <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto">
                                 <Download className="mr-2 h-4 w-4" /> Exportar a Excel
                             </Button>
                             <Button onClick={handleImportClick} variant="outline" className="w-full sm:w-auto">
                                 <Upload className="mr-2 h-4 w-4" /> Importar desde Excel
                             </Button>
                         </>
                     ) : (
                         <>
                             <Skeleton className="h-10 w-full sm:w-auto" />
                             <Skeleton className="h-10 w-full sm:w-auto" />
                         </>
                     )} */}
                      <p className="text-muted-foreground text-sm">La importación y exportación de Excel se restaurará pronto.</p>
                 </CardContent>
             </Card>
          </TabsContent>
        </Tabs>

        {/* Toaster is rendered in _app.tsx */}
      </main>
    </>
  );
}
