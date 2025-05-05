
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
  onDeleteProduct?: (productName: string) => void; // Optional: Handler to delete all expenses for a product
}

export function ExpenseList({ expenses, title = "Historial de Gastos", caption = "Lista de todos tus gastos.", onDeleteExpense, onDeleteProduct }: ExpenseListProps) {
  const { toast } = useToast();

  const handleDeleteClick = (expenseId: string) => {
     onDeleteExpense(expenseId);
     toast({
        title: "Gasto eliminado",
        description: "El gasto ha sido eliminado exitosamente.",
     });
  };

  const handleDeleteProductClick = (productName: string) => {
    if (onDeleteProduct) {
      onDeleteProduct(productName);
      toast({
        title: "Producto eliminado",
        description: `Todas las entradas para "${productName}" han sido eliminadas.`,
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

  // Determine if we are showing a list filtered by a single product
  const isSingleProductView = new Set(expenses.map(e => e.product)).size === 1 && expenses.length > 0;
  const singleProductName = isSingleProductView ? expenses[0].product : '';


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {/* Show Delete Product Button only if onDeleteProduct is provided and it's a single product view */}
        {onDeleteProduct && isSingleProductView && (
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar Producto ({singleProductName})
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                         Esta acción no se puede deshacer. Esto eliminará permanentemente todas las entradas para el producto
                         <span className="font-semibold"> "{singleProductName}"</span>.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteProductClick(singleProductName)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Eliminar Producto
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
            {/* IMPORTANT: Ensure no whitespace between TableRow and TableCell elements */}
            {/* Added Categoría header */}
            <TableRow><TableHead>Producto</TableHead><TableHead>Precio</TableHead><TableHead>Categoría</TableHead><TableHead>Fecha y Hora</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {expenses
              .sort((a, b) => {
                // Safely convert timestamps to numbers for comparison
                const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
                const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
                return timeB - timeA;
              })
              .map((expense) => (
              // IMPORTANT: Ensure no whitespace between TableRow and TableCell elements,
              // AND no whitespace around the <TableRow> tag itself within the map.
              // Added TableCell for category with Badge
              <TableRow key={expense.id}><TableCell className="font-medium">{expense.product}</TableCell><TableCell>{formatCurrency(expense.price)}</TableCell><TableCell><Badge variant={expense.category === 'no definido' ? 'secondary' : 'outline'}>{expense.category || 'no definido'}</Badge></TableCell><TableCell>{formatDate(expense.timestamp)}</TableCell><TableCell className="text-right"><AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /><span className="sr-only">Eliminar</span></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el gasto<span className="font-semibold"> "{expense.product}" </span> con precio <span className="font-semibold">{formatCurrency(expense.price)}</span>.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteClick(expense.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar Gasto</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
