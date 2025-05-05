
import React, { useState, useEffect, useMemo } from 'react';
import {
    LineChart, // Changed from BarChart
    Line,      // Added Line
    Area,      // Added Area
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
} from 'recharts';
import { format, es } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from '@/lib/dateUtils'; // Corrected import path
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// Corrected import paths for chart components
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart" // Removed ChartLegend, ChartLegendContent imports

// Define the type for a single day's product expenses
interface DailyProductExpense {
    date: string;         // Display date
    _rawDate: string;      // Internal date key
    total: number;        // Total expense for the day
    [productKey: string]: number | string; // Dynamic properties for each product's expense
}

// Define the type for the data returned by the aggregation function
interface AggregatedExpenses {
    data: DailyProductExpense[];
    productKeys: { [key: string]: string }; // Map of product keys to product names
}

// ChartConfig type is now exported from @/components/ui/chart

// Use the actual Expense type
import type { Expense } from '@/types/expense';

interface ExpenseChartsProps {
    expenses: Expense[];
}


// Function to aggregate expenses by day and product
const aggregateStackedExpensesByDay = (
  expenses: Expense[],
  days: number
): AggregatedExpenses => {
  const today = new Date();
  const cutoffDate = new Date(today);
  cutoffDate.setDate(today.getDate() - days + 1); // Include the cutoff day itself
  cutoffDate.setHours(0, 0, 0, 0); // Start of the cutoff day

  const dailyTotals: {
    [date: string]: {
      total: number;
      products: { [productKey: string]: number };
    };
  } = {};
  const productKeysMap: { [key: string]: string } = {}; // Store original product names
  const allDates = new Set<string>();

  // Initialize daily totals for all dates within the range
  let currentDate = new Date(cutoffDate);
  while (currentDate <= today) {
    const formattedDate = format(currentDate, 'yyyy-MM-dd');
    dailyTotals[formattedDate] = { total: 0, products: {} };
    allDates.add(formattedDate); // Add date to the set
    currentDate.setDate(currentDate.getDate() + 1);
  }

  expenses.forEach((expense) => {
    // Safely parse the timestamp
    const expenseDate = expense.timestamp instanceof Date ? expense.timestamp : new Date(expense.timestamp);
    expenseDate.setHours(0, 0, 0, 0); // Consider only the date part

    if (expenseDate >= cutoffDate && expenseDate <= today) {
      const formattedDate = format(expenseDate, 'yyyy-MM-dd');
      const productKey = expense.product; // Use product name as the key

      // Store original product name
      if (!productKeysMap[productKey]) {
        productKeysMap[productKey] = expense.product;
      }

      if (!dailyTotals[formattedDate]) {
        // Should not happen due to pre-initialization, but safeguard
        dailyTotals[formattedDate] = { total: 0, products: {} };
      }

      dailyTotals[formattedDate].products[productKey] = (dailyTotals[formattedDate].products[productKey] || 0) + expense.price;
      dailyTotals[formattedDate].total += expense.price;
      // allDates.add(formattedDate); // Date is already added during initialization
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

// Function to generate chart config dynamically with random colors
const generateChartConfig = (productKeysMap: { [key: string]: string }): ChartConfig => {
    const config: ChartConfig = {};
    const productKeys = Object.keys(productKeysMap);

    productKeys.forEach((key) => {
        // Generate random HSL values for better visual distinction
        const hue = Math.floor(Math.random() * 360);
        // Keep saturation and lightness in ranges that provide decent visibility
        const saturation = Math.floor(Math.random() * 41) + 50; // 50-90% saturation
        const lightness = Math.floor(Math.random() * 31) + 50; // 50-80% lightness (further from black)
        const randomColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

        config[key] = {
            label: productKeysMap[key], // Use original product name for label
            color: randomColor,         // Assign the generated random color
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
        // Memoize chartConfig generation. Colors will be random but stable unless productKeysMap changes.
        const chartConfig = useMemo(() => generateChartConfig(productKeysMap), [productKeysMap]);
        const productKeys = Object.keys(productKeysMap); // Get keys after config generation


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
                    {/* Changed BarChart to LineChart */}
                    <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
                         <ChartTooltip
                            cursor={true} // Show cursor line on hover for line chart
                            content={
                                <ChartTooltipContent
                                    // Use nameKey to correctly map data keys to config labels
                                    nameKey="name" // Ensure this maps to the product key in config
                                    // Format each item in the tooltip (product: price)
                                    formatter={(value, name, item) => {
                                        // 'name' is the product key from the config
                                        // 'item.name' is the original data key (product name) used in <Bar>
                                        const originalName = item.name; // Get original name from Bar's name prop
                                        return (
                                            <div className="flex justify-between items-center w-full">
                                                {/* Use item.color for the dot indicator */}
                                                <span className="flex items-center mr-2">
                                                    <span
                                                        className="w-2.5 h-2.5 rounded-full mr-1.5"
                                                        style={{ backgroundColor: item.color }}
                                                     />
                                                    {originalName}:
                                                </span>
                                                <span className="ml-2 font-semibold">{formatCurrency(value as number)}</span>
                                            </div>
                                        );
                                    }}
                                    // Custom label formatter to show the date and total for the day
                                    labelFormatter={(label, payload) => {
                                        // Find the data point for the current label (date)
                                        const currentData = payload && payload.length > 0 ? payload[0].payload : null;
                                        const dailyTotal = currentData ? currentData.total : 0;
                                        return (
                                            <>
                                                <div className="font-semibold mb-1">{label}</div>
                                                <div className="text-muted-foreground border-t pt-1 mt-1">Total Día: {formatCurrency(dailyTotal)}</div>
                                            </>
                                        );
                                    }}
                                    // Filter out internal keys and items with value 0
                                    filter={(item) => item.dataKey !== 'total' && item.dataKey !== '_rawDate' && Number(item.value) > 0}
                                    itemStyle={{ width: '100%' }} // Ensure items take full width
                                    indicator="dot" // Use dot indicator within formatter now
                                    hideIndicator={true} // Hide default indicator as we format it ourselves
                                    labelClassName="font-semibold"
                                    className="min-w-[150px]" // Adjust tooltip width if needed
                                />
                            }
                         />

                        {/* Changed Bar to Line and Area components */}
                        {productKeys.map((productKey) => (
                             <React.Fragment key={productKey}>
                                <Area // Area component for stacking
                                    type="monotone"
                                    dataKey={productKey}
                                    stackId="a" // Stack areas together
                                    stroke="none" // Area doesn't need a visible stroke itself
                                    fill={`var(--color-${productKey})`} // Fill with product color
                                    fillOpacity={0.6} // Make fill slightly transparent
                                    name={productKeysMap[productKey]} // Name for tooltip
                                 />
                                <Line // Line component for the visual line edge
                                     type="monotone"
                                     dataKey={productKey}
                                     stroke={`var(--color-${productKey})`} // Use product color for line
                                     strokeWidth={2}
                                     dot={false} // Hide dots on the line itself, tooltip shows info
                                     stackId="a" // Associate with the same stack (important for correct line position)
                                     name={productKeysMap[productKey]} // Name for tooltip
                                 />
                            </React.Fragment>
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </ChartContainer>
        );
    };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis de Gastos por Día y Producto (Gráfico de Área Apilada)</CardTitle>
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
