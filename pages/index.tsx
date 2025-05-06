// pages/index.tsx
import { useState, useEffect, useRef } from 'react';
import { ExpenseForm } from '@/components/ExpenseForm';
import { ExpenseSummary } from '@/components/ExpenseSummary';
import { ProductHistory } from '@/components/ProductHistory';
import { CategoryHistory } from '@/components/CategoryHistory';
import { ExpenseCharts } from '@/components/ExpenseCharts';
import type { Expense } from '@/types/expense';
import useLocalStorage from '@/hooks/useLocalStorage';
import { v4 as uuidv4 } from 'uuid';
import { safelyParseDate } from '@/lib/dateUtils'; // Import formatters and safelyParseDate

import Head from 'next/head';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Upload, Download } from 'lucide-react';
import Papa from 'papaparse'; // For CSV parsing/unparsing
import { saveAs } from 'file-saver'; // For triggering download


const DEFAULT_CATEGORY_KEY = 'no definido'; // Key for the default category (now hardcoded Spanish)
export default function Home() {

  const { toast } = useToast(); // Use toast for feedback

  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [categories, setCategories] = useLocalStorage<string[]>('categories', [DEFAULT_CATEGORY_KEY]);

  // Client-side state to prevent hydration mismatch for export/import buttons
  const [isClient, setIsClient] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input

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

   const handleExport = () => {
      if (!isClient) return; // Ensure this runs only on client

      const dataToExport = expenses.map(exp => ({
          Producto: exp.product.name,
          Precio: exp.price,
          Categoria: exp.category,
          Timestamp: exp.timestamp instanceof Date ? exp.timestamp.toISOString() : new Date(exp.timestamp).toISOString(), // Ensure ISO format
      }));

      const csv = Papa.unparse(dataToExport, { header: true });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, 'gastos.csv');

      toast({
          title: "Exportación Completa",
          description: "Los datos de gastos se han exportado a gastos.csv.",
      });
   };

   const handleImportClick = () => {
       if (!isClient || !fileInputRef.current) return; // Ensure this runs only on client
       fileInputRef.current.click(); // Trigger file input
   };

   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
       if (!isClient || !event.target.files || event.target.files.length === 0) {
           return;
       }

       const file = event.target.files[0];
       const reader = new FileReader();

       reader.onload = (e) => {
           const content = e.target?.result;
           if (typeof content === 'string') {
               try {
                   const result = Papa.parse<any>(content, { header: true, skipEmptyLines: true });
                   const importedExpenses: Expense[] = [];
                   const importedCategories = new Set<string>(categories); // Start with existing categories
                   let errorsFound = 0;

                   if (result.errors.length > 0) {
                       result.errors.forEach(err => console.error('CSV Parsing Error:', err));
                       toast({
                           title: "Error de Formato CSV",
                           description: `Se encontraron ${result.errors.length} errores al leer el archivo. Verifica el formato.`,
                           variant: "destructive",
                       });
                       // Optionally stop processing if errors are critical
                       // return;
                   }


                   result.data.forEach((row, index) => {
                       const productName = row.Producto?.trim();
                       const priceStr = row.Precio?.trim();
                       const categoryName = row.Categoria?.trim() || DEFAULT_CATEGORY_KEY; // Default if empty
                       const timestampStr = row.Timestamp?.trim();

                       const price = parseFloat(priceStr);
                       const timestamp = safelyParseDate(timestampStr); // Use safe parser


                       if (!productName || isNaN(price) || price <= 0 || !timestamp) {
                            console.warn(`Fila ${index + 2} omitida: Datos inválidos (Producto: ${productName}, Precio: ${priceStr}, Timestamp: ${timestampStr})`);
                            errorsFound++;
                            return; // Skip invalid rows
                       }

                       const newExpense: Expense = {
                           id: uuidv4(),
                           product: { name: productName, value: 0, color: '' }, // Minimal product info
                           price: price,
                           category: categoryName,
                           timestamp: timestamp,
                       };
                       importedExpenses.push(newExpense);

                       // Add new category if it's valid and not the default
                       if (categoryName !== DEFAULT_CATEGORY_KEY && categoryName) {
                           importedCategories.add(categoryName);
                       }
                   });

                   if (importedExpenses.length > 0) {
                       setExpenses(prevExpenses => [...prevExpenses, ...importedExpenses].sort((a, b) => {
                           const timeA = safelyParseDate(a.timestamp)?.getTime() ?? 0;
                           const timeB = safelyParseDate(b.timestamp)?.getTime() ?? 0;
                           return timeB - timeA;
                       }));
                       setCategories(Array.from(importedCategories).sort()); // Update categories
                   }

                   toast({
                       title: "Importación Completa",
                       description: `${importedExpenses.length} gastos importados. ${errorsFound > 0 ? `${errorsFound} filas omitidas por datos inválidos.` : ''}`,
                   });

               } catch (error) {
                   console.error("Error al importar CSV:", error);
                   toast({
                       title: "Error de Importación",
                       description: "No se pudo procesar el archivo CSV.",
                       variant: "destructive",
                   });
               } finally {
                  // Reset file input to allow importing the same file again if needed
                   if (fileInputRef.current) {
                     fileInputRef.current.value = '';
                   }
               }
           }
       };

       reader.onerror = (error) => {
            console.error("Error al leer archivo:", error);
            toast({
                title: "Error de Lectura",
                description: "No se pudo leer el archivo seleccionado.",
                variant: "destructive",
            });
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
       }

       reader.readAsText(file); // Read file as text
   };


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
                    <CardTitle>Exportar/Importar Data (CSV)</CardTitle>
                    <CardDescription>Exporta tus gastos a un archivo CSV o importa desde uno existente.</CardDescription>
                </CardHeader>

                 <CardContent className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                     <input
                         type="file"
                         ref={fileInputRef}
                         onChange={handleFileChange}
                         accept=".csv" // Accept CSV files
                         style={{ display: 'none' }} // Hide the actual file input
                         id="import-csv-input"
                     />
                     {isClient ? (
                         <>
                             <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto">
                                 <Download className="mr-2 h-4 w-4" /> Exportar a CSV
                             </Button>
                             <Button onClick={handleImportClick} variant="outline" className="w-full sm:w-auto">
                                 <Upload className="mr-2 h-4 w-4" /> Importar desde CSV
                             </Button>
                         </>
                     ) : (
                         <>
                             <Skeleton className="h-10 w-full sm:w-auto" />
                             <Skeleton className="h-10 w-full sm:w-auto" />
                         </>
                     )}
                 </CardContent>
             </Card>
          </TabsContent>
        </Tabs>

        {/* Toaster is rendered in _app.tsx */}
      </main>
    </>
  );
}
