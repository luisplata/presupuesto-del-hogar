
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
  groupName?: string;         // Identifier (key or name) of the current group
  groupDisplayName?: string;  // Display name of the group for UI
  onDeleteGroup?: (identifier: string) => void; // Handler uses the identifier
  groupTypeLabel?: string;   // Label for the group type (e.g., "Producto", "Categoría")
  defaultCategoryKey: string; // Receive the key for the default category
}

export function ExpenseList({
  expenses,
  title: propTitle, // Rename prop to avoid conflict
  caption: propCaption, // Rename prop
  onDeleteExpense,
  groupName, // Use generic identifier prop
  groupDisplayName, // Use display name prop for UI
  onDeleteGroup, // Use generic prop
  groupTypeLabel, // Use generic prop (already translated if coming from parent)
  defaultCategoryKey // Use key
}: ExpenseListProps) {
  const { toast } = useToast();

  // Hardcoded Spanish defaults
  const title = propTitle ?? 'Historial de Gastos';
  const caption = propCaption ?? 'Lista de todos tus gastos.';
  const defaultGroupType = 'Grupo';


  const handleDeleteClick = (expenseId: string) => {
     onDeleteExpense(expenseId);
     toast({
        title: 'Gasto eliminado',
        description: 'El gasto ha sido eliminado exitosamente.',
     });
  };

  // Renamed handler for clarity - uses the group identifier (key or name)
  const handleDeleteGroupClick = (identifier: string) => {
    if (onDeleteGroup) {
      onDeleteGroup(identifier);
      toast({
        title: `${groupTypeLabel || defaultGroupType} eliminado`,
        description: `Todas las entradas para "${groupDisplayName || identifier}" han sido eliminadas.`,
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
          <p className="text-muted-foreground text-center p-4">No hay gastos para mostrar.</p> {/* Centered message */}
        </CardContent>
      </Card>
    )
  }

  // Determine if we are showing a list filtered by a single group
  const isSingleGroupView = !!onDeleteGroup && !!groupName;


  return (
    <Card>
      {/* Adjust CardHeader padding and flex direction for mobile */}
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
        <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
        {/* Show Delete Group Button only if it's a single group view */}
        {isSingleGroupView && groupName && ( // Ensure groupName exists
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    {/* Make button full width on small screens */}
                    <Button variant="destructive" size="sm" className="w-full sm:w-auto">
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar {groupTypeLabel} ({groupDisplayName || groupName})
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente todas las entradas para {groupTypeLabel?.toLowerCase() || defaultGroupType.toLowerCase()} "{groupDisplayName || groupName}".
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteGroupClick(groupName)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                         Eliminar {groupTypeLabel}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
      </CardHeader>
      {/* Adjust CardContent padding */}
      <CardContent className="px-0 sm:px-6 sm:pb-4">
        {/* The Table component's internal div handles overflow */}
        <Table>
          <TableCaption className="px-4 sm:px-6 py-2 text-xs sm:text-sm">{caption}</TableCaption>
          <TableHeader>
            <TableRow>
                {/* Adjust padding for table heads */}
                <TableHead className="px-2 py-2 sm:px-4">Producto</TableHead>
                <TableHead className="px-2 py-2 sm:px-4">Precio</TableHead>
                {/* Hide Category on very small screens if necessary, or keep it */}
                <TableHead className="hidden md:table-cell px-2 py-2 sm:px-4">Categoría</TableHead>
                {/* Hide full date on small screens, maybe show just time or simplified date? */}
                <TableHead className="hidden lg:table-cell px-2 py-2 sm:px-4">Fecha y Hora</TableHead>
                <TableHead className="text-right px-2 py-2 sm:px-4">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses
              .sort((a, b) => {
                const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
                const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
                return timeB - timeA;
              })
              .map((expense) => (
              <TableRow key={expense.id}>
                  {/* Adjust padding and maybe truncate text */}
                  <TableCell className="font-medium px-2 py-2 sm:px-4 truncate max-w-[100px] sm:max-w-xs">{expense.product.name}</TableCell>
                  <TableCell className="px-2 py-2 sm:px-4 whitespace-nowrap">{formatCurrency(expense.price)}</TableCell>
                  {/* Hide Category cell content on small screens if column is hidden */}
                  <TableCell className="hidden md:table-cell px-2 py-2 sm:px-4">
                      <Badge variant={expense.category === defaultCategoryKey ? 'secondary' : 'outline'} className="text-xs">
                          {expense.category} {/* Display stored category name directly */}
                      </Badge>
                  </TableCell>
                   {/* Hide Date cell content on small screens if column is hidden */}
                  <TableCell className="hidden lg:table-cell px-2 py-2 sm:px-4 whitespace-nowrap">{formatDate(expense.timestamp)}</TableCell> {/* Use default locale (Spanish) */}
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

    