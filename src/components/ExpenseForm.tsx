
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
import { useState, useEffect, ChangeEvent, useMemo, useRef } from 'react';
import type { Expense } from '@/types/expense';
import { formatCurrency, parseCurrency } from "@/lib/dateUtils";


interface ExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, 'id' | 'timestamp'>) => void;
  categories: string[];
  defaultCategoryKey: string;
  productInputRef: React.RefObject<HTMLInputElement>; // Add ref prop
}

const createFormSchema = () => z.object({
  product: z.string().min(1, {
    message: 'El nombre del producto no puede estar vacío.',
  }),
  price: z.coerce.number().positive({
    message: 'El precio debe ser un número positivo.',
  }),
  category: z.string().optional(),
});


export function ExpenseForm({ onAddExpense, categories, defaultCategoryKey, productInputRef }: ExpenseFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formattedPrice, setFormattedPrice] = useState("");

  const formSchema = useMemo(() => createFormSchema(), []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product: "",
      price: 0,
      category: "",
    },
  });

  const priceValue = form.watch('price');

  useEffect(() => {
    if (typeof priceValue === 'number' && !isNaN(priceValue)) {
      setFormattedPrice(formatCurrency(priceValue));
    } else {
      setFormattedPrice(formatCurrency(0));
    }
  }, [priceValue]);

  const handlePriceChange = (event: ChangeEvent<HTMLInputElement>, fieldOnChange: (value: number) => void) => {
    const rawValue = event.target.value;
    const numericValue = parseCurrency(rawValue);
    setFormattedPrice(formatCurrency(isNaN(numericValue) ? 0 : numericValue));
    fieldOnChange(isNaN(numericValue) ? 0 : numericValue);
  };

   const handlePriceBlur = (fieldOnBlur: () => void, value: number) => {
     setFormattedPrice(formatCurrency(isNaN(value) ? 0 : value));
     fieldOnBlur();
   };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const categoryToSubmit = values.category?.trim() || defaultCategoryKey;

      await new Promise(resolve => setTimeout(resolve, 100));

      onAddExpense({
        product: {
          name: values.product,
          color: "",
          value: 0
        },
        price: values.price,
        category: categoryToSubmit,
      });

      toast({
        title: 'Gasto agregado',
        description: `Producto: ${values.product}, Precio: ${formatCurrency(values.price)}, Categoría: ${categoryToSubmit}`,
      });
      form.reset({ product: "", price: 0, category: "" });
      setFormattedPrice(formatCurrency(0));
      productInputRef.current?.focus(); // Use the passed ref
    } catch (error) {
      console.error("Error al agregar gasto:", error);
      toast({
        title: 'Error',
        description: 'No se pudo agregar el gasto.',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
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
                  type="text"
                  placeholder={formatCurrency(0)}
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
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? 'Agregando...' : 'Agregar Gasto'}
        </Button>
      </form>
    </Form>
  );
}

