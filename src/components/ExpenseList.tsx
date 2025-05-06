// components/ExpenseList.tsx

import type { Expense } from '@/types/expense';
import React from 'react'; 
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  title?: string;
  caption?: string;
  onDeleteExpense: (id: string) => void;
  groupName?: string;        
  groupDisplayName?: string; 
  onDeleteGroup?: (identifier: string) => void; 
  groupTypeLabel?: 'product' | 'category' | string; 
  defaultCategoryKey: string; 
}

export function ExpenseList({
  expenses,
  title: propTitle, 
  caption: propCaption, 
  onDeleteExpense,
  groupName, 
  groupDisplayName, 
  onDeleteGroup, 
  groupTypeLabel, 
  defaultCategoryKey 
}: ExpenseListProps) {
  const { toast } = useToast();

  const title = propTitle ?? 'Historial de Gastos';
  const caption = propCaption ?? 'Lista de todos tus gastos.';
  
  const getGroupTypeDisplayLabel = () => {
    if (groupTypeLabel === 'product') return 'Producto';
    if (groupTypeLabel === 'category') return 'Categoría';
    return groupTypeLabel || 'Grupo'; 
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
    if (onDeleteGroup) {
      onDeleteGroup(identifier);
      // Toast message is handled in the parent (pages/index.tsx) for specific product/category deletion messages
    }
  };


  if (!expenses || expenses.length === 0) {
    return (
       <Card>
        <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
          <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <p className="text-muted-foreground text-center p-4">No hay gastos para mostrar.</p> 
        </CardContent>
      </Card>
    )
  }

  const isSingleGroupView = !!onDeleteGroup && !!groupName && !!groupTypeLabel;


  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
        <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
        {isSingleGroupView && groupName && ( 
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="w-full sm:w-auto">
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar {currentGroupTypeDisplayLabel} ({groupDisplayName || groupName})
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente todas las entradas para {currentGroupTypeDisplayLabel.toLowerCase()} "{groupDisplayName || groupName}".
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
        )}
      </CardHeader>
      <CardContent className="px-0 sm:px-6 sm:pb-4">
        <Table>
          <TableCaption className="px-4 sm:px-6 py-2 text-xs sm:text-sm">{caption}</TableCaption>
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
                          {expense.category} 
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
      </CardContent>
    </Card>
  );
}
