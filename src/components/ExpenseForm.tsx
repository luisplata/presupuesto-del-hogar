
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
import { useState, useEffect, ChangeEvent, useMemo, useRef } from 'react'; // Import useRef
import type { Expense } from '@/types/expense';
import { formatCurrency, parseCurrency } from "@/lib/dateUtils";


interface ExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, 'id' | 'timestamp'>) => void;
  categories: string[]; // Receive the list of available categories (excluding default key)
  defaultCategoryKey: string; // Receive the key for the default category
}

// Define Zod schema using a function to access translations
const createFormSchema = () => z.object({
  product: z.string().min(1, {
    message: 'El nombre del producto no puede estar vacío.', // Hardcoded Spanish
  }),
  price: z.coerce.number().positive({ // Validation remains as positive number
    message: 'El precio debe ser un número positivo.', // Hardcoded Spanish
  }),
  category: z.string().optional(), // Category is optional in the schema, default handled in logic
});


export function ExpenseForm({ onAddExpense, categories, defaultCategoryKey }: ExpenseFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Local state to hold the formatted price string for the input display
  const [formattedPrice, setFormattedPrice] = useState("");
  const productInputRef = useRef<HTMLInputElement>(null); // Ref for the product input

  // Dynamically create the schema with translations
  const formSchema = useMemo(() => createFormSchema(), []);

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
        product: {
          name: values.product,
          color: "",
          value: 0
        },
        price: values.price,
        category: categoryToSubmit, // Submit the key or the entered category
      });

      toast({
        title: 'Gasto agregado', // Hardcoded Spanish title
        description: `Producto: ${values.product}, Precio: ${formatCurrency(values.price)}, Categoría: ${categoryToSubmit}`, // Hardcoded Spanish description
      });
      form.reset({ product: "", price: 0, category: "" }); // Reset form with category empty
      setFormattedPrice(formatCurrency(0)); // Reset local formatted price state
      productInputRef.current?.focus(); // Set focus back to product input
    } catch (error) {
      console.error("Error al agregar gasto:", error);
      toast({
        title: 'Error', // Hardcoded Spanish error title
        description: 'No se pudo agregar el gasto.', // Hardcoded Spanish error description
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
       {/* Adjust padding and spacing */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4 rounded-lg border bg-card p-4 sm:p-6 shadow-sm">
        <FormField
          control={form.control}
          name="product"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs sm:text-sm">Producto</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Café"
                  {...field}
                  ref={productInputRef} // Assign ref to the input
                />
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
              <FormLabel className="text-xs sm:text-sm">Precio (COP)</FormLabel>
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
              <FormLabel className="text-xs sm:text-sm">Categoría (Opcional)</FormLabel>
              <FormControl>
                <>
                 <Input
                    placeholder="Ej: Comida"
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
         {/* Make button full width on smaller screens */}
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? 'Agregando...' : 'Agregar Gasto'}
        </Button>
      </form>
    </Form>
  );
}
