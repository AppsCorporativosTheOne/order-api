export type CashOperatorSessionStatus = "OPEN" | "CLOSED";

export interface CashOperatorSession {
  id: string;
  cashDaySessionId: string;
  operatorId: string;
  openingBalance: number;
  status: CashOperatorSessionStatus;
  notes: string | null;
  openedAt: Date;
  closedAt: Date | null;
  expectedCashBalance: number | null;
  countedCashBalance: number | null;
  cashDifference: number | null;
}
