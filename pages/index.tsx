
// pages/index.tsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { ExpenseForm } from '@/components/ExpenseForm';
import { ExpenseSummary } from '@/components/ExpenseSummary';
import { ExpenseList } from '@/components/ExpenseList';
import { ExpenseCharts } from '@/components/ExpenseCharts';
import { CategoryCharts } from '@/components/CategoryCharts';
import { EditExpenseDialog } from '@/components/EditExpenseDialog';
import type { Expense } from '@/types/expense';
import useLocalStorage from '@/hooks/useLocalStorage';
import { v4 as uuidv4 } from 'uuid';
import { safelyParseDate, formatCurrency } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';

import Head from 'next/head';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Upload, Download, Calendar as CalendarIcon, FilterX, LogOut, UserCircle, RefreshCw } from 'lucide-react';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format as formatDateFns, endOfDay, startOfDay, isWithinInterval, subDays, isValid } from 'date-fns';
import { es } from 'date-fns/locale/es';


const DEFAULT_CATEGORY_KEY = 'no definido';

type QuickRangeValue = 'allTime' | '7days' | '30days' | '90days' | 'custom';

interface BackendExpense {
  id: number; // Server ID is a number
  local_id?: string | null; 
  productName: string; 
  price: string; 
  category: string;
  timestamp: string; 
  updated_at: string;
  deleted_at?: string | null;
}

interface BackendCategory {
  id: number;
  name: string;
}

interface SyncAllServerDataResponse {
  expenses: BackendExpense[];
  categories: BackendCategory[];
  productNames: string[]; 
  server_timestamp: string;
}


