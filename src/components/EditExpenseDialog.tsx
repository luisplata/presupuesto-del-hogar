
// components/EditExpenseDialog.tsx
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState, useEffect, ChangeEvent, useMemo } from 'react';
import type { Expense } from '@/types/expense';
import { formatCurrency, parseCurrency } from "@/lib/dateUtils";

interface EditExpenseDialogProps {
  expense: Expense;
  onSave: (updatedExpense: Expense) => void;
  onCancel: () => void;
  categories: string[];
  defaultCategoryKey: string;
}

const formSchema = z.object({
  product: z.string().min(1, {
    message: 'El nombre del producto no puede estar vacío.',
  }),
  price: z.coerce.number().positive({
    message: 'El precio debe ser un número positivo.',
  }),
  category: z.string().optional(),
});

type EditExpenseFormData = z.infer<typeof formSchema>;

export function EditExpenseDialog({ expense, onSave, onCancel, categories, defaultCategoryKey }: EditExpenseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formattedPrice, setFormattedPrice] = useState("");

  const form = useForm<EditExpenseFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product: expense.product.name,
      price: expense.price,
      category: expense.category === defaultCategoryKey ? "" : expense.category,
    },
  });
  
  const priceValue = form.watch('price');

  useEffect(() => {
    // Reset form when the expense prop changes
    form.reset({
      product: expense.product.name,
      price: expense.price,
      category: expense.category === defaultCategoryKey ? "" : expense.category,
    });
    setFormattedPrice(formatCurrency(expense.price));
  }, [expense, form, defaultCategoryKey]);
  
  useEffect(() => {
    // This effect updates formattedPrice when the 'price' field value changes programmatically or by user input
    if (typeof priceValue === 'number' && !isNaN(priceValue)) {
        setFormattedPrice(formatCurrency(priceValue));
    } else if (formattedPrice !== formatCurrency(0)) { // Avoid loop if already "COP 0"
        setFormattedPrice(formatCurrency(0));
    }
  }, [priceValue, formattedPrice]);


  const handlePriceChange = (event: ChangeEvent<HTMLInputElement>, fieldOnChange: (value: number) => void) => {
    const rawValue = event.target.value;
    const numericValue = parseCurrency(rawValue);
    const newFormatted = formatCurrency(isNaN(numericValue) ? 0 : numericValue);
    if (formattedPrice !== newFormatted) { // Only update if there's a real change
      setFormattedPrice(newFormatted);
    }
    fieldOnChange(isNaN(numericValue) ? 0 : numericValue);
  };

  const handlePriceBlur = (fieldOnBlur: () => void, value: number) => {
    const newFormatted = formatCurrency(isNaN(value) ? 0 : value);
    if (formattedPrice !== newFormatted) {
        setFormattedPrice(newFormatted);
    }
    fieldOnBlur();
  };

  async function onSubmit(values: EditExpenseFormData) {
    setIsSubmitting(true);
    try {
      const categoryToSubmit = values.category?.trim() || defaultCategoryKey;
      
      const updatedExpense: Expense = {
        ...expense, // Retain id and timestamp
        product: {
          ...expense.product, // Retain other product properties if any (like color)
          name: values.product,
        },
        price: values.price,
        category: categoryToSubmit,
      };
      
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async operation
      onSave(updatedExpense);
    } catch (error) {
      console.error("Error al actualizar gasto:", error);
      // Toast for error can be handled in parent or here
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Gasto</DialogTitle>
          <DialogDescription>
            Modifica los detalles de tu gasto. Haz clic en "Guardar Cambios" cuando termines.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
                  <FormLabel>Categoría (Opcional)</FormLabel>
                  <FormControl>
                    <>
                      <Input
                        placeholder="Ej: Comida"
                        {...field}
                        list="edit-category-suggestions"
                        autoComplete="off"
                      />
                      <datalist id="edit-category-suggestions">
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
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

