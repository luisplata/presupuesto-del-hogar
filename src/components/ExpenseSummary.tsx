
// components/ExpenseSummary.tsx

import type { Expense } from '@/types/expense';
import { useState, useEffect } from 'react'; // Import useState and useEffect
import { filterExpensesByPeriod, calculateTotal, formatCurrency } from '@/lib/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { useLocale } from '@/hooks/useLocale'; // Import useLocale

interface ExpenseSummaryProps {
  expenses: Expense[];
}

export function ExpenseSummary({ expenses }: ExpenseSummaryProps) {
  const { t, isLoaded } = useLocale(); // Use the hook, get isLoaded state
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

  // Render loading state or actual content based on isClient and isLoaded
  const renderContent = (period: 'week' | 'bi-weekly' | 'month') => {
      let total: number | null;
      let count: number;
      let titleKey: string;
      let periodNameKey: string;


      switch (period) {
          case 'week':
              total = weeklyTotal;
              count = weeklyCount;
              titleKey = 'summary.weeklyTotal';
              periodNameKey = 'summary.periodWeek';
              break;
          case 'bi-weekly':
              total = biWeeklyTotal;
              count = biWeeklyCount;
              titleKey = 'summary.biWeeklyTotal';
              periodNameKey = 'summary.periodBiWeek';
              break;
          case 'month':
              total = monthlyTotal;
              count = monthlyCount;
              titleKey = 'summary.monthlyTotal';
              periodNameKey = 'summary.periodMonth';
              break;
      }

       // Show skeleton if not client, not loaded, or total is still null (calculating)
       if (!isClient || !isLoaded || total === null) {
          return (
                <div className="mt-4 p-4 rounded-md border bg-card space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                </div>
          )
       }

       // Render actual content once loaded
       return (
            <div className="mt-4 p-4 rounded-md border bg-card">
                <h3 className="text-lg font-semibold">{t(titleKey)}</h3>
                <p className="text-2xl font-bold text-primary">{formatCurrency(total)}</p>
                <p className="text-sm text-muted-foreground">{t('summary.countDescription', { count, period: t(periodNameKey) })}</p>
            </div>
       );
  }


  return (
    <Card>
        <CardHeader>
          {/* Conditionally render title or skeleton */}
          <CardTitle>{isLoaded ? t('summary.title') : <Skeleton className="h-6 w-1/2" />}</CardTitle>
        </CardHeader>
        <CardContent>
             <Tabs defaultValue="week" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    {/* Conditionally render triggers or skeletons */}
                    {isLoaded ? (
                        <>
                            <TabsTrigger value="week">{t('summary.tabWeek')}</TabsTrigger>
                            <TabsTrigger value="bi-weekly">{t('summary.tabBiWeek')}</TabsTrigger>
                            <TabsTrigger value="month">{t('summary.tabMonth')}</TabsTrigger>
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
