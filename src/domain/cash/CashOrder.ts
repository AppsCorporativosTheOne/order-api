export type CashOrderStatus = "OPEN" | "CLOSED";

export interface CashOrder {
  id: string;
  cashDaySessionId: string;
  cashOperatorSessionId: string;
  diningTableId: string | null;
  status: CashOrderStatus;
  notes: string | null;
  openedAt: Date;
  closedAt: Date | null;
}
