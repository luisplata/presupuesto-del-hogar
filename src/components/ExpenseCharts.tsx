
import React, { useState, useEffect, useMemo } from 'react';
import {
    LineChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip // Import Tooltip directly from recharts
} from 'recharts';
import { format as formatDateFns } from 'date-fns';
// Correct import path for locales
import { es } from 'date-fns/locale/es';


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, safelyParseDate } from '@/lib/dateUtils'; // Corrected import path
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// Corrected import paths for chart components
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"


// Define the type for a single day's product expenses
interface DailyProductExpense {
    date: string;         // Display date
    _rawDate: string;      // Internal date key
    total: number;        // Total expense for the day
    [key: string]: number | string; // Dynamic properties for each product's expense
}

interface ProductWithExpenses extends Product {
    key: string;
    value: number;
    color: string;
}

// Define the type for the data returned by the aggregation function
interface AggregatedExpenses {
    data: DailyProductExpense[];
    productKeys: { [key: string]: string }; // Map of product keys to product names
}


// Use the actual Expense type
import { Product } from '@/types/expense';
import type { Expense } from '@/types/expense';

interface ExpenseChartsProps {
    expenses: Expense[];
    activePeriodTab: string;
    onActivePeriodTabChange: (tabValue: string) => void;
}


// Function to aggregate expenses by day and product (remains largely the same)
const aggregateStackedExpensesByDay = (
  expenses: Expense[],
  days: number
): AggregatedExpenses => {
  const today = new Date();
  const cutoffDate = new Date(today);
  cutoffDate.setDate(today.getDate() - days + 1); // Include the cutoff day itself
  cutoffDate.setHours(0, 0, 0, 0); // Start of the cutoff day

  interface DailyTotalsType {
    [date: string]: { // index signature
      total: number;
      products: { [productKey: string]: number };
    };
  }

  const dailyTotals: DailyTotalsType = {};
  const productKeysMap: { [key: string]: string } = {};
  const allDates = new Set<string>();
  const dateFnsLocale = es; // Default to Spanish locale


  // Initialize daily totals for all dates within the range
  let currentDate = new Date(cutoffDate);
  while (currentDate <= today) {
    const formattedDate = formatDateFns(currentDate, 'yyyy-MM-dd');
    dailyTotals[formattedDate] = { total: 0, products: {} };
    allDates.add(formattedDate); // Add date to the set
    currentDate.setDate(currentDate.getDate() + 1);
  }

  expenses.forEach((expense) => {
    const expenseTimestamp = safelyParseDate(expense.timestamp);
    if (!expenseTimestamp) return; // Skip if date is invalid

    const expenseDate =  new Date(expenseTimestamp);
    expenseDate.setHours(0, 0, 0, 0); // Consider only the date part

        if (expenseDate >= cutoffDate && expenseDate <= today) {
      const formattedDate = formatDateFns(expenseDate, 'yyyy-MM-dd');
      const productKey = expense.product.name; // Use product name as the key

      // Store original product name
      if (!productKeysMap[productKey]) {
        productKeysMap[productKey] = expense.product.name;
      }

      if (!dailyTotals[formattedDate]) {
        dailyTotals[formattedDate] = { total: 0, products: {} };
      }

      dailyTotals[formattedDate].products[productKey] = (dailyTotals[formattedDate].products[productKey] || 0) + expense.price;
      dailyTotals[formattedDate].total += expense.price;
    }
  });

  // Convert to array format required by the chart
  const aggregatedData = Array.from(allDates)
    .map(dateKey => {
      const dayData = dailyTotals[dateKey];
      const displayDate = formatDateFns(new Date(dateKey + 'T00:00:00'), 'dd MMM', { locale: dateFnsLocale });

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
    const completeDayData:DailyProductExpense = { ...dayData };
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
// Add a 'total' entry for the main line/area styling
const generateChartConfig = (productKeysMap: { [key: string]: string }): ChartConfig => {
    const config: ChartConfig = {
        // Style for the total line/area
        total: {
            label: 'Total',
            color: 'hsl(var(--chart-1))', // Use a primary chart color
        },
    };
    const productKeys = Object.keys(productKeysMap);

    productKeys.forEach((key, index) => {
        // Generate HSL colors, trying to space them out more
        const hue = (index * (360 / (productKeys.length + 1))) % 360; // Distribute hues
        const saturation = Math.floor(Math.random() * 21) + 70; // 70-90% saturation
        const lightness = Math.floor(Math.random() * 21) + 55; // 55-75% lightness
        const randomColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

        config[key] = {
            label: productKeysMap[key], // Use original product name for label
            color: randomColor,         // Assign the generated random color
        };
    });

    return config;
};


export function ExpenseCharts({ expenses, activePeriodTab, onActivePeriodTabChange }: ExpenseChartsProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const chartData7Days = useMemo(() => {
        if (!isClient) return { data: [], productKeys: {} };
        return aggregateStackedExpensesByDay(expenses, 7);
    }, [expenses, isClient]);

    const chartData30Days = useMemo(() => {
        if (!isClient) return { data: [], productKeys: {} };
        return aggregateStackedExpensesByDay(expenses, 30);
    }, [expenses, isClient]);

    const chartData90Days = useMemo(() => {
        if (!isClient) return { data: [], productKeys: {} };
        return aggregateStackedExpensesByDay(expenses, 90);
    }, [expenses, isClient]);


    // Custom Tooltip Content Component
    const CustomTooltip = ({ active, payload, label, config, productKeysMap, allExpenses }: { active?: boolean; payload?: any[]; label?: string; config: ChartConfig; productKeysMap: { [key: string]: string }; allExpenses: Expense[]; }) => {
      if (active && payload && payload.length && label) {
            const data = payload[0].payload as DailyProductExpense; 
            const productsWithExpenses:ProductWithExpenses[] = [];

            Object.keys(productKeysMap).forEach((productKey) => {
                const fullProductInfo = allExpenses.find(expense => expense.product.name === productKey)?.product;
                if (fullProductInfo) {
                  const productExpense = data[productKey] as number || 0;
                    productsWithExpenses.push({
                        ...fullProductInfo,
                        key: productKey, 
                        value: productExpense,
                        color: config[productKey]?.color || '#ccc'
                      })
                }
            })

            const filteredProductsWithExpenses = productsWithExpenses.filter(p => p.value > 0).sort((a,b) => b.value - a.value)


            return (
                <div className="rounded-lg border bg-background p-2.5 text-xs sm:text-sm shadow-lg max-w-[250px] sm:max-w-xs">
                    <div className="mb-1.5 font-medium">{label}</div> {/* Date */}
                    <div className="mb-1 border-t pt-1 font-semibold">
                        Total Día: {formatCurrency(data.total)}
                    </div>
                    <div className="grid gap-1">
                        {filteredProductsWithExpenses.map((product) => (
                            <div key={product.key} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 overflow-hidden"> 
                                    <span
                                        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                                        style={{ backgroundColor: product.color }}
                                    />
                                    <span className="text-muted-foreground truncate">{product.name}:</span> 
                                </div>
                                <span className="font-semibold whitespace-nowrap">{formatCurrency(product.value)}</span> 
                            </div>
                        ))}
                         {filteredProductsWithExpenses.length === 0 && (
                             <div className="text-muted-foreground text-xs">Sin gastos registrados para este día.</div>
                         )}
                    </div>
                </div>
            );
        }
        return null;
    };

    const renderChart = (data: DailyProductExpense[], productKeysMap: { [key: string]: string }, periodLabel: string) => {
        const chartConfig = useMemo(() => generateChartConfig(productKeysMap), [productKeysMap]);

        if (!isClient) {
            return (
                 <div className="mt-4 p-4 rounded-md border bg-card space-y-2 min-h-[250px] sm:min-h-[350px]">
                    <Skeleton className="h-5 sm:h-6 w-3/4 mb-4" />
                    <Skeleton className="h-[200px] sm:h-[300px] w-full" />
                </div>
            );
        }

         if (data.length === 0 || data.every(d => d.total === 0)) {
             const message = expenses.length === 0
                 ? 'Agrega gastos para ver el gráfico.'
                 : `No hay gastos en los últimos ${periodLabel} días.`;
             return (
                 <div className="mt-4 p-4 rounded-md border bg-card text-center min-h-[250px] sm:min-h-[350px] flex items-center justify-center">
                    <p className="text-muted-foreground text-sm sm:text-base">{message}</p>
                 </div>
             );
         }

         return (
             <ChartContainer config={chartConfig} className="min-h-[250px] sm:min-h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height={isClient ? window.innerWidth < 640 ? 250 : 350 : 350}>
                     <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                         <CartesianGrid vertical={false} strokeDasharray="3 3" />
                         <XAxis
                             dataKey="date"
                             tickLine={false}
                             axisLine={false}
                             tickMargin={8}
                             fontSize={10} 
                         />
                         <YAxis
                             tickFormatter={(value) => formatCurrency(value)}
                             tickLine={false}
                             axisLine={false}
                             tickMargin={8}
                             width={60} 
                             fontSize={10} 
                         />
                         <Tooltip
                             cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.3 }} 
                             content={({ active, payload, label }) => (
                                 <CustomTooltip
                                     active={active}
                                     payload={payload}
                                     label={label}
                                     config={chartConfig} 
                                     productKeysMap={productKeysMap} 
                                     allExpenses={expenses} />
                             )}
                         />
                         <Area
                             type="linear"
                             dataKey="total"
                             stroke="none"
                             fill="var(--color-total)" 
                             fillOpacity={0.4}
                         />
                         <Line
                             type="linear"
                             dataKey="total"
                             stroke="var(--color-total)" 
                             strokeWidth={2}
                             dot={false}
                             activeDot={{ 
                                 r: 4, 
                                 fill: 'var(--color-total)',
                                 stroke: 'hsl(var(--background))',
                                 strokeWidth: 2,
                             }} 
                         />
                     </LineChart>
                 </ResponsiveContainer>
             </ChartContainer>
        );
    };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Análisis de Gastos Totales por Día</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activePeriodTab} onValueChange={onActivePeriodTabChange} className="w-full">
           <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="7days">7 Días</TabsTrigger>
            <TabsTrigger value="30days">30 Días</TabsTrigger>
            <TabsTrigger value="90days">90 Días</TabsTrigger>
           </TabsList>
          <TabsContent value="7days">
            {renderChart(chartData7Days.data, chartData7Days.productKeys, "7")}
          </TabsContent>
          <TabsContent value="30days">
            {renderChart(chartData30Days.data, chartData30Days.productKeys, "30")}
          </TabsContent>
          <TabsContent value="90days">
            {renderChart(chartData90Days.data, chartData90Days.productKeys, "90")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

    