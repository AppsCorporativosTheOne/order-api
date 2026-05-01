export interface StockEntry {
  id: string;
  productId: string;
  quantity: number;
  manufacturingDate: Date | null;
  expirationDate: Date | null;
  unitValue: number;
  cost: number;
  finalValue: number;
  createdAt: Date;
}
