
// pages/index.tsx

import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx'; // Import xlsx library
import { ExpenseForm } from '@/components/ExpenseForm';
import { ExpenseSummary } from '@/components/ExpenseSummary';
import { ProductHistory } from '@/components/ProductHistory';
import { CategoryHistory } from '@/components/CategoryHistory'; // Import CategoryHistory
import { ExpenseCharts } from '@/components/ExpenseCharts'; // Import the charts component
import type { Expense } from '@/types/expense';
import useLocalStorage from '@/hooks/useLocalStorage';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button'; // Import Button
import { Download, Upload } from 'lucide-react'; // Import Download and Upload icons
import { formatDate, formatCurrency, safelyParseDate } from '@/lib/dateUtils'; // Import formatters and safelyParseDate
import Head from 'next/head'; // Import Head for page-specific metadata
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Import Card components
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton for loading state

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


  const handleExportToExcel = () => {
     if (typeof window === 'undefined') return;

    const excelHeaders = {
        product: 'Producto',
        price: 'Precio',
        category: 'Categoría',
        datetime: 'Fecha y Hora'
    };

    const dataToExport = expenses
       .sort((a, b) => {
         const timeA = safelyParseDate(a.timestamp)?.getTime() ?? 0;
         const timeB = safelyParseDate(b.timestamp)?.getTime() ?? 0;
         return timeB - timeA;
       })
       .map(exp => ({
          [excelHeaders.product]: exp.product.name, // Extract product name
          [excelHeaders.price]: exp.price, // Keep as number
          [excelHeaders.category]: exp.category, // Use the stored category name directly
          [excelHeaders.datetime]: formatDate(exp.timestamp), // Format date for readability (uses default Spanish locale now)
       }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Gastos'); // Hardcoded sheet name

    worksheet['!cols'] = [ { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 25 } ];

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"});

    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    const fileName = `gastos_${formattedDate}.xlsx`; // Hardcoded file name prefix

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const handleImportFromExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Hardcoded Spanish headers
        const productHeader = 'Producto';
        const priceHeader = 'Precio';
        const categoryHeader = 'Categoría';
        const datetimeHeader = 'Fecha y Hora';

        const importedExpenses: Expense[] = [];
        const newCategories = new Set<string>(categories);
        let skippedCount = 0;

        jsonData.forEach((row: any, index: number) => {
           // Check for required headers
           if (!(productHeader in row) || !(priceHeader in row) || !(datetimeHeader in row)) {
                console.warn(`Fila ${index + 2} omitida: Faltan columnas requeridas (Producto, Precio, Fecha y Hora).`);
                skippedCount++;
                return;
           }

            const product = String(row[productHeader]);
            const price = Number(row[priceHeader]);
            // Handle category: Use default key if empty or missing
            let category = categoryHeader in row ? String(row[categoryHeader]).trim() : '';
            if (!category) {
                category = DEFAULT_CATEGORY_KEY;
            }

            const timestampStr = String(row[datetimeHeader]); // Assuming date is a string in the sheet
            const timestamp = safelyParseDate(timestampStr); // Implement robust date parsing if needed

            if (!product || isNaN(price) || price <= 0 || !timestamp) {
                console.warn(`Fila ${index + 2} omitida: Datos inválidos (Producto: ${product}, Precio: ${price}, Fecha y Hora: ${timestampStr})`);
                skippedCount++;
                return; // Skip row with invalid data
            }

            const newExpense: Expense = {
                id: uuidv4(),
                product: {
                   name: product,
                   color: "", // Default color (empty string)
                   value: 0 // Default value (0)
                },
                price,
                category: category || DEFAULT_CATEGORY_KEY,
                timestamp,
            };
            importedExpenses.push(newExpense);
            if (newExpense.category !== DEFAULT_CATEGORY_KEY) {
                newCategories.add(newExpense.category);
            }
        });

        if (importedExpenses.length > 0) {
            setExpenses(prevExpenses =>
                [...prevExpenses, ...importedExpenses].sort((a, b) => {
                     const timeA = safelyParseDate(a.timestamp)?.getTime() ?? 0;
                     const timeB = safelyParseDate(b.timestamp)?.getTime() ?? 0;
                     return timeB - timeA;
                 })
            );
            setCategories(Array.from(newCategories).sort());
            toast({
                title: 'Importación Exitosa',
                description: `${importedExpenses.length} gastos importados. Se omitieron ${skippedCount} filas debido a errores o datos faltantes.`,
            });
        } else if (skippedCount > 0) {
             toast({
                title: 'Error de Importación',
                description: `No se importaron gastos. Se omitieron ${skippedCount} filas debido a errores o datos faltantes.`,
                variant: 'destructive',
            });
        } else {
             toast({
                title: 'Error de Importación',
                description: 'No se encontraron datos de gastos válidos en el archivo.',
                variant: 'destructive',
            });
        }

      } catch (error) {
        console.error("Error al importar archivo:", error);
        toast({
          title: 'Error de Importación',
          description: 'Ocurrió un error al importar el archivo. Por favor, verifica el formato del archivo e inténtalo de nuevo.',
          variant: 'destructive',
        });
      } finally {
        // Reset file input value to allow importing the same file again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsBinaryString(file);
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
                    <CardTitle>Exportar/Importar Data</CardTitle>
                    <CardDescription>Exporta tus datos de gastos actuales o importa datos desde un archivo Excel.</CardDescription>
                </CardHeader>
                {/* Adjusted button layout for better mobile view */}
                <CardContent className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    {/* Export Button */}
                    {isClient ? (
                       <Button onClick={handleExportToExcel} variant="outline" className="w-full sm:w-auto">
                          <Download className="mr-2 h-4 w-4" />
                          Exportar a Excel
                       </Button>
                    ) : (
                        <Button variant="outline" disabled className="w-full sm:w-auto">
                            <Download className="mr-2 h-4 w-4" /> Exportar a Excel
                        </Button>
                    )}
                     {/* Import Button */}
                    {isClient ? (
                        <>
                            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full sm:w-auto">
                                <Upload className="mr-2 h-4 w-4" />
                                Importar desde Excel
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImportFromExcel}
                                accept=".xlsx, .xls"
                                className="hidden" // Use className instead of style
                             />
                        </>
                    ) : (
                        <Button variant="outline" disabled className="w-full sm:w-auto">
                            <Upload className="mr-2 h-4 w-4" /> Importar desde Excel
                        </Button>
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

    