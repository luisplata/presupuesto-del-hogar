export type Product = {
  name: string;
  value: number;
  color: string;
};

export type Expense = {
  id: string;
  product: Product;
  price: number;
  category: string;
  timestamp: Date;
};

