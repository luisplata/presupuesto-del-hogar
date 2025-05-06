
// components/ExpenseSummary.tsx

import type { Expense } from '@/types/expense';
import { useState, useEffect } from 'react'; // Import useState and useEffect
import { filterExpensesByPeriod, calculateTotal, formatCurrency } from '@/lib/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton


interface ExpenseSummaryProps {
  expenses: Expense[];
}

export function ExpenseSummary({ expenses }: ExpenseSummaryProps) {
  const [isClient, setIsClient] = useState(false); // State to track client-side mount

  // Calculated values - initialize with defaults or null
  const [weeklyTotal, setWeeklyTotal] = useState<number | null>(null);
  const [biWeeklyTotal, setBiWeeklyTotal] = useState<number | null>(null);
  const [monthlyTotal, setMonthlyTotal] = useState<number | null>(null);
  const [weeklyCount, setWeeklyCount] = useState<number>(0);
  const [biWeeklyCount, setBiWeeklyCount] = useState<number>(0);
  const [monthlyCount, setMonthlyCount] = useState<number>(0);


  useEffect(() => {
    // This effect runs only on the client, after the component mounts
    setIsClient(true);

    // Perform calculations after mount
    const weeklyExpenses = filterExpensesByPeriod(expenses, 'week');
    const biWeeklyExpenses = filterExpensesByPeriod(expenses, 'bi-weekly');
    const monthlyExpenses = filterExpensesByPeriod(expenses, 'month');

    setWeeklyTotal(calculateTotal(weeklyExpenses));
    setBiWeeklyTotal(calculateTotal(biWeeklyExpenses));
    setMonthlyTotal(calculateTotal(monthlyExpenses));

    setWeeklyCount(weeklyExpenses.length);
    setBiWeeklyCount(biWeeklyExpenses.length);
    setMonthlyCount(monthlyExpenses.length);

  }, [expenses]); // Recalculate when expenses change

  // Render loading state or actual content based on isClient and total calculation
  const renderContent = (period: 'week' | 'bi-weekly' | 'month') => {
      let total: number | null;
      let count: number;
      let titleText: string;
      let periodNameText: string;


      switch (period) {
          case 'week':
              total = weeklyTotal;
              count = weeklyCount;
              titleText = 'Total Gastado esta Semana';
              periodNameText = 'semana';
              break;
          case 'bi-weekly':
              total = biWeeklyTotal;
              count = biWeeklyCount;
              titleText = 'Total Gastado esta Quincena';
              periodNameText = 'quincena';
              break;
          case 'month':
              total = monthlyTotal;
              count = monthlyCount;
              titleText = 'Total Gastado este Mes';
              periodNameText = 'mes';
              break;
      }

       // Show skeleton if not client or total is still null (calculating)
       if (!isClient || total === null) {
          return (
                <div className="mt-4 p-3 sm:p-4 rounded-md border bg-card space-y-2"> {/* Adjusted padding */}
                    <Skeleton className="h-5 sm:h-6 w-3/4" />
                    <Skeleton className="h-7 sm:h-8 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                </div>
          )
       }

       // Render actual content once loaded
       return (
            <div className="mt-4 p-3 sm:p-4 rounded-md border bg-card"> {/* Adjusted padding */}
                <h3 className="text-base sm:text-lg font-semibold">{titleText}</h3> {/* Adjusted text size */}
                <p className="text-xl sm:text-2xl font-bold text-primary">{formatCurrency(total)}</p> {/* Adjusted text size */}
                <p className="text-xs sm:text-sm text-muted-foreground">{count} gasto(s) esta {periodNameText}.</p> {/* Adjusted text size */}
            </div>
       );
  }


  return (
    <Card>
        {/* Adjust CardHeader padding and title size */}
        <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
          <CardTitle className="text-lg sm:text-xl">{isClient ? 'Resumen de Gastos' : <Skeleton className="h-6 w-1/2" />}</CardTitle>
        </CardHeader>
         {/* Adjust CardContent padding */}
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
             <Tabs defaultValue="week" className="w-full">
                {/* Ensure TabsList adapts or scrolls on very small screens if needed */}
                <TabsList className="grid w-full grid-cols-3 h-auto text-xs sm:text-sm"> {/* Adjusted height and text size */}
                    {isClient ? (
                        <>
                            <TabsTrigger value="week" className="py-1.5 sm:py-2">Semana</TabsTrigger> {/* Adjusted padding */}
                            <TabsTrigger value="bi-weekly" className="py-1.5 sm:py-2">Quincena</TabsTrigger> {/* Adjusted padding */}
                            <TabsTrigger value="month" className="py-1.5 sm:py-2">Mes</TabsTrigger> {/* Adjusted padding */}
                        </>
                     ) : (
                         <>
                             <Skeleton className="h-9 w-full" />
                             <Skeleton className="h-9 w-full" />
                             <Skeleton className="h-9 w-full" />
                         </>
                     )}
                </TabsList>
                <TabsContent value="week">
                   {renderContent('week')}
                </TabsContent>
                 <TabsContent value="bi-weekly">
                    {renderContent('bi-weekly')}
                </TabsContent>
                <TabsContent value="month">
                    {renderContent('month')}
                </TabsContent>
            </Tabs>
        </CardContent>
    </Card>
  );
}

    