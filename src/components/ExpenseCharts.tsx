
// components/ExpenseCharts.tsx
'use client'; // Ensure this component runs on the client for Recharts

import { useMemo, useState, useEffect } from 'react';
import type { Expense } from '@/types/expense';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency, safelyParseDate } from '@/lib/dateUtils'; // Import utility functions
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"; // Import shadcn chart components
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton

interface ExpenseChartsProps {
  expenses: Expense[];
}

interface DailyExpense {
  date: string; // Format: 'yyyy-MM-dd' or 'dd MMM' for display
  total: number;
}

// Helper function to aggregate expenses by day for a given period
const aggregateExpensesByDay = (expenses: Expense[], days: number): DailyExpense[] => {
  const now = new Date();
  const endDate = endOfDay(now);
  const startDate = startOfDay(subDays(now, days - 1)); // Go back `days - 1` to include today

  const dailyTotals: { [key: string]: number } = {};

  // Initialize daily totals for the entire period to ensure all days are shown
  for (let i = 0; i < days; i++) {
    const date = startOfDay(subDays(endDate, i));
    const formattedDate = format(date, 'yyyy-MM-dd'); // Use ISO format for reliable sorting/keying
    dailyTotals[formattedDate] = 0;
  }

  // Filter and aggregate expenses
  expenses.forEach(expense => {
    const expenseDate = safelyParseDate(expense.timestamp);
    if (expenseDate && isWithinInterval(expenseDate, { start: startDate, end: endDate })) {
      const formattedDate = format(startOfDay(expenseDate), 'yyyy-MM-dd');
      dailyTotals[formattedDate] = (dailyTotals[formattedDate] || 0) + expense.price;
    }
  });

  // Convert to array and sort by date ascending
  const aggregatedData = Object.entries(dailyTotals)
    .map(([date, total]) => ({
      date: format(new Date(date + 'T00:00:00'), 'dd MMM', { locale: es }), // Format for display
      total: total,
      _rawDate: date, // Keep raw date for sorting if needed
    }))
    .sort((a, b) => a._rawDate.localeCompare(b._rawDate)); // Sort by raw date

  return aggregatedData;
};


// Chart configuration for styling
const chartConfig = {
  total: {
    label: "Gasto Total",
    color: "hsl(var(--primary))", // Use primary color from theme
  },
} satisfies ChartConfig;


export function ExpenseCharts({ expenses }: ExpenseChartsProps) {
    const [isClient, setIsClient] = useState(false);
    const [chartData7Days, setChartData7Days] = useState<DailyExpense[]>([]);
    const [chartData30Days, setChartData30Days] = useState<DailyExpense[]>([]);
    const [chartData90Days, setChartData90Days] = useState<DailyExpense[]>([]);

    useEffect(() => {
        setIsClient(true);
        // Calculate data only on the client side
        setChartData7Days(aggregateExpensesByDay(expenses, 7));
        setChartData30Days(aggregateExpensesByDay(expenses, 30));
        setChartData90Days(aggregateExpensesByDay(expenses, 90));
    }, [expenses]); // Recalculate when expenses change

    const renderChart = (data: DailyExpense[], period: string) => {
        if (!isClient) {
            return (
                <div className="mt-4 p-4 rounded-md border bg-card space-y-2 min-h-[300px]">
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    <Skeleton className="h-[250px] w-full" />
                </div>
            );
        }

         if (data.length === 0 && expenses.length > 0) {
             return (
                 <div className="mt-4 p-4 rounded-md border bg-card text-center min-h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">No hay gastos en los últimos {period} días.</p>
                 </div>
             );
         }

         if (data.length === 0 && expenses.length === 0) {
             return (
                 <div className="mt-4 p-4 rounded-md border bg-card text-center min-h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">Agrega gastos para ver el gráfico.</p>
                 </div>
             );
         }

        return (
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            // tickFormatter={(value) => format(new Date(value + 'T00:00:00'), 'dd MMM')} // Use display format
                        />
                        <YAxis
                            tickFormatter={(value) => formatCurrency(value)}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            width={80} // Adjust width for currency formatting
                        />
                        <Tooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    formatter={(value) => formatCurrency(value as number)}
                                    indicator="dot"
                                    labelClassName="font-semibold"
                                />
                            }
                        />
                        <Bar dataKey="total" fill="var(--color-total)" radius={4} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
        );
    };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis de Gastos por Día</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="7days" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="7days">Últimos 7 Días</TabsTrigger>
            <TabsTrigger value="30days">Últimos 30 Días</TabsTrigger>
            <TabsTrigger value="90days">Últimos 90 Días</TabsTrigger>
          </TabsList>
          <TabsContent value="7days">
            {renderChart(chartData7Days, "7")}
          </TabsContent>
          <TabsContent value="30days">
            {renderChart(chartData30Days, "30")}
          </TabsContent>
          <TabsContent value="90days">
            {renderChart(chartData90Days, "90")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
