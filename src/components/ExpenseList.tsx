// components/ExpenseList.tsx
import type { Expense } from '@/types/expense';
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


interface ExpenseListProps {
  expenses: Expense[];
  title?: string;
  caption?: string;
  onDeleteExpense: (id: string) => void; // Make delete handler mandatory
}

export function ExpenseList({ expenses, title = "Historial de Gastos", caption = "Lista de todos tus gastos.", onDeleteExpense }: ExpenseListProps) {
  const { toast } = useToast();

  const handleDeleteClick = (expenseId: string) => {
     onDeleteExpense(expenseId);
     toast({
        title: "Gasto eliminado",
        description: "El gasto ha sido eliminado exitosamente.",
     });
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>{caption}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Fecha y Hora</TableHead>
              <TableHead className="text-right">Acciones</TableHead> {/* Add Actions header */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) // Sort by date descending
              .map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">{expense.product}</TableCell>
                <TableCell>{formatCurrency(expense.price)}</TableCell>
                <TableCell>{formatDate(expense.timestamp)}</TableCell>
                <TableCell className="text-right">
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
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el gasto
                            <span className="font-semibold"> "{expense.product}" </span>
                             con precio <span className="font-semibold">{formatCurrency(expense.price)}</span>.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteClick(expense.id)} className={/* Use default destructive variant styling from button */""}>
                            Eliminar
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
