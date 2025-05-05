
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
import { useState, useEffect, ChangeEvent, useMemo } from 'react'; // Import useMemo
import type { Expense } from '@/types/expense';
import { formatCurrency, parseCurrency } from "@/lib/dateUtils";
import { useLocale } from '@/hooks/useLocale'; // Import useLocale

interface ExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, 'id' | 'timestamp'>) => void;
  categories: string[]; // Receive the list of available categories (excluding default key)
  defaultCategoryKey: string; // Receive the key for the default category
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


export function ExpenseForm({ onAddExpense, categories, defaultCategoryKey }: ExpenseFormProps) {
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
      // Default to formatting 0 if priceValue is not a valid number
      setFormattedPrice(formatCurrency(0));
    }
  }, [priceValue]);

  // Custom change handler for the price input
  const handlePriceChange = (event: ChangeEvent<HTMLInputElement>, fieldOnChange: (value: number) => void) => {
    const rawValue = event.target.value;
    const numericValue = parseCurrency(rawValue);
    // Use formatCurrency to update the display immediately
    setFormattedPrice(formatCurrency(isNaN(numericValue) ? 0 : numericValue));
    // Update the numeric form state
    fieldOnChange(isNaN(numericValue) ? 0 : numericValue);
  };

   // Custom blur handler to ensure final formatting
   const handlePriceBlur = (fieldOnBlur: () => void, value: number) => {
     // Re-format the current numeric value on blur
     setFormattedPrice(formatCurrency(isNaN(value) ? 0 : value));
     fieldOnBlur(); // Trigger react-hook-form's blur handler
   };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // If the input is empty or just whitespace, use the defaultCategoryKey
      const categoryToSubmit = values.category?.trim() || defaultCategoryKey;

      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay

      onAddExpense({
        product: values.product,
        price: values.price,
        category: categoryToSubmit, // Submit the key or the entered category
      });

      toast({
        title: t('form.toast.expenseAddedTitle'), // Translated title
        description: t('form.toast.expenseAddedDescription', { // Translated description with interpolation
            product: values.product,
            price: formatCurrency(values.price),
            // Translate category for the toast message
            category: categoryToSubmit === defaultCategoryKey ? t(defaultCategoryKey) : categoryToSubmit
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
                  type="text" // Use text to allow formatting characters
                  placeholder={formatCurrency(0)} // Show formatted placeholder
                  {...field}
                  value={formattedPrice} // Bind to the formatted string state
                  onChange={(e) => handlePriceChange(e, field.onChange)}
                  onBlur={() => handlePriceBlur(field.onBlur, field.value)}
                  inputMode="decimal" // Hint for mobile keyboards
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
                    {/* Map through provided categories (keys/names already filtered in parent) */}
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
