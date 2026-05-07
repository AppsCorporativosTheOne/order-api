import { CashOrderLine } from "./CashOrderLine.js";

export type CreateCashOrderLineData = {
  cashOrderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  notes?: string | null;
};

export interface CashOrderLineRepository {
  create(data: CreateCashOrderLineData): Promise<CashOrderLine>;
  listByCashOrderId(cashOrderId: string): Promise<CashOrderLine[]>;
  sumLineTotalByCashOrderId(cashOrderId: string): Promise<number>;
}