export default function Home() {
  const { toast } = useToast();
  const { currentUser, setCurrentUser, loadingAuth } = useAuth();
  const router = useRouter();

  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [categories, setCategories] = useLocalStorage<string[]>('categories', [DEFAULT_CATEGORY_KEY]);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useLocalStorage<string | null>('lastSyncTimestamp', null);
  const [deletedServerExpenseIds, setDeletedServerExpenseIds] = useLocalStorage<number[]>('deletedServerExpenseIds', []);
  const [isClient, setIsClient] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState<Date | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<Date | null>(null);
  const [selectedQuickRange, setSelectedQuickRange] = useState<QuickRangeValue>('allTime');


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !categories.includes(DEFAULT_CATEGORY_KEY)) {
      setCategories(prev => [...prev, DEFAULT_CATEGORY_KEY].sort());
    }
  }, [categories, setCategories, isClient]);

  useEffect(() => {
    if (!isClient) return;
    const today = new Date();
    let newStart: Date | null = null;
    let newEnd: Date | null = null;

    if (selectedQuickRange === 'allTime') {
      newStart = null;
      newEnd = null;
    } else if (selectedQuickRange === '7days') {
      newStart = startOfDay(subDays(today, 6));
      newEnd = endOfDay(today);
    } else if (selectedQuickRange === '30days') {
      newStart = startOfDay(subDays(today, 29));
      newEnd = endOfDay(today);
    } else if (selectedQuickRange === '90days') {
      newStart = startOfDay(subDays(today, 89));
      newEnd = endOfDay(today);
    } else if (selectedQuickRange === 'custom') {
      // For custom, dates are set directly by the date pickers
      return;
    }
    setStartDateFilter(newStart);
    setEndDateFilter(newEnd);
  }, [selectedQuickRange, isClient]);


  const handleAddExpense = (newExpenseData: Omit<Expense, 'id' | 'timestamp'>) => {
    const categoryToAdd = newExpenseData.category?.trim() ? newExpenseData.category.trim() : DEFAULT_CATEGORY_KEY;
    const newExpense: Expense = {
      ...newExpenseData,
      category: categoryToAdd,
      id: uuidv4(), // Frontend generated UUID
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
    const numericId = parseInt(idToDelete, 10);
    if (!isNaN(numericId) && String(numericId) === idToDelete) { 
        setDeletedServerExpenseIds(prevIds => {
            if (!prevIds.includes(numericId)) {
                return [...prevIds, numericId];
            }
            return prevIds;
        });
    }
    setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== idToDelete));
  };

  const handleEditExpense = (expenseToEdit: Expense) => {
    setEditingExpense(expenseToEdit);
  };

  const handleSaveEditedExpense = (updatedExpenseData: Expense) => {
    const categoryToUpdate = updatedExpenseData.category?.trim() ? updatedExpenseData.category.trim() : DEFAULT_CATEGORY_KEY;
    const finalUpdatedExpense = {
      ...updatedExpenseData,
      category: categoryToUpdate,
    };

    setExpenses(prevExpenses =>
      prevExpenses.map(exp =>
        exp.id === finalUpdatedExpense.id ? finalUpdatedExpense : exp
      ).sort((a, b) => {
        const timeA = safelyParseDate(a.timestamp)?.getTime() ?? 0;
        const timeB = safelyParseDate(b.timestamp)?.getTime() ?? 0;
        return timeB - timeA;
      })
    );

    if (categoryToUpdate !== DEFAULT_CATEGORY_KEY && !categories.includes(categoryToUpdate)) {
      setCategories(prevCategories => [...prevCategories, categoryToUpdate].sort());
    }

    setEditingExpense(null);
    toast({
      title: 'Gasto Actualizado',
      description: `El gasto "${finalUpdatedExpense.product.name}" ha sido actualizado.`,
    });
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
  };

  const handleDeleteProduct = (productNameToDelete: string) => {
    const expensesToDelete = expenses.filter(expense => expense.product.name === productNameToDelete);
    expensesToDelete.forEach(expense => {
        const numericId = parseInt(expense.id, 10);
        if (!isNaN(numericId) && String(numericId) === expense.id) { 
            setDeletedServerExpenseIds(prevIds => {
                if (!prevIds.includes(numericId)) {
                    return [...prevIds, numericId];
                }
                return prevIds;
            });
        }
    });
    setExpenses(prevExpenses => prevExpenses.filter(expense => expense.product.name !== productNameToDelete));
    toast({
        title: 'Producto Eliminado',
        description: `Todas las entradas para el producto "${productNameToDelete}" han sido eliminadas. Se sincronizará la eliminación con el servidor.`,
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
    const expensesToDelete = expenses.filter(expense => expense.category === categoryIdentifierToDelete);
    expensesToDelete.forEach(expense => {
        const numericId = parseInt(expense.id, 10);
        if (!isNaN(numericId) && String(numericId) === expense.id) { 
             setDeletedServerExpenseIds(prevIds => {
                if (!prevIds.includes(numericId)) {
                    return [...prevIds, numericId];
                }
                return prevIds;
            });
        }
    });
    setExpenses(prevExpenses => prevExpenses.filter(expense => expense.category !== categoryIdentifierToDelete));
    if (categories.includes(categoryIdentifierToDelete)) {
      setCategories(prev => prev.filter(cat => cat !== categoryIdentifierToDelete));
    }
    toast({
        title: 'Categoría Eliminada',
        description: `Todas las entradas para la categoría "${categoryIdentifierToDelete}" han sido eliminadas y la categoría removida. Se sincronizará la eliminación.`,
    });
  };

  const handleExport = () => {
    if (!isClient) return;
    const dataToExport = expenses.map(exp => ({
      ID_Frontend: exp.id, 
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
            const timestampStr = row.Timestamp?.trim();
            const price = parseFloat(priceStr);
            let timestamp = safelyParseDate(timestampStr);
            
            if (!timestamp && typeof timestampStr === 'string') {
                const partsWithSeconds = timestampStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}):(\d{2}):(\d{2})/);
                const partsWithoutSeconds = timestampStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}):(\d{2})/);
                const parts = partsWithSeconds || partsWithoutSeconds;

                if (parts) {
                    const day = parts[1];
                    const month = parts[2];
                    const year = parts[3];
                    const hour = parts[4];
                    const minute = parts[5];
                    const second = partsWithSeconds ? parts[6] : '00';
                    const isoAttempt = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
                    timestamp = safelyParseDate(isoAttempt);
                     if (!isValid(timestamp)) {
                        console.warn(`Fila ${index + 2}: Falló el intento de parseo de fecha custom: ${timestampStr} -> ${isoAttempt}`);
                        timestamp = null; 
                    }
                } else {
                    console.warn(`Fila ${index + 2}: Formato de fecha no reconocido al importar: ${timestampStr}`);
                }
            }


            if (!productName || isNaN(price) || price <= 0 || !timestamp || !isValid(timestamp)) {
              console.warn(`Fila ${index + 2} omitida: Datos inválidos (Producto: ${productName}, Precio: ${priceStr}, Timestamp: ${timestampStr}, Fecha Parseada: ${timestamp})`);
              errorsFound++;
              return;
            }
            const newExpense: Expense = {
              id: row.ID_Frontend || uuidv4(), 
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

  const filteredExpenses = useMemo(() => {
    if (!isClient) return [];
    return expenses.filter(expense => {
      const productMatch = selectedProductFilter === 'all' || expense.product.name === selectedProductFilter;
      const categoryMatch = selectedCategoryFilter === 'all' || (expense.category || DEFAULT_CATEGORY_KEY) === selectedCategoryFilter;

      const expenseTimestamp = safelyParseDate(expense.timestamp);
      if (!expenseTimestamp || !isValid(expenseTimestamp)) return false; 

      let dateMatch = true;
      const effectiveStartDate = startDateFilter ? startOfDay(startDateFilter) : null;
      const effectiveEndDate = endDateFilter ? endOfDay(endDateFilter) : null;
      
      if (effectiveStartDate && effectiveEndDate) {
        dateMatch = isWithinInterval(expenseTimestamp, { start: effectiveStartDate, end: effectiveEndDate });
      } else if (effectiveStartDate) {
        dateMatch = expenseTimestamp >= effectiveStartDate;
      } else if (effectiveEndDate) {
        dateMatch = expenseTimestamp <= effectiveEndDate;
      }
      return productMatch && categoryMatch && dateMatch;
    });
  }, [expenses, selectedProductFilter, selectedCategoryFilter, startDateFilter, endDateFilter, isClient]);

  const totalOfFilteredExpenses = useMemo(() => {
    if (!isClient) return 0;
    return filteredExpenses.reduce((sum, expense) => sum + expense.price, 0);
  }, [filteredExpenses, isClient]);

  const handleClearFilters = () => {
    setSelectedProductFilter('all');
    setSelectedCategoryFilter('all');
    setSelectedQuickRange('allTime'); 
  };
  
  const handleDateSelect = (dateSetter: (date: Date | null) => void, date: Date | null) => {
    dateSetter(date);
    setSelectedQuickRange('custom'); 
  };

  const handleLogout = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    if (token) {
      try {
        // No need to await, just fire and forget for logout
        fetch('https://back.presupuesto.peryloth.com/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Error calling logout endpoint:', error);
        // Don't block logout if API call fails
      }
    }

    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('lastSyncTimestamp'); 
      localStorage.removeItem('deletedServerExpenseIds');
    }
    toast({
      title: 'Sesión Cerrada',
      description: 'Has cerrado sesión exitosamente.',
    });
    router.push('/login'); // Redirect to login after clearing session
  };


  const handleSyncData = async () => {
    if (!isClient || !currentUser) {
      toast({ title: 'Sincronización Fallida', description: 'Debes iniciar sesión para sincronizar.', variant: 'destructive' });
      return;
    }
    setIsSyncing(true);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast({ title: 'Sincronización Fallida', description: 'Token no encontrado. Inicia sesión de nuevo.', variant: 'destructive' });
      setIsSyncing(false);
      return;
    }

    // --- PUSH Phase (using replace-all-client-data strategy) ---
    try {
      const clientExpensesPayload = expenses.map(exp => {
        // ID for existing server items is a string like "1", "23". New items have UUID string.
        const isServerId = !isNaN(parseInt(exp.id, 10));
        return {
          id: isServerId ? exp.id : null, // Send server ID as string if it exists
          local_id: isServerId ? null : exp.id, // Send UUID as local_id for new items
          product: exp.product.name, 
          price: exp.price,
          category: exp.category || DEFAULT_CATEGORY_KEY,
          timestamp: exp.timestamp instanceof Date ? exp.timestamp.toISOString() : new Date(exp.timestamp).toISOString(),
        };
      });

      const pushResponse = await fetch('https://back.presupuesto.peryloth.com/api/sync/replace-all-client-data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ expenses: clientExpensesPayload }),
      });

      if (!pushResponse.ok) {
        const errorData = await pushResponse.json().catch(() => ({ message: `Error al enviar cambios (PUSH): ${pushResponse.status}` }));
        throw new Error(errorData.message || `Error ${pushResponse.status}: ${JSON.stringify(errorData)}`);
      }

      const pushResult = await pushResponse.json();
      toast({ 
        title: 'Cambios Locales Enviados (Replace All)', 
        description: `${pushResult.created_count || 0} creados, ${pushResult.updated_count || 0} actualizados por el servidor.` 
      });
    } catch (error: any) {
      console.error('Error en la fase PUSH de sincronización (Replace All):', error);
      toast({ title: 'Error al Enviar Cambios (Replace All)', description: error.message || 'No se pudo enviar los cambios locales.', variant: 'destructive' });
      setIsSyncing(false);
      return; 
    }

    // --- PULL Phase (using get-all-server-data strategy) ---
    try {
      const syncUrl = 'https://back.presupuesto.peryloth.com/api/sync/get-all-server-data';

      const response = await fetch(syncUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Error del servidor al obtener datos (PULL): ${response.status}` }));
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      const syncResponse: SyncAllServerDataResponse = await response.json();
      
      const serverExpensesTransformed: Expense[] = syncResponse.expenses
        .filter(be => !be.deleted_at) 
        .map(be => {
          const frontendPrice = parseFloat(be.price);
          const frontendTimestamp = safelyParseDate(be.timestamp);

          if (isNaN(frontendPrice) || !frontendTimestamp || !isValid(frontendTimestamp) || !be.productName) {
            console.warn('Gasto inválido recibido del servidor (PULL):', be);
            return null; 
          }
          return {
            id: String(be.id), // Store server ID as string
            product: { name: be.productName, value: 0, color: '' }, 
            price: frontendPrice,
            category: be.category || DEFAULT_CATEGORY_KEY,
            timestamp: frontendTimestamp,
          };
        })
        .filter((exp): exp is Expense => exp !== null) 
        .sort((a, b) => (safelyParseDate(b.timestamp)!.getTime() - safelyParseDate(a.timestamp)!.getTime()));


      setExpenses(serverExpensesTransformed); 
      
      const serverCategories = syncResponse.categories.map(cat => cat.name);
      const finalCategories = Array.from(new Set([DEFAULT_CATEGORY_KEY, ...serverCategories])).sort();
      setCategories(finalCategories);
      
      setLastSyncTimestamp(syncResponse.server_timestamp);
      setDeletedServerExpenseIds([]); // Clear after successful sync (both PUSH and PULL parts for deletions that might use this)

      toast({ title: 'Sincronización Completada (Pull All)', description: `${serverExpensesTransformed.length} gastos y ${finalCategories.length} categorías actualizadas desde el servidor.` });

    } catch (error: any) {
      console.error('Error en la fase PULL de sincronización (Get All):', error);
      toast({ title: 'Error al Obtener Datos Completos (Pull All)', description: error.message || 'No se pudo obtener datos del servidor.', variant: 'destructive' });
    } finally {
      setIsSyncing(false);
    }
  };


  let activeGroupType: 'product' | 'category' | undefined = undefined;
  let activeGroupName: string | undefined = undefined;
  let activeGroupDisplayName: string | undefined = undefined;
  let onDeleteActiveGroup: ((identifier: string) => void) | undefined = undefined;

  if (isClient) {
    const isProductFiltered = selectedProductFilter !== 'all';
    const isCategoryFiltered = selectedCategoryFilter !== 'all';
    
    const noDateFiltersActive = selectedQuickRange === 'allTime' && !startDateFilter && !endDateFilter;

    if (isProductFiltered && !isCategoryFiltered && noDateFiltersActive) {
        activeGroupType = 'product';
        activeGroupName = selectedProductFilter;
        activeGroupDisplayName = selectedProductFilter;
        onDeleteActiveGroup = handleDeleteProduct;
    } else if (isCategoryFiltered && !isProductFiltered && noDateFiltersActive) {
        activeGroupType = 'category';
        activeGroupName = selectedCategoryFilter;
        activeGroupDisplayName = selectedCategoryFilter;
        onDeleteActiveGroup = handleDeleteCategory;
    }
  }

  const historyListTitle = () => {
    if (selectedProductFilter !== 'all' && selectedCategoryFilter !== 'all') {
      return `Historial de ${selectedProductFilter} (${selectedCategoryFilter})`;
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
      baseCaption = `Gastos para ${selectedProductFilter} (${selectedCategoryFilter})`;
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
    } else {
      dateRangeString = " (todo el tiempo)";
    }
    
    return `${baseCaption}${dateRangeString}. Total: ${formatCurrency(totalOfFilteredExpenses)}`;
  };
  
  const { minExpenseDateOverall, maxExpenseDateOverall } = useMemo(() => {
    if (!isClient || expenses.length === 0) {
      const today = new Date();
      return { 
        minExpenseDateOverall: startOfDay(subDays(today, 6)), 
        maxExpenseDateOverall: endOfDay(today) 
      };
    }
    let minD: Date | null = null;
    let maxD: Date | null = null;
    expenses.forEach(expense => {
      const current = safelyParseDate(expense.timestamp);
      if (current && isValid(current)) { 
        if (minD === null || current < minD) minD = current;
        if (maxD === null || current > maxD) maxD = current;
      }
    });
    const fallbackStart = startOfDay(subDays(new Date(), 6)); 
    const fallbackEnd = endOfDay(new Date());
    return { 
      minExpenseDateOverall: minD ? startOfDay(minD) : fallbackStart,
      maxExpenseDateOverall: maxD ? endOfDay(maxD) : fallbackEnd
    };
  }, [expenses, isClient]);

  const graphViewStartDate = startDateFilter ?? minExpenseDateOverall;
  const graphViewEndDate = endDateFilter ?? maxExpenseDateOverall;


  if (loadingAuth && isClient) { 
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-16 w-16 rounded-full animate-spin" /> 
        <p className="ml-4 text-lg">Cargando...</p>
      </div>
    );
  }

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
          <TabsList className="grid w-full grid-cols-4 mb-6"> 
            <TabsTrigger value="control">Control de gastos</TabsTrigger>
            <TabsTrigger value="reporting">Reportería</TabsTrigger>
            <TabsTrigger value="data">Exportar/Importar</TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger> 
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
              <Card className="mb-4 md:mb-6">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Filtros de Reportería</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-1">
                      <Label htmlFor="quick-range-select" className="text-xs sm:text-sm">Rango Rápido:</Label>
                      <Select onValueChange={(value) => setSelectedQuickRange(value as QuickRangeValue)} value={selectedQuickRange} disabled={!isClient}>
                        <SelectTrigger id="quick-range-select" className="w-full mt-1">
                          <SelectValue placeholder="Seleccionar Rango" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="allTime">Todo el tiempo</SelectItem>
                          <SelectItem value="7days">Últimos 7 días</SelectItem>
                          <SelectItem value="30days">Últimos 30 días</SelectItem>
                          <SelectItem value="90days">Últimos 90 días</SelectItem>
                          <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
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
                                onSelect={(date) => handleDateSelect(setStartDateFilter, date || null)}
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
                                onSelect={(date) => handleDateSelect(setEndDateFilter, date || null)}
                                disabled={(date) =>
                                  startDateFilter ? date < startDateFilter : false
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                    </div>
                  </div>
                   <div className="flex justify-end">
                        <Button onClick={handleClearFilters} variant="outline" className="w-full sm:w-auto mt-2 sm:mt-0" disabled={!isClient}>
                            <FilterX className="mr-2 h-4 w-4" /> Limpiar Filtros
                        </Button>
                    </div>
                </CardContent>
              </Card>
              
              <ExpenseCharts 
                expenses={filteredExpenses} 
                startDate={graphViewStartDate} 
                endDate={graphViewEndDate}     
              />
              <CategoryCharts 
                expenses={filteredExpenses} 
                defaultCategoryKey={DEFAULT_CATEGORY_KEY} 
              />

              <Card>
                <CardHeader>
                   <CardTitle className="text-lg sm:text-xl">{historyListTitle()}</CardTitle>
                   <CardDescription>{historyListCaption()}</CardDescription>
                </CardHeader>
                <CardContent className="px-0 sm:px-6 sm:pb-6">
                  {isClient ? (
                    <ExpenseList
                      expenses={filteredExpenses}
                      onDeleteExpense={handleDeleteExpense}
                      onEditExpense={handleEditExpense}
                      groupName={activeGroupName}
                      onDeleteGroup={onDeleteActiveGroup}
                      groupTypeLabel={activeGroupType}
                      groupDisplayName={activeGroupDisplayName}
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

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCircle className="mr-2 h-6 w-6" /> Perfil y Sincronización
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isClient && currentUser ? (
                  <div className="space-y-3">
                    <p className="text-lg">
                      ¡Bienvenido de nuevo, <span className="font-semibold">{currentUser.name || currentUser.email}</span>!
                    </p>
                    <p className="text-sm text-muted-foreground">Email: {currentUser.email}</p>
                    <Button onClick={handleSyncData} className="w-full sm:w-auto" disabled={isSyncing}>
                      {isSyncing ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Sincronizando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" /> Sincronizar Datos
                        </>
                      )}
                    </Button>
                    <Button onClick={handleLogout} variant="outline" className="w-full sm:w-auto">
                      <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                    </Button>
                  </div>
                ) : isClient ? ( 
                  <div className="space-y-3 text-center sm:text-left">
                    <p>Inicia sesión o regístrate para sincronizar tus datos entre dispositivos.</p>
                    <p className="text-xs text-muted-foreground">
                      Puedes seguir usando la aplicación localmente sin una cuenta.
                    </p>
                    <Button onClick={() => router.push('/login')} className="w-full sm:w-auto">
                      <UserCircle className="mr-2 h-4 w-4" /> Ir a Iniciar Sesión / Registrarse
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-10 w-full sm:w-[220px]" />
                    <Skeleton className="h-10 w-full sm:w-[150px]" />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {editingExpense && isClient && (
          <EditExpenseDialog
            expense={editingExpense}
            onSave={handleSaveEditedExpense}
            onCancel={handleCancelEdit}
            categories={categories.filter(cat => cat !== DEFAULT_CATEGORY_KEY)}
            defaultCategoryKey={DEFAULT_CATEGORY_KEY}
          />
        )}
      </main>
    </>
  );
}

    