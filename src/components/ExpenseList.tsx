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
import { formatCurrency, formatDate } from '@/lib/dateUtils';

interface ExpenseListProps {
  expenses: Expense[];
  title?: string;
  caption?: string;
}

export function ExpenseList({ expenses, title = "Historial de Gastos", caption = "Lista de todos tus gastos." }: ExpenseListProps) {
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
