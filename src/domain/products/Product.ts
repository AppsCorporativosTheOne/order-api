export type StockSalePolicy = "YES" | "NO";

export interface Product {
  id: string;
  brand: string | null;
  name: string;
  category: string;
  department: string;
  sellWithoutStock: StockSalePolicy;
  createdAt: Date;
}
