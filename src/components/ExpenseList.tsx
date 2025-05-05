
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
import { useLocale } from '@/hooks/useLocale'; // Import useLocale


interface ExpenseListProps {
  expenses: Expense[];
  title?: string;
  caption?: string;
  onDeleteExpense: (id: string) => void;
  // Generic group deletion props
  groupName?: string;         // Name of the current group (product or category) being viewed
  onDeleteGroup?: (name: string) => void; // Handler to delete all expenses for the group
  groupTypeLabel?: string;   // Label for the group type (e.g., "Producto", "Categoría") - Will be translated
  defaultCategory: string; // Pass translated default category
}

export function ExpenseList({
  expenses,
  title: propTitle, // Rename prop to avoid conflict
  caption: propCaption, // Rename prop
  onDeleteExpense,
  groupName, // Use generic prop
  onDeleteGroup, // Use generic prop
  groupTypeLabel, // Use generic prop (already translated if coming from parent)
  defaultCategory // Use translated default
}: ExpenseListProps) {
  const { t, currentLocale } = useLocale(); // Use the hook
  const { toast } = useToast();

  // Use translated defaults if props are not provided
  const title = propTitle ?? t('list.defaultTitle');
  const caption = propCaption ?? t('list.defaultCaption');


  const handleDeleteClick = (expenseId: string) => {
     onDeleteExpense(expenseId);
     toast({
        title: t('list.toast.expenseDeletedTitle'),
        description: t('list.toast.expenseDeletedDescription'),
     });
  };

  // Renamed handler for clarity
  const handleDeleteGroupClick = (name: string) => {
    if (onDeleteGroup) {
      onDeleteGroup(name);
      toast({
        // Use the already translated groupTypeLabel passed from parent
        title: t('list.toast.groupDeletedTitle', { groupType: groupTypeLabel || t('list.defaultGroupType') }),
        description: t('list.toast.groupDeletedDescription', { name }),
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
          <p className="text-muted-foreground">{t('list.noExpenses')}</p>
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
                        <Trash2 className="mr-2 h-4 w-4" /> {t('list.deleteGroupButton', { groupType: groupTypeLabel, groupName })}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>{t('list.deleteConfirmTitle')}</AlertDialogTitle>
                    {/* Use groupTypeLabel and groupName in the dialog description */}
                    <AlertDialogDescription>
                        {t('list.deleteConfirmDescription', { groupType: groupTypeLabel?.toLowerCase() || t('list.defaultGroupType').toLowerCase(), groupName })}
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>{t('list.cancelButton')}</AlertDialogCancel>
                    {/* Use groupTypeLabel in the action button */}
                    <AlertDialogAction onClick={() => handleDeleteGroupClick(groupName!)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                         {t('list.deleteButton', { groupType: groupTypeLabel })}
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
            <TableRow>
                <TableHead>{t('list.header.product')}</TableHead>
                <TableHead>{t('list.header.price')}</TableHead>
                <TableHead>{t('list.header.category')}</TableHead>
                <TableHead>{t('list.header.datetime')}</TableHead>
                <TableHead className="text-right">{t('list.header.actions')}</TableHead>
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
                  <TableCell className="font-medium">{expense.product}</TableCell>
                  <TableCell>{formatCurrency(expense.price)}</TableCell>
                  <TableCell>
                      {/* Use defaultCategory for comparison */}
                      <Badge variant={expense.category === defaultCategory ? 'secondary' : 'outline'}>
                          {expense.category || defaultCategory}
                      </Badge>
                  </TableCell>
                  <TableCell>{formatDate(expense.timestamp, currentLocale)}</TableCell> {/* Pass locale */}
                  <TableCell className="text-right">
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                  <span className="sr-only">{t('list.deleteAction')}</span>
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>{t('list.deleteConfirmTitle')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      {t('list.deleteSingleConfirmDescription', { product: expense.product, price: formatCurrency(expense.price) })}
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>{t('list.cancelButton')}</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteClick(expense.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      {t('list.deleteSingleButton')}
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
