
// components/ExpenseForm.tsx

import * as z from "zod"; // Import zod
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
import { useState } from 'react';
import type { Expense } from '@/types/expense';

const formSchema = z.object({
  product: z.string().min(1, {
    message: "El nombre del producto no puede estar vacío.",
  }),
  price: z.coerce.number().positive({
    message: "El precio debe ser un número positivo.",
  }),
});

interface ExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, 'id' | 'timestamp'>) => void;
}

export function ExpenseForm({ onAddExpense }: ExpenseFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product: "",
      price: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // Simulate async operation if needed, otherwise directly call onAddExpense
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
      onAddExpense({ product: values.product, price: values.price });
      toast({
        title: "Gasto agregado",
        description: `Producto: ${values.product}, Precio: ${values.price}`,
      });
      form.reset(); // Reset form after successful submission
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
              <FormLabel>Precio</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Ej: 5.50" step="0.01" {...field} />
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
