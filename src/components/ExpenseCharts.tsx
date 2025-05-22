
import React, { useState, useEffect, useMemo } from 'react';
import {
    LineChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip
} from 'recharts';
import { format as formatDateFns, startOfDay as dateFnsStartOfDay, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale/es';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, safelyParseDate } from '@/lib/dateUtils';
import { Skeleton } from "@/components/ui/skeleton"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import type { Expense, Product } from '@/types/expense';

interface DailyProductExpense {
    date: string;         // Display date (e.g., "dd MMM")
    _rawDate: Date;     // Full date object for sorting/comparison
    total: number;        // Total expense for the day
    [key: string]: number | string | Date; // Dynamic properties for each product's expense
}

interface ProductWithExpenses extends Product {
    key: string;
    value: number; // Expense value for this product on this day
    color: string; // Color for this product in the chart/tooltip
}

interface AggregatedExpensesOutput {
    data: DailyProductExpense[];
    productKeysMap: { [key: string]: string }; // Maps product key (e.g., name) to display name
    chartConfig: ChartConfig;
}

interface ExpenseChartsProps {
    expenses: Expense[]; // These are already filtered by global filters (product, category, date range)
    startDate: Date | null; // Start of the global filter period
    endDate: Date | null;   // End of the global filter period
}

const aggregateAndProcessExpenses = (
    filteredExpenses: Expense[],
    filterStartDate: Date | null,
    filterEndDate: Date | null
): AggregatedExpensesOutput => {
    const productKeysMap: { [key: string]: string } = {};
    const dailyDataMap = new Map<string, DailyProductExpense>();

    // Determine the actual start and end dates for iteration
    // Fallback to a default range (e.g., last 7 days) if dates are null, though parent should provide valid ones.
    const today = new Date();
    const actualStartDate = filterStartDate ? dateFnsStartOfDay(filterStartDate) : dateFnsStartOfDay(new Date(today.setDate(today.getDate() - 6)));
    const actualEndDate = filterEndDate ? dateFnsStartOfDay(filterEndDate) : dateFnsStartOfDay(new Date());

    // Initialize data points for each day in the interval
    if (actualStartDate && actualEndDate && actualStartDate <= actualEndDate) {
        const daysInInterval = eachDayOfInterval({ start: actualStartDate, end: actualEndDate });
        daysInInterval.forEach(day => {
            const displayDate = formatDateFns(day, 'dd MMM', { locale: es });
            const rawDateKey = day; // Use the Date object as key for map initially
            dailyDataMap.set(formatDateFns(day, 'yyyy-MM-dd'), {
                date: displayDate,
                _rawDate: rawDateKey,
                total: 0,
            });
        });
    }


    filteredExpenses.forEach((expense) => {
        const expenseTimestamp = safelyParseDate(expense.timestamp);
        if (!expenseTimestamp) return;

        const expenseDayStart = dateFnsStartOfDay(expenseTimestamp);
        const dateKey = formatDateFns(expenseDayStart, 'yyyy-MM-dd');
        
        let dayEntry = dailyDataMap.get(dateKey);

        if (dayEntry) { // Only process if the expense falls within the initialized range
            const productKey = expense.product.name;
            if (!productKeysMap[productKey]) {
                productKeysMap[productKey] = expense.product.name;
            }

            dayEntry.total += expense.price;
            dayEntry[productKey] = (dayEntry[productKey] as number || 0) + expense.price;
        }
    });

    const aggregatedData: DailyProductExpense[] = Array.from(dailyDataMap.values())
                                                     .sort((a, b) => (a._rawDate as Date).getTime() - (b._rawDate as Date).getTime());
    
    // Ensure all product keys exist in every data point
     const finalData = aggregatedData.map(dayData => {
        const completeDayData:DailyProductExpense = { ...dayData };
        Object.keys(productKeysMap).forEach(productKey => {
            if (!(productKey in completeDayData)) {
                completeDayData[productKey] = 0; // Default to 0 if no expense for this product on this day
            }
        });
        return completeDayData;
    });


    // Generate chart config
    const chartConfig: ChartConfig = {
        total: { label: 'Total', color: 'hsl(var(--chart-1))' },
    };
    Object.keys(productKeysMap).forEach((key, index) => {
        const hue = (index * (360 / (Object.keys(productKeysMap).length + 2))) % 360; // +2 to avoid clash with total
        const saturation = Math.floor(Math.random() * 21) + 70;
        const lightness = Math.floor(Math.random() * 21) + 55;
        chartConfig[key] = {
            label: productKeysMap[key],
            color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        };
    });
    
    return { data: finalData, productKeysMap, chartConfig };
};


export function ExpenseCharts({ expenses: filteredExpenses, startDate, endDate }: ExpenseChartsProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const { data, productKeysMap, chartConfig } = useMemo(() => {
        if (!isClient) return { data: [], productKeysMap: {}, chartConfig: {} };
        return aggregateAndProcessExpenses(filteredExpenses, startDate, endDate);
    }, [filteredExpenses, startDate, endDate, isClient]);


    const CustomTooltip = ({ active, payload, label, allExpensesFlat }: { active?: boolean; payload?: any[]; label?: string; allExpensesFlat: Expense[] }) => {
      if (active && payload && payload.length && label) {
            const dayData = payload[0].payload as DailyProductExpense;
            const productsWithExpenses: ProductWithExpenses[] = [];

            Object.keys(productKeysMap).forEach((productKey) => {
                 // Find the original product object to get its full details if needed (e.g., color from chartConfig)
                const productInfoFromConfig = chartConfig[productKey];
                const productExpenseOnDay = dayData[productKey] as number || 0;

                if (productInfoFromConfig && productExpenseOnDay > 0) {
                    productsWithExpenses.push({
                        name: productKeysMap[productKey], // Original name
                        value: productExpenseOnDay,    // Expense for this product on this day
                        color: productInfoFromConfig.color || '#ccc', // Color from config
                        key: productKey, // Internal key
                    });
                }
            });
            
            productsWithExpenses.sort((a, b) => b.value - a.value);


            return (
                <div className="rounded-lg border bg-background p-2.5 text-xs sm:text-sm shadow-lg max-w-[250px] sm:max-w-xs">
                    <div className="mb-1.5 font-medium">{label}</div> {/* Date (e.g., "05 May") */}
                    <div className="mb-1 border-t pt-1 font-semibold">
                        Total Día: {formatCurrency(dayData.total)}
                    </div>
                    <div className="grid gap-1">
                        {productsWithExpenses.map((product) => (
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
                         {productsWithExpenses.length === 0 && dayData.total === 0 && (
                             <div className="text-muted-foreground text-xs">Sin gastos registrados para este día.</div>
                         )}
                    </div>
                </div>
            );
        }
        return null;
    };

    if (!isClient) {
        return (
            <Card>
                <CardHeader><CardTitle><Skeleton className="h-6 w-3/4" /></CardTitle></CardHeader>
                <CardContent className="min-h-[250px] sm:min-h-[350px] flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                </CardContent>
            </Card>
        );
    }
    
    if (data.length === 0 || data.every(d => d.total === 0)) {
         const message = filteredExpenses.length === 0 && !startDate && !endDate
             ? 'Aplica filtros o agrega gastos para ver el gráfico.'
             : 'No hay gastos para el período o filtros seleccionados.';
         return (
            <Card>
                <CardHeader><CardTitle className="text-lg sm:text-xl">Análisis de Gastos Totales por Día</CardTitle></CardHeader>
                <CardContent className="min-h-[250px] sm:min-h-[350px] flex items-center justify-center">
                    <p className="text-muted-foreground text-sm sm:text-base">{message}</p>
                </CardContent>
            </Card>
         );
     }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Análisis de Gastos Totales por Día</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[250px] sm:min-h-[350px] w-full">
            <ResponsiveContainer width="100%" height={isClient ? (window.innerWidth < 640 ? 250 : 350) : 350}>
                 <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                     <CartesianGrid vertical={false} strokeDasharray="3 3" />
                     <XAxis
                         dataKey="date" // Display date like "05 May"
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
                                 allExpensesFlat={filteredExpenses} // Pass all original expenses for full product info if needed
                                 />
                         )}
                     />
                     <Area
                         type="linear"
                         dataKey="total"
                         stroke="none"
                         fill="var(--color-total)"
                         fillOpacity={0.4}
                         name="Total" // For default tooltip if CustomTooltip is not used
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
                         name="Total"
                     />
                 </LineChart>
             </ResponsiveContainer>
         </ChartContainer>
      </CardContent>
    </Card>
  );
}
