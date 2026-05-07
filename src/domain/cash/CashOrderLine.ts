export interface CashOrderLine {
  id: string;
  cashOrderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  notes: string | null;
  createdAt: Date;
}
