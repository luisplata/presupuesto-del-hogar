
// src/components/CategoryCharts.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from '@/lib/dateUtils';
import type { Expense } from '@/types/expense';

interface CategoryChartData {
  name: string;
  value: number;
  percentage?: number;
  fill: string;
}

interface CategoryChartsProps {
  expenses: Expense[];
  defaultCategoryKey: string;
}

// Function to generate distinct HSL colors
const generateCategoryColors = (count: number): string[] => {
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const hue = (i * (360 / count)) % 360;
    colors.push(`hsl(${hue}, 70%, 60%)`); // Adjust saturation and lightness as needed
  }
  return colors;
};

const aggregateExpensesByCategory = (expenses: Expense[], defaultCategoryKey: string): Map<string, number> => {
  const categoryTotals = new Map<string, number>();
  expenses.forEach(expense => {
    const category = expense.category || defaultCategoryKey;
    categoryTotals.set(category, (categoryTotals.get(category) || 0) + expense.price);
  });
  return categoryTotals;
};

export function CategoryCharts({ expenses, defaultCategoryKey }: CategoryChartsProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const categoryData = useMemo(() => {
    if (!isClient) return { pieData: [], barData: [], chartConfig: {} };

    const aggregated = aggregateExpensesByCategory(expenses, defaultCategoryKey);
    if (aggregated.size === 0) return { pieData: [], barData: [], chartConfig: {} };
    
    const totalExpenses = Array.from(aggregated.values()).reduce((sum, val) => sum + val, 0);
    const colors = generateCategoryColors(aggregated.size);
    const config: ChartConfig = {};

    let colorIndex = 0;
    const pieChartData: CategoryChartData[] = [];
    const barChartData: { name: string, total: number, fill: string }[] = [];

    aggregated.forEach((value, name) => {
      const color = colors[colorIndex % colors.length];
      config[name] = { label: name, color: color };
      
      pieChartData.push({
        name,
        value,
        percentage: totalExpenses > 0 ? (value / totalExpenses) * 100 : 0,
        fill: color,
      });
      barChartData.push({ name, total: value, fill: color });
      colorIndex++;
    });
    
    // Sort by value for better readability in charts
    pieChartData.sort((a, b) => b.value - a.value);
    barChartData.sort((a, b) => b.total - a.total);


    return { pieData: pieChartData, barData: barChartData, chartConfig: config };
  }, [expenses, defaultCategoryKey, isClient]);

  const { pieData, barData, chartConfig } = categoryData;

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-2.5 text-xs shadow-lg">
          <p className="font-medium">{`${data.name}`}</p>
          <p>{`Total: ${formatCurrency(data.value)}`}</p>
          <p>{`Porcentaje: ${data.percentage?.toFixed(1)}%`}</p>
        </div>
      );
    }
    return null;
  };
  
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2.5 text-xs shadow-lg">
          <p className="font-medium">{label}</p>
          <p>{`Total: ${formatCurrency(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
  };


  if (!isClient) {
    return (
      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader><CardTitle><Skeleton className="h-6 w-3/4" /></CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center min-h-[250px] sm:min-h-[350px]">
            <Skeleton className="h-full w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle><Skeleton className="h-6 w-3/4" /></CardTitle></CardHeader>
          <CardContent className="min-h-[250px] sm:min-h-[350px]">
            <Skeleton className="h-full w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (expenses.length === 0 || pieData.length === 0) {
     return (
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
         <Card>
           <CardHeader><CardTitle className="text-lg sm:text-xl">Gastos por Categoría (Pastel)</CardTitle></CardHeader>
           <CardContent className="flex items-center justify-center min-h-[250px] sm:min-h-[350px]">
             <p className="text-muted-foreground">No hay datos de categorías para mostrar.</p>
           </CardContent>
         </Card>
          <Card>
           <CardHeader><CardTitle className="text-lg sm:text-xl">Gastos por Categoría (Barras)</CardTitle></CardHeader>
           <CardContent className="flex items-center justify-center min-h-[250px] sm:min-h-[350px]">
             <p className="text-muted-foreground">No hay datos de categorías para mostrar.</p>
           </CardContent>
         </Card>
       </div>
     );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4 md:gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Gastos por Categoría (Pastel)</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[250px] sm:min-h-[350px] flex items-center justify-center">
          <ChartContainer config={chartConfig} className="w-full h-full max-h-[300px] sm:max-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <RechartsTooltip content={<CustomPieTooltip />} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{paddingTop: '10px'}} iconSize={10} />
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius="80%"
                  dataKey="value"
                  nameKey="name"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Gastos por Categoría (Barras)</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[250px] sm:min-h-[350px]">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height={isClient ? (window.innerWidth < 640 ? 250 : 350) : 350}>
              <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} fontSize={10} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, width: 75, textAnchor: 'end' }} interval={0} />
                <RechartsTooltip content={<CustomBarTooltip />} cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.3 }}/>
                <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
