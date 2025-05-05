
// components/ExpenseList.tsx

import type { Expense } from '@/types/expense';
import React from 'react'; // Import React
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
import { formatCurrency, formatDate } from '@/lib/dateUtils';
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
import { Badge } from '@/components/ui/badge'; // Import Badge


interface ExpenseListProps {
  expenses: Expense[];
  title?: string;
  caption?: string;
  onDeleteExpense: (id: string) => void;
  // Generic group deletion props
  groupName?: string;         // Name of the current group (product or category) being viewed
  onDeleteGroup?: (name: string) => void; // Handler to delete all expenses for the group
  groupTypeLabel?: string;   // Label for the group type (e.g., "Producto", "Categoría")
}

export function ExpenseList({
  expenses,
  title = "Historial de Gastos",
  caption = "Lista de todos tus gastos.",
  onDeleteExpense,
  groupName, // Use generic prop
  onDeleteGroup, // Use generic prop
  groupTypeLabel // Use generic prop
}: ExpenseListProps) {
  const { toast } = useToast();

  const handleDeleteClick = (expenseId: string) => {
     onDeleteExpense(expenseId);
     toast({
        title: "Gasto eliminado",
        description: "El gasto ha sido eliminado exitosamente.",
     });
  };

  // Renamed handler for clarity
  const handleDeleteGroupClick = (name: string) => {
    if (onDeleteGroup) {
      onDeleteGroup(name);
      toast({
        title: `${groupTypeLabel || 'Grupo'} eliminado`, // Use groupTypeLabel
        description: `Todas las entradas para "${name}" han sido eliminadas.`,
      });
    }
  };


  if (!expenses || expenses.length === 0) {
    return (
       <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No hay gastos para mostrar.</p>
        </CardContent>
      </Card>
    )
  }

  // Determine if we are showing a list filtered by a single group (product or category)
  // Check if onDeleteGroup is provided, which implies a filtered view that might allow deletion
  const isSingleGroupView = !!onDeleteGroup && !!groupName;


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {/* Show Delete Group Button only if it's a single group view */}
        {isSingleGroupView && (
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    {/* Use groupTypeLabel and groupName in the button text */}
                    <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar {groupTypeLabel} ({groupName})
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    {/* Use groupTypeLabel and groupName in the dialog description */}
                    <AlertDialogDescription>
                         Esta acción no se puede deshacer. Esto eliminará permanentemente todas las entradas para {groupTypeLabel?.toLowerCase() || 'el grupo'}
                         <span className="font-semibold"> "{groupName}"</span>.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    {/* Use groupTypeLabel in the action button */}
                    <AlertDialogAction onClick={() => handleDeleteGroupClick(groupName!)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Eliminar {groupTypeLabel}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>{caption}</TableCaption>
          <TableHeader>
            <TableRow><TableHead>Producto</TableHead><TableHead>Precio</TableHead><TableHead>Categoría</TableHead><TableHead>Fecha y Hora</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {expenses
              .sort((a, b) => {
                const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
                const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
                return timeB - timeA;
              })
              .map((expense) => (
              <TableRow key={expense.id}><TableCell className="font-medium">{expense.product}</TableCell><TableCell>{formatCurrency(expense.price)}</TableCell><TableCell><Badge variant={expense.category === 'no definido' ? 'secondary' : 'outline'}>{expense.category || 'no definido'}</Badge></TableCell><TableCell>{formatDate(expense.timestamp)}</TableCell><TableCell className="text-right"><AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /><span className="sr-only">Eliminar</span></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el gasto<span className="font-semibold"> "{expense.product}" </span> con precio <span className="font-semibold">{formatCurrency(expense.price)}</span>.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteClick(expense.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar Gasto</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
