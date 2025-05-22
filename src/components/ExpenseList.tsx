
// components/ExpenseList.tsx

import type { Expense } from '@/types/expense';
import React from 'react'; 
import {
  Table,
  TableBody,
  TableCaption, // Keep if you decide to use it elsewhere, otherwise can remove
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Removed CardDescription if not used
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { formatCurrency, formatDate, safelyParseDate } from '@/lib/dateUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge'; 


interface ExpenseListProps {
  expenses: Expense[];
  // title?: string; // Title will be handled by parent CardHeader
  // caption?: string; // Caption will be handled by parent CardHeader CardDescription
  onDeleteExpense: (id: string) => void;
  groupName?: string;        
  groupDisplayName?: string; 
  onDeleteGroup?: (identifier: string) => void; 
  groupTypeLabel?: 'product' | 'category' | undefined;
  defaultCategoryKey: string; 
}

export function ExpenseList({
  expenses,
  onDeleteExpense,
  groupName, 
  groupDisplayName, 
  onDeleteGroup, 
  groupTypeLabel, 
  defaultCategoryKey 
}: ExpenseListProps) {
  const { toast } = useToast();
  
  const getGroupTypeDisplayLabel = () => {
    if (groupTypeLabel === 'product') return 'Producto';
    if (groupTypeLabel === 'category') return 'Categoría';
    return 'Grupo';
  };
  const currentGroupTypeDisplayLabel = getGroupTypeDisplayLabel();


  const handleDeleteClick = (expenseId: string) => {
     onDeleteExpense(expenseId);
     toast({
        title: 'Gasto eliminado',
        description: 'El gasto ha sido eliminado exitosamente.',
     });
  };

  const handleDeleteGroupClick = (identifier: string) => {
    if (onDeleteGroup && identifier) {
      onDeleteGroup(identifier);
    }
  };


  if (!expenses || expenses.length === 0) {
    return (
        // The Card and CardHeader are now handled by the parent in pages/index.tsx
        // This component will just render the "no data" message or the table
         <div className="text-muted-foreground text-center p-4">
            No hay gastos para mostrar con los filtros seleccionados.
         </div>
    )
  }

  const isSingleGroupView = !!onDeleteGroup && !!groupName && !!groupTypeLabel;


  return (
    // The main Card and CardHeader are now in pages/index.tsx
    // This component focuses on rendering the table itself
    <> 
      {isSingleGroupView && groupName && (
            <div className="mb-4 text-right"> {/* Moved button outside table, but within list's content area */}
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            className="w-full sm:w-auto"
                            disabled={groupTypeLabel === 'category' && groupName === defaultCategoryKey}
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar {currentGroupTypeDisplayLabel} ({groupDisplayName || groupName})
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente todas las entradas para {currentGroupTypeDisplayLabel.toLowerCase()} "{groupDisplayName || groupName}".
                            {groupTypeLabel === 'category' && groupName !== defaultCategoryKey && " La categoría también será eliminada de la lista de sugerencias."}
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteGroupClick(groupName)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                             Eliminar {currentGroupTypeDisplayLabel}
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        )}
        <Table>
          {/* TableCaption can be removed if description is in CardHeader */}
          {/* <TableCaption className="px-4 sm:px-6 py-2 text-xs sm:text-sm">{caption}</TableCaption> */}
          <TableHeader>
            <TableRow>
                <TableHead className="px-2 py-2 sm:px-4">Producto</TableHead>
                <TableHead className="px-2 py-2 sm:px-4">Precio</TableHead>
                <TableHead className="hidden md:table-cell px-2 py-2 sm:px-4">Categoría</TableHead>
                <TableHead className="hidden lg:table-cell px-2 py-2 sm:px-4">Fecha y Hora</TableHead>
                <TableHead className="text-right px-2 py-2 sm:px-4">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses
              .sort((a, b) => {
                const timeA = safelyParseDate(a.timestamp)?.getTime() ?? 0;
                const timeB = safelyParseDate(b.timestamp)?.getTime() ?? 0;
                return timeB - timeA; 
              })
              .map((expense) => (
              <TableRow key={expense.id}>
                  <TableCell className="font-medium px-2 py-2 sm:px-4 truncate max-w-[100px] sm:max-w-xs">{expense.product.name}</TableCell>
                  <TableCell className="px-2 py-2 sm:px-4 whitespace-nowrap">{formatCurrency(expense.price)}</TableCell>
                  <TableCell className="hidden md:table-cell px-2 py-2 sm:px-4">
                      <Badge variant={expense.category === defaultCategoryKey ? 'secondary' : 'outline'} className="text-xs">
                          {expense.category || defaultCategoryKey} 
                      </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell px-2 py-2 sm:px-4 whitespace-nowrap">{formatDate(expense.timestamp)}</TableCell> 
                  <TableCell className="text-right px-2 py-2 sm:px-4">
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                  <span className="sr-only">Eliminar</span>
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      Esta acción no se puede deshacer. Esto eliminará permanentemente el gasto "{expense.product.name}" con precio {formatCurrency(expense.price)}.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteClick(expense.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Eliminar Gasto
                                  </AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                  </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    </>
  );
}
