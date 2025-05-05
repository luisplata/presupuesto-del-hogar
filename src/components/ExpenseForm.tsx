
// components/ExpenseForm.tsx
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, ChangeEvent } from 'react';
import type { Expense } from '@/types/expense';
import { formatCurrency, parseCurrency } from "@/lib/dateUtils";
import { useLocale } from '@/hooks/useLocale'; // Import useLocale

interface ExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, 'id' | 'timestamp'>) => void;
  categories: string[]; // Receive the list of available categories (excluding default)
  defaultCategory: string; // Receive translated default category name
}

// Define Zod schema using a function to access translations
const createFormSchema = (t: (key: string) => string) => z.object({
  product: z.string().min(1, {
    message: t('form.validation.productRequired'), // Use translated message
  }),
  price: z.coerce.number().positive({ // Validation remains as positive number
    message: t('form.validation.pricePositive'), // Use translated message
  }),
  category: z.string().optional(), // Category is optional in the schema, default handled in logic
});


export function ExpenseForm({ onAddExpense, categories, defaultCategory }: ExpenseFormProps) {
  const { t } = useLocale(); // Use the hook
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Local state to hold the formatted price string for the input display
  const [formattedPrice, setFormattedPrice] = useState("");

  // Dynamically create the schema with translations
  const formSchema = useMemo(() => createFormSchema(t), [t]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product: "",
      price: 0, // Initialize numeric price with 0
      category: "", // Initialize category as empty, will default on submit if needed
    },
  });

  // Watch the price value from react-hook-form
  const priceValue = form.watch('price');

  // Effect to update the formatted price string when the numeric form value changes
  useEffect(() => {
    if (typeof priceValue === 'number' && !isNaN(priceValue)) {
      setFormattedPrice(formatCurrency(priceValue));
    } else {
      setFormattedPrice(formatCurrency(0));
    }
  }, [priceValue]);

  // Custom change handler for the price input
  const handlePriceChange = (event: ChangeEvent<HTMLInputElement>, fieldOnChange: (value: number) => void) => {
    const rawValue = event.target.value;
    const numericValue = parseCurrency(rawValue);
    setFormattedPrice(formatCurrency(isNaN(numericValue) ? 0 : numericValue));
    fieldOnChange(isNaN(numericValue) ? 0 : numericValue);
  };

   // Custom blur handler to ensure final formatting
   const handlePriceBlur = (fieldOnBlur: () => void, value: number) => {
     setFormattedPrice(formatCurrency(isNaN(value) ? 0 : value));
     fieldOnBlur();
   };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // Use the passed defaultCategory if the input is empty or just whitespace
      const categoryToSubmit = values.category?.trim() || defaultCategory;

      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay

      onAddExpense({
        product: values.product,
        price: values.price,
        category: categoryToSubmit, // Use the potentially defaulted category
      });

      toast({
        title: t('form.toast.expenseAddedTitle'), // Translated title
        description: t('form.toast.expenseAddedDescription', { // Translated description with interpolation
            product: values.product,
            price: formatCurrency(values.price),
            category: categoryToSubmit
        }),
      });
      form.reset({ product: "", price: 0, category: "" }); // Reset form with category empty
      setFormattedPrice(formatCurrency(0)); // Reset local formatted price state
    } catch (error) {
      console.error("Failed to add expense:", error);
      toast({
        title: t('form.toast.errorTitle'), // Translated error title
        description: t('form.toast.errorDescription'), // Translated error description
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
        <FormField
          control={form.control}
          name="product"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.productLabel')}</FormLabel>
              <FormControl>
                <Input placeholder={t('form.productPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.priceLabel')}</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="$0"
                  {...field}
                  value={formattedPrice}
                  onChange={(e) => handlePriceChange(e, field.onChange)}
                  onBlur={() => handlePriceBlur(field.onBlur, field.value)}
                  inputMode="decimal"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.categoryLabel')}</FormLabel>
              <FormControl>
                <>
                 <Input
                    placeholder={t('form.categoryPlaceholder')}
                    {...field}
                    list="category-suggestions"
                    autoComplete="off"
                 />
                  <datalist id="category-suggestions">
                    {/* Map through provided categories (already filtered in parent) */}
                    {categories.map(category => (
                        <option key={category} value={category} />
                    ))}
                  </datalist>
                </>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('form.submittingButton') : t('form.submitButton')}
        </Button>
      </form>
    </Form>
  );
}
