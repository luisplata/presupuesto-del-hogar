// components/ExpenseCharts.tsx
'use client'; // Ensure this component runs on the client for Recharts

import { useMemo, useState, useEffect } from 'react';
import type { Expense } from '@/types/expense';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency, safelyParseDate } from '@/lib/dateUtils'; // Import utility functions
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"; // Import shadcn chart components
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea for legend

interface ExpenseChartsProps {
  expenses: Expense[];
}

// Interface for aggregated daily expenses with product breakdown
interface DailyProductExpense {
  date: string; // Format: 'dd MMM' for display
  _rawDate: string; // Format: 'yyyy-MM-dd' for sorting
  total: number; // Total for the day
  [productKey: string]: number | string; // Product name as key, price as value. Also includes date strings.
}

// Helper to sanitize product names for use as data keys
const sanitizeProductKey = (name: string): string => {
  // Replace spaces and special characters, ensure it starts with a letter
  return `prod_${name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[^a-zA-Z_]+/, '')}`;
};

// Helper to aggregate expenses by day with product breakdown
const aggregateStackedExpensesByDay = (expenses: Expense[], days: number): { data: DailyProductExpense[], productKeys: { [key: string]: string } } => {
  const now = new Date();
  const endDate = endOfDay(now);
  const startDate = startOfDay(subDays(now, days - 1)); // Go back `days - 1` to include today

  const dailyTotals: { [dateKey: string]: { total: number, products: { [productKey: string]: number } } } = {};
  const productKeysMap: { [key: string]: string } = {}; // Map sanitized key back to original name
  const allDates = new Set<string>();

  // Initialize daily totals for the entire period to ensure all days are shown
  for (let i = 0; i < days; i++) {
    const date = startOfDay(subDays(endDate, i));
    const formattedDate = format(date, 'yyyy-MM-dd');
    allDates.add(formattedDate);
    dailyTotals[formattedDate] = { total: 0, products: {} };
  }

  // Filter and aggregate expenses
  expenses.forEach(expense => {
    const expenseDate = safelyParseDate(expense.timestamp);
    if (expenseDate && isWithinInterval(expenseDate, { start: startDate, end: endDate })) {
      const formattedDate = format(startOfDay(expenseDate), 'yyyy-MM-dd');
      const productKey = sanitizeProductKey(expense.product);

      if (!productKeysMap[productKey]) {
        productKeysMap[productKey] = expense.product; // Store original name
      }

      if (!dailyTotals[formattedDate]) {
        // Should not happen due to pre-initialization, but safeguard
        dailyTotals[formattedDate] = { total: 0, products: {} };
      }

      dailyTotals[formattedDate].products[productKey] = (dailyTotals[formattedDate].products[productKey] || 0) + expense.price;
      dailyTotals[formattedDate].total += expense.price;
      allDates.add(formattedDate); // Ensure date is tracked
    }
  });

  // Convert to array format required by the chart
  const aggregatedData = Array.from(allDates)
    .map(dateKey => {
      const dayData = dailyTotals[dateKey];
      const displayDate = format(new Date(dateKey + 'T00:00:00'), 'dd MMM', { locale: es }); // Format for display

      const productEntries = dayData ? dayData.products : {};
      const totalEntry = dayData ? dayData.total : 0;

      return {
        date: displayDate,
        _rawDate: dateKey,
        total: totalEntry,
        ...productEntries,
      };
    })
    .sort((a, b) => a._rawDate.localeCompare(b._rawDate)); // Sort by raw date ascending

  // Ensure all product keys exist in every data point (with value 0 if absent)
  const finalData = aggregatedData.map(dayData => {
    const completeDayData = { ...dayData };
    Object.keys(productKeysMap).forEach(productKey => {
      if (!(productKey in completeDayData)) {
        completeDayData[productKey] = 0;
      }
    });
    return completeDayData;
  });


  return { data: finalData, productKeys: productKeysMap };
};

// Function to generate chart config dynamically based on products
const generateChartConfig = (productKeysMap: { [key: string]: string }): ChartConfig => {
    const config: ChartConfig = {};
    const productKeys = Object.keys(productKeysMap);
    const numColors = 5; // Number of predefined chart colors (--chart-1 to --chart-5)

    productKeys.forEach((key, index) => {
        const colorVar = `hsl(var(--chart-${(index % numColors) + 1}))`; // Cycle through chart colors
        config[key] = {
            label: productKeysMap[key], // Use original product name for label
            color: colorVar,
        };
    });

    return config;
};


