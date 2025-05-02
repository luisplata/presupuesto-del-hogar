
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
import { useState, useEffect, ChangeEvent } from 'react'; // Import useEffect, ChangeEvent
import type { Expense } from '@/types/expense';
import { formatCurrency, parseCurrency } from "@/lib/dateUtils"; // Import formatCurrency and parseCurrency

const formSchema = z.object({
  product: z.string().min(1, {
    message: "El nombre del producto no puede estar vacío.",
  }),
  price: z.coerce.number().positive({ // Validation remains as positive number
    message: "El precio debe ser un número positivo.",
  }),
});

interface ExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, 'id' | 'timestamp'>) => void;
}

export function ExpenseForm({ onAddExpense }: ExpenseFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Local state to hold the formatted price string for the input display
  const [formattedPrice, setFormattedPrice] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product: "",
      price: 0, // Initialize numeric price with 0
    },
  });

  // Watch the price value from react-hook-form
  const priceValue = form.watch('price');

  // Effect to update the formatted price string when the numeric form value changes
  // (e.g., on form reset or initial load)
  useEffect(() => {
    setFormattedPrice(formatCurrency(priceValue));
  }, [priceValue]);

  // Custom change handler for the price input
  const handlePriceChange = (event: ChangeEvent<HTMLInputElement>, fieldOnChange: (value: number) => void) => {
    const rawValue = event.target.value;
    // Parse the raw input value (which might contain $ and .) into a number
    const numericValue = parseCurrency(rawValue);

    // Format the parsed number back into a currency string for display
    setFormattedPrice(formatCurrency(numericValue));

    // Update the react-hook-form state with the numeric value
    fieldOnChange(numericValue);
  };

   // Custom blur handler to ensure final formatting
   const handlePriceBlur = (fieldOnBlur: () => void, value: number) => {
     // Re-format the numeric value from the form state on blur
     setFormattedPrice(formatCurrency(value));
     // Trigger react-hook-form's blur handler
     fieldOnBlur();
   };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // Simulate async operation if needed, otherwise directly call onAddExpense
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
      onAddExpense({ product: values.product, price: values.price });
      toast({
        title: "Gasto agregado",
        description: `Producto: ${values.product}, Precio: ${formatCurrency(values.price)}`, // Format price in toast
      });
      form.reset(); // Reset form
      setFormattedPrice(formatCurrency(0)); // Reset local formatted price state
    } catch (error) {
      console.error("Failed to add expense:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar el gasto.",
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
              <FormLabel>Producto</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Café" {...field} />
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
              <FormLabel>Precio (COP)</FormLabel>
              <FormControl>
                {/* Use input type="text" to allow currency symbols */}
                <Input
                  type="text"
                  placeholder="$0" // Use currency placeholder
                  {...field} // Spread field props BUT override value and onChange
                  value={formattedPrice} // Display the formatted string
                  onChange={(e) => handlePriceChange(e, field.onChange)} // Use custom handler
                  onBlur={() => handlePriceBlur(field.onBlur, field.value)} // Use custom blur handler
                  inputMode="numeric" // Hint for mobile keyboards
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Agregando...' : 'Agregar Gasto'}
        </Button>
      </form>
    </Form>
  );
}
