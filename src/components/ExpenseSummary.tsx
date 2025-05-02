// components/ExpenseSummary.tsx
"use client";

import type { Expense } from '@/types/expense';
import { filterExpensesByPeriod, calculateTotal, formatCurrency } from '@/lib/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ExpenseSummaryProps {
  expenses: Expense[];
}

export function ExpenseSummary({ expenses }: ExpenseSummaryProps) {
  const weeklyExpenses = filterExpensesByPeriod(expenses, 'week');
  const biWeeklyExpenses = filterExpensesByPeriod(expenses, 'bi-weekly');
  const monthlyExpenses = filterExpensesByPeriod(expenses, 'month');

  const weeklyTotal = calculateTotal(weeklyExpenses);
  const biWeeklyTotal = calculateTotal(biWeeklyExpenses);
  const monthlyTotal = calculateTotal(monthlyExpenses);

  return (
    <Card>
        <CardHeader>
          <CardTitle>Resumen de Gastos</CardTitle>
        </CardHeader>
        <CardContent>
             <Tabs defaultValue="week" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="week">Semana</TabsTrigger>
                    <TabsTrigger value="bi-weekly">Quincena</TabsTrigger>
                    <TabsTrigger value="month">Mes</TabsTrigger>
                </TabsList>
                <TabsContent value="week">
                    <div className="mt-4 p-4 rounded-md border bg-card">
                        <h3 className="text-lg font-semibold">Total Gastado esta Semana</h3>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(weeklyTotal)}</p>
                        <p className="text-sm text-muted-foreground">{weeklyExpenses.length} gasto(s) esta semana.</p>
                    </div>
                </TabsContent>
                 <TabsContent value="bi-weekly">
                    <div className="mt-4 p-4 rounded-md border bg-card">
                        <h3 className="text-lg font-semibold">Total Gastado esta Quincena</h3>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(biWeeklyTotal)}</p>
                        <p className="text-sm text-muted-foreground">{biWeeklyExpenses.length} gasto(s) esta quincena.</p>
                    </div>
                </TabsContent>
                <TabsContent value="month">
                    <div className="mt-4 p-4 rounded-md border bg-card">
                        <h3 className="text-lg font-semibold">Total Gastado este Mes</h3>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(monthlyTotal)}</p>
                         <p className="text-sm text-muted-foreground">{monthlyExpenses.length} gasto(s) este mes.</p>
                    </div>
                </TabsContent>
            </Tabs>
        </CardContent>
    </Card>
  );
}