export function ExpenseCharts({ expenses }: ExpenseChartsProps) {
    const [isClient, setIsClient] = useState(false);

    // State for chart data and product keys for each period
    const [chartData7Days, setChartData7Days] = useState<DailyProductExpense[]>([]);
    const [productKeys7Days, setProductKeys7Days] = useState<{ [key: string]: string }>({});
    const [chartData30Days, setChartData30Days] = useState<DailyProductExpense[]>([]);
    const [productKeys30Days, setProductKeys30Days] = useState<{ [key: string]: string }>({});
    const [chartData90Days, setChartData90Days] = useState<DailyProductExpense[]>([]);
    const [productKeys90Days, setProductKeys90Days] = useState<{ [key: string]: string }>({});


    useEffect(() => {
        setIsClient(true);
        // Calculate data only on the client side
        const data7 = aggregateStackedExpensesByDay(expenses, 7);
        setChartData7Days(data7.data);
        setProductKeys7Days(data7.productKeys);

        const data30 = aggregateStackedExpensesByDay(expenses, 30);
        setChartData30Days(data30.data);
        setProductKeys30Days(data30.productKeys);

        const data90 = aggregateStackedExpensesByDay(expenses, 90);
        setChartData90Days(data90.data);
        setProductKeys90Days(data90.productKeys);

    }, [expenses]); // Recalculate when expenses change

    const renderChart = (data: DailyProductExpense[], productKeysMap: { [key: string]: string }, period: string) => {
        const productKeys = Object.keys(productKeysMap);
        const chartConfig = useMemo(() => generateChartConfig(productKeysMap), [productKeysMap]);


        if (!isClient) {
            return (
                <div className="mt-4 p-4 rounded-md border bg-card space-y-2 min-h-[350px]">
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    <Skeleton className="h-[300px] w-full" />
                </div>
            );
        }

         if (data.length === 0 || data.every(d => d.total === 0)) {
             const message = expenses.length === 0
                 ? "Agrega gastos para ver el gráfico."
                 : `No hay gastos en los últimos ${period} días.`;
             return (
                 <div className="mt-4 p-4 rounded-md border bg-card text-center min-h-[350px] flex items-center justify-center">
                    <p className="text-muted-foreground">{message}</p>
                 </div>
             );
         }

        return (
            <ChartContainer config={chartConfig} className="min-h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 40 }}> {/* Increased bottom margin for legend */}
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
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
                                    formatter={(value, name) => `${productKeysMap[name] || name}: ${formatCurrency(value as number)}`}
                                    indicator="dot"
                                    labelClassName="font-semibold"
                                    // Hide the total from the default tooltip items if showing breakdown
                                    filter={(item) => item.dataKey !== 'total'}
                                    // Custom label formatter to show the date and total for the day
                                    labelFormatter={(label, payload) => {
                                        // Find the data point for the current label (date)
                                        const currentData = payload && payload.length > 0 ? payload[0].payload : null;
                                        const dailyTotal = currentData ? currentData.total : 0;
                                        return (
                                             <>
                                                <div className="font-semibold">{label}</div>
                                                <div className="text-muted-foreground">Total: {formatCurrency(dailyTotal)}</div>
                                            </>
                                        );
                                    }}
                                />
                            }
                        />
                         <Legend content={
                            <ChartLegendContent
                                nameKey="name" // Corresponds to the key in chartConfig
                                className="flex-wrap justify-center" // Allow legend items to wrap
                                style={{
                                     maxHeight: '60px', // Limit legend height
                                     overflowY: 'auto', // Make legend scrollable if needed
                                     paddingBottom: '10px' // Add some padding below legend
                                }}
                             />
                         } verticalAlign="bottom" wrapperStyle={{ bottom: 0, left: 0, right: 0, position: 'absolute' }}/>

                        {productKeys.map((productKey) => (
                            <Bar
                                key={productKey}
                                dataKey={productKey}
                                stackId="a" // All product bars belong to the same stack
                                fill={`var(--color-${productKey})`} // Use color from generated config
                                radius={[4, 4, 0, 0]} // Apply radius to the top of the bars
                                name={productKey} // Use sanitized key for internal reference
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
        );
    };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis de Gastos por Día y Producto</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="7days" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="7days">Últimos 7 Días</TabsTrigger>
            <TabsTrigger value="30days">Últimos 30 Días</TabsTrigger>
            <TabsTrigger value="90days">Últimos 90 Días</TabsTrigger>
          </TabsList>
          <TabsContent value="7days">
            {renderChart(chartData7Days, productKeys7Days, "7")}
          </TabsContent>
          <TabsContent value="30days">
            {renderChart(chartData30Days, productKeys30Days, "30")}
          </TabsContent>
          <TabsContent value="90days">
            {renderChart(chartData90Days, productKeys90Days, "90")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
