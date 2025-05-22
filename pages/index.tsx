
// pages/index.tsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { ExpenseForm } from '@/components/ExpenseForm';
import { ExpenseSummary } from '@/components/ExpenseSummary';
import { ExpenseList } from '@/components/ExpenseList';
import { ExpenseCharts } from '@/components/ExpenseCharts';
import { CategoryCharts } from '@/components/CategoryCharts'; // New import
import type { Expense } from '@/types/expense';
import useLocalStorage from '@/hooks/useLocalStorage';
import { v4 as uuidv4 } from 'uuid';
import { safelyParseDate, formatCurrency } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

import Head from 'next/head';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Upload, Download, Calendar as CalendarIcon } from 'lucide-react';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format as formatDateFns, endOfDay, startOfDay, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale/es';


const DEFAULT_CATEGORY_KEY = 'no definido';

export default function Home() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [categories, setCategories] = useLocalStorage<string[]>('categories', [DEFAULT_CATEGORY_KEY]);
  const [isClient, setIsClient] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);

  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState<Date | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<Date | null>(null);

  // State for active period tab in reporting (7days, 30days, 90days)
  const [activePeriodTab, setActivePeriodTab] = useState<string>('7days');


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !categories.includes(DEFAULT_CATEGORY_KEY)) {
      setCategories(prev => [...prev, DEFAULT_CATEGORY_KEY].sort());
    }
  }, [categories, setCategories, isClient]);

  const handleAddExpense = (newExpenseData: Omit<Expense, 'id' | 'timestamp'>) => {
    const categoryToAdd = newExpenseData.category?.trim() ? newExpenseData.category.trim() : DEFAULT_CATEGORY_KEY;
    const newExpense = {
      ...newExpenseData,
      category: categoryToAdd,
      id: uuidv4(),
      timestamp: new Date(),
    };
    if (categoryToAdd !== DEFAULT_CATEGORY_KEY && !categories.includes(categoryToAdd)) {
      setCategories(prevCategories => [...prevCategories, categoryToAdd].sort());
    }
    setExpenses(prevExpenses => [...prevExpenses, newExpense].sort((a, b) => {
      const timeA = safelyParseDate(a.timestamp)?.getTime() ?? 0;
      const timeB = safelyParseDate(b.timestamp)?.getTime() ?? 0;
      return timeB - timeA;
    }));
    if (productInputRef.current) {
        productInputRef.current.focus();
    }
  };

  const handleDeleteExpense = (idToDelete: string) => {
    setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== idToDelete));
  };

  const handleDeleteProduct = (productNameToDelete: string) => {
    setExpenses(prevExpenses => prevExpenses.filter(expense => expense.product.name !== productNameToDelete));
    toast({
        title: 'Producto Eliminado',
        description: `Todas las entradas para el producto "${productNameToDelete}" han sido eliminadas.`,
    });
  };

  const handleDeleteCategory = (categoryIdentifierToDelete: string) => {
    if (categoryIdentifierToDelete === DEFAULT_CATEGORY_KEY) {
        toast({
            title: 'Acción no permitida',
            description: `La categoría "${DEFAULT_CATEGORY_KEY}" no puede ser eliminada, pero sus gastos sí.`,
            variant: "destructive",
        });
        return;
    }
    setExpenses(prevExpenses => prevExpenses.filter(expense => expense.category !== categoryIdentifierToDelete));
    if (categories.includes(categoryIdentifierToDelete)) {
      setCategories(prev => prev.filter(cat => cat !== categoryIdentifierToDelete));
    }
    toast({
        title: 'Categoría Eliminada',
        description: `Todas las entradas para la categoría "${categoryIdentifierToDelete}" han sido eliminadas, y la categoría ha sido removida de la lista.`,
    });
  };


  const handleExport = () => {
    if (!isClient) return;
    const dataToExport = expenses.map(exp => ({
      Producto: exp.product.name,
      Precio: exp.price,
      Categoria: exp.category,
      Timestamp: exp.timestamp instanceof Date ? exp.timestamp.toISOString() : new Date(exp.timestamp).toISOString(),
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
    if (!isClient || !fileInputRef.current) return;
    fileInputRef.current.click();
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
          const importedCategories = new Set<string>(categories);
          let errorsFound = 0;

          if (result.errors.length > 0) {
            result.errors.forEach(err => console.error('CSV Parsing Error:', err));
            toast({
              title: "Error de Formato CSV",
              description: `Se encontraron ${result.errors.length} errores al leer el archivo. Verifica el formato.`,
              variant: "destructive",
            });
          }

          result.data.forEach((row, index) => {
            const productName = row.Producto?.trim();
            const priceStr = row.Precio?.trim();
            const categoryName = row.Categoria?.trim() || DEFAULT_CATEGORY_KEY;
            const timestampStr = row.Timestamp?.trim(); // Matches the export header "Timestamp"
            const price = parseFloat(priceStr);
            const timestamp = safelyParseDate(timestampStr);


            if (!productName || isNaN(price) || price <= 0 || !timestamp) {
              console.warn(`Fila ${index + 2} omitida: Datos inválidos (Producto: ${productName}, Precio: ${priceStr}, Timestamp: ${timestampStr}, Fecha Parseada: ${timestamp})`);
              errorsFound++;
              return;
            }
            const newExpense: Expense = {
              id: uuidv4(),
              product: { name: productName, value: 0, color: '' },
              price: price,
              category: categoryName,
              timestamp: timestamp,
            };
            importedExpenses.push(newExpense);
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
            setCategories(Array.from(importedCategories).sort());
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
    };
    reader.readAsText(file);
  };

  const uniqueProductsForFilter = useMemo(() => {
    if (!isClient) return ['all'];
    const products = new Set(expenses.map(e => e.product.name));
    return ['all', ...Array.from(products).sort()];
  }, [expenses, isClient]);

  const uniqueCategoriesForFilter = useMemo(() => {
    if (!isClient) return ['all'];
    const cats = new Set(expenses.map(e => e.category || DEFAULT_CATEGORY_KEY));
    return ['all', ...Array.from(cats).sort()];
  }, [expenses, isClient]);

  const filteredExpensesForList = useMemo(() => {
    if (!isClient) return [];
    return expenses.filter(expense => {
      const productMatch = selectedProductFilter === 'all' || expense.product.name === selectedProductFilter;
      const categoryMatch = selectedCategoryFilter === 'all' || (expense.category || DEFAULT_CATEGORY_KEY) === selectedCategoryFilter;

      const expenseTimestamp = safelyParseDate(expense.timestamp);
      if (!expenseTimestamp) return false;

      let dateMatch = true;
      if (startDateFilter && endDateFilter) {
        dateMatch = expenseTimestamp >= startDateFilter && expenseTimestamp <= endOfDay(endDateFilter);
      } else if (startDateFilter) {
        dateMatch = expenseTimestamp >= startDateFilter;
      } else if (endDateFilter) {
        dateMatch = expenseTimestamp <= endOfDay(endDateFilter);
      }
      return productMatch && categoryMatch && dateMatch;
    });
  }, [expenses, selectedProductFilter, selectedCategoryFilter, startDateFilter, endDateFilter, isClient]);

  const totalOfFilteredExpenses = useMemo(() => {
    if (!isClient) return 0;
    return filteredExpensesForList.reduce((sum, expense) => sum + expense.price, 0);
  }, [filteredExpensesForList, isClient]);

  // Filter expenses based on activePeriodTab for CategoryCharts
  const expensesFilteredByPeriodForCategoryCharts = useMemo(() => {
    if (!isClient) return [];
    let daysToFilter = 7; // Default to 7 days
    if (activePeriodTab === '30days') daysToFilter = 30;
    else if (activePeriodTab === '90days') daysToFilter = 90;

    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() - daysToFilter + 1); // Include the cutoff day itself

    const periodStart = startOfDay(cutoffDate);
    const periodEnd = endOfDay(today);

    return expenses.filter(expense => {
        const expenseDate = safelyParseDate(expense.timestamp);
        return expenseDate && isWithinInterval(expenseDate, { start: periodStart, end: periodEnd });
    });
  }, [expenses, activePeriodTab, isClient]);


  let activeGroupType: 'product' | 'category' | undefined = undefined;
  let activeGroupName: string | undefined = undefined;
  let activeGroupDisplayName: string | undefined = undefined;
  let onDeleteActiveGroup: ((identifier: string) => void) | undefined = undefined;

  if (isClient) {
    if (selectedProductFilter !== 'all' && selectedCategoryFilter === 'all' && !startDateFilter && !endDateFilter) {
      activeGroupType = 'product';
      activeGroupName = selectedProductFilter;
      activeGroupDisplayName = selectedProductFilter;
      onDeleteActiveGroup = handleDeleteProduct;
    } else if (selectedCategoryFilter !== 'all' && selectedProductFilter === 'all' && !startDateFilter && !endDateFilter) {
      activeGroupType = 'category';
      activeGroupName = selectedCategoryFilter;
      activeGroupDisplayName = selectedCategoryFilter;
      onDeleteActiveGroup = handleDeleteCategory;
    }
  }


  const historyListTitle = () => {
    if (selectedProductFilter !== 'all' && selectedCategoryFilter !== 'all') {
      return `Historial de ${selectedProductFilter} en ${selectedCategoryFilter}`;
    }
    if (selectedProductFilter !== 'all') {
      return `Historial de ${selectedProductFilter}`;
    }
    if (selectedCategoryFilter !== 'all') {
      return `Historial de ${selectedCategoryFilter}`;
    }
    return 'Historial Completo de Gastos';
  };

  const historyListCaption = () => {
    let baseCaption = "";
    if (selectedProductFilter !== 'all' && selectedCategoryFilter !== 'all') {
      baseCaption = `Gastos para ${selectedProductFilter} en ${selectedCategoryFilter}`;
    } else if (selectedProductFilter !== 'all') {
      baseCaption = `Gastos para el producto ${selectedProductFilter}`;
    } else if (selectedCategoryFilter !== 'all') {
      baseCaption = `Gastos para la categoría ${selectedCategoryFilter}`;
    } else {
      baseCaption = 'Todos los gastos registrados';
    }

    let dateRangeString = "";
    if (startDateFilter && endDateFilter) {
      dateRangeString = ` entre ${formatDateFns(startDateFilter, "PPP", { locale: es })} y ${formatDateFns(endDateFilter, "PPP", { locale: es })}`;
    } else if (startDateFilter) {
      dateRangeString = ` desde ${formatDateFns(startDateFilter, "PPP", { locale: es })}`;
    } else if (endDateFilter) {
      dateRangeString = ` hasta ${formatDateFns(endDateFilter, "PPP", { locale: es })}`;
    }
    
    return `${baseCaption}${dateRangeString}.`;
  };


  return (
    <>
      <Head>
        <title>Control de Gastos</title>
        <meta name="description" content="Registra y analiza tus gastos fácilmente." />
      </Head>
      <main className="container mx-auto px-2 sm:px-4 py-4 min-h-screen">
        <header className="mb-6 md:mb-8 text-center relative">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Control de Gastos</h1>
          <p className="text-sm md:text-base text-muted-foreground">Registra y analiza tus gastos fácilmente.</p>
        </header>

        <Tabs defaultValue="control" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="control">Control de gastos</TabsTrigger>
            <TabsTrigger value="reporting">Reportería</TabsTrigger>
            <TabsTrigger value="data">Exportar/Importar Data</TabsTrigger>
          </TabsList>

          <TabsContent value="control">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="md:col-span-1">
                <ExpenseForm
                  onAddExpense={handleAddExpense}
                  categories={categories.filter(cat => cat !== DEFAULT_CATEGORY_KEY)}
                  defaultCategoryKey={DEFAULT_CATEGORY_KEY}
                  productInputRef={productInputRef}
                />
              </div>
              <div className="md:col-span-2">
                <ExpenseSummary expenses={expenses} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reporting">
            <div className="space-y-4 md:space-y-6">
              <ExpenseCharts 
                expenses={expenses} 
                activePeriodTab={activePeriodTab}
                onActivePeriodTabChange={setActivePeriodTab}
              />
              <CategoryCharts 
                expenses={expensesFilteredByPeriodForCategoryCharts} 
                defaultCategoryKey={DEFAULT_CATEGORY_KEY} 
              />

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Historial de Gastos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor="product-filter-select" className="text-xs sm:text-sm">Filtrar por Producto:</Label>
                      <Select onValueChange={setSelectedProductFilter} value={selectedProductFilter} disabled={!isClient}>
                        <SelectTrigger id="product-filter-select" className="w-full mt-1">
                          <SelectValue placeholder="Seleccionar Producto">
                            {selectedProductFilter === 'all' ? 'Todos los Productos' : selectedProductFilter}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueProductsForFilter.map(product => (
                            <SelectItem key={product} value={product}>
                              {product === 'all' ? 'Todos los Productos' : product}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="category-filter-select" className="text-xs sm:text-sm">Filtrar por Categoría:</Label>
                      <Select onValueChange={setSelectedCategoryFilter} value={selectedCategoryFilter} disabled={!isClient}>
                        <SelectTrigger id="category-filter-select" className="w-full mt-1">
                          <SelectValue placeholder="Seleccionar Categoría">
                            {selectedCategoryFilter === 'all' ? 'Todas las Categorías' : selectedCategoryFilter}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueCategoriesForFilter.map(category => (
                            <SelectItem key={category} value={category}>
                              {category === 'all' ? 'Todas las Categorías' : category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-date-filter" className="text-xs sm:text-sm">Fecha Desde:</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="start-date-filter"
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal mt-1",
                              !startDateFilter && "text-muted-foreground"
                            )}
                            disabled={!isClient}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDateFilter ? formatDateFns(startDateFilter, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={startDateFilter || undefined}
                            onSelect={(date) => setStartDateFilter(date || null)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="end-date-filter" className="text-xs sm:text-sm">Fecha Hasta:</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="end-date-filter"
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal mt-1",
                              !endDateFilter && "text-muted-foreground"
                            )}
                            disabled={!isClient}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDateFilter ? formatDateFns(endDateFilter, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDateFilter || undefined}
                            onSelect={(date) => setEndDateFilter(date || null)}
                            disabled={(date) =>
                              startDateFilter ? date < startDateFilter : false
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="mt-4 mb-2 text-right">
                    <p className="text-lg font-semibold">
                      Total Filtrado: {isClient ? formatCurrency(totalOfFilteredExpenses) : <Skeleton className="h-7 w-32 inline-block" />}
                    </p>
                  </div>
                  {isClient ? (
                    <ExpenseList
                      expenses={filteredExpensesForList}
                      onDeleteExpense={handleDeleteExpense}
                      groupName={activeGroupName}
                      onDeleteGroup={onDeleteActiveGroup}
                      groupTypeLabel={activeGroupType}
                      groupDisplayName={activeGroupDisplayName}
                      title={historyListTitle()}
                      caption={historyListCaption()}
                      defaultCategoryKey={DEFAULT_CATEGORY_KEY}
                    />
                  ) : (
                     <Skeleton className="h-64 w-full" />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

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
                  accept=".csv"
                  style={{ display: 'none' }}
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
                    <Skeleton className="h-10 w-full sm:w-[150px]" />
                    <Skeleton className="h-10 w-full sm:w-[170px]" />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}

    