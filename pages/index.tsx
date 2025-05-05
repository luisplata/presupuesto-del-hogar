
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
import { useLocale } from '@/hooks/useLocale'; // Import the useLocale hook
import { LanguageSelector } from '@/components/LanguageSelector'; // Import LanguageSelector
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Import Card components
import { useToast } from '@/hooks/use-toast'; // Import useToast

const DEFAULT_CATEGORY_KEY = 'category.undefined'; // Key for the default category

export default function Home() {
  const { t, currentLocale } = useLocale(); // Use the hook
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
     setExpenses(prevExpenses => prevExpenses.filter(expense => expense.product !== productNameToDelete));
   };

   const handleDeleteCategory = (categoryIdentifierToDelete: string) => {
       setExpenses(prevExpenses => prevExpenses.filter(expense => expense.category !== categoryIdentifierToDelete));
       if (categoryIdentifierToDelete !== DEFAULT_CATEGORY_KEY && categories.includes(categoryIdentifierToDelete)) {
           setCategories(prev => prev.filter(cat => cat !== categoryIdentifierToDelete));
       }
   };


  const handleExportToExcel = () => {
     if (typeof window === 'undefined') return;

    const dataToExport = expenses
       .sort((a, b) => {
         const timeA = safelyParseDate(a.timestamp)?.getTime() ?? 0;
         const timeB = safelyParseDate(b.timestamp)?.getTime() ?? 0;
         return timeB - timeA;
       })
       .map(exp => ({
          [t('excel.product')]: exp.product,
          [t('excel.price')]: exp.price, // Keep as number
          [t('excel.category')]: exp.category === DEFAULT_CATEGORY_KEY ? t(DEFAULT_CATEGORY_KEY) : exp.category,
          [t('excel.datetime')]: formatDate(exp.timestamp, currentLocale), // Format date for readability
       }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t('excel.sheetName'));

    worksheet['!cols'] = [ { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 25 } ];

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"});

    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    const fileName = `${t('excel.fileNamePrefix')}_${formattedDate}.xlsx`;

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

        const productHeader = t('excel.product');
        const priceHeader = t('excel.price');
        const categoryHeader = t('excel.category');
        const datetimeHeader = t('excel.datetime');

        const importedExpenses: Expense[] = [];
        const newCategories = new Set<string>(categories);
        let skippedCount = 0;

        jsonData.forEach((row: any, index: number) => {
           // Check for required headers
           if (!(productHeader in row) || !(priceHeader in row) || !(datetimeHeader in row)) {
                console.warn(`Row ${index + 2} skipped: Missing required columns (Product, Price, Date & Time).`);
                skippedCount++;
                return;
           }

            const product = String(row[productHeader]);
            const price = Number(row[priceHeader]);
            // Handle category: Use 'category.undefined' key if empty or missing
            let category = categoryHeader in row ? String(row[categoryHeader]).trim() : '';
             // Translate back from localized "undefined" to the key if necessary
             if (category === t(DEFAULT_CATEGORY_KEY)) {
                category = DEFAULT_CATEGORY_KEY;
            } else if (!category) {
                category = DEFAULT_CATEGORY_KEY;
            }

            const timestampStr = String(row[datetimeHeader]); // Assuming date is a string in the sheet
            const timestamp = safelyParseDate(timestampStr); // Implement robust date parsing if needed

            if (!product || isNaN(price) || price <= 0 || !timestamp) {
                console.warn(`Row ${index + 2} skipped: Invalid data (Product: ${product}, Price: ${price}, Timestamp: ${timestampStr})`);
                skippedCount++;
                return; // Skip row with invalid data
            }

            const newExpense: Expense = {
                id: uuidv4(),
                product,
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
                title: t('import.successTitle'),
                description: t('import.successDescription', { count: importedExpenses.length, skipped: skippedCount }),
            });
        } else if (skippedCount > 0) {
             toast({
                title: t('import.errorTitle'),
                description: t('import.errorDescriptionNoneImported', { skipped: skippedCount }),
                variant: 'destructive',
            });
        } else {
             toast({
                title: t('import.errorTitle'),
                description: t('import.errorDescriptionNoData'),
                variant: 'destructive',
            });
        }

      } catch (error) {
        console.error("Error importing file:", error);
        toast({
          title: t('import.errorTitle'),
          description: t('import.genericError'),
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
          <title>{t('home.title')}</title>
          <meta name="description" content={t('home.description')} />
      </Head>
      <main className="container mx-auto p-4 min-h-screen">
          <header className="mb-8 text-center relative">
            <div className="absolute top-0 right-0 p-2 z-10"> {/* Ensure selector is above tabs */}
                <LanguageSelector />
            </div>
            <h1 className="text-3xl font-bold text-foreground">{t('home.title')}</h1>
            <p className="text-muted-foreground">{t('home.description')}</p>
         </header>

        <Tabs defaultValue="control" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="control">{t('tabs.control')}</TabsTrigger>
            <TabsTrigger value="reporting">{t('tabs.reporting')}</TabsTrigger>
            <TabsTrigger value="data">{t('tabs.data')}</TabsTrigger>
          </TabsList>

          {/* Tab 1: Control de Gastos */}
          <TabsContent value="control">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
             <div className="space-y-6">
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
                    <CardTitle>{t('tabs.data')}</CardTitle>
                    <CardDescription>{t('dataTab.description')}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    {/* Export Button */}
                    {isClient && (
                       <Button onClick={handleExportToExcel} variant="outline">
                          <Download className="mr-2 h-4 w-4" />
                          {t('home.exportButton')}
                       </Button>
                    )}
                     {/* Import Button */}
                    {isClient && (
                        <>
                            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                                <Upload className="mr-2 h-4 w-4" />
                                {t('dataTab.importButton')}
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImportFromExcel}
                                accept=".xlsx, .xls"
                                style={{ display: 'none' }} // Hide the default input
                             />
                        </>
                    )}
                    {!isClient && (
                       <>
                        <Button variant="outline" disabled><Download className="mr-2 h-4 w-4" /> {t('home.exportButton')}</Button>
                        <Button variant="outline" disabled><Upload className="mr-2 h-4 w-4" /> {t('dataTab.importButton')}</Button>
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
 
    