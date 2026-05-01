import { CashOrder } from "./CashOrder.js";

export type OpenCashOrderData = {
  cashDaySessionId: string;
  cashOperatorSessionId: string;
  diningTableId?: string | null;
  notes?: string | null;
};

export interface CashOrderRepository {
  create(data: OpenCashOrderData): Promise<CashOrder>;
  findById(id: string): Promise<CashOrder | null>;
  listByCashDaySessionId(cashDaySessionId: string): Promise<CashOrder[]>;
  countOpenByCashOperatorSessionId(cashOperatorSessionId: string): Promise<number>;
  close(orderId: string): Promise<CashOrder>;
}
