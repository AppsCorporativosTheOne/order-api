export type CashDaySessionStatus = "OPEN" | "CLOSED";

export interface CashDaySession {
  id: string;
  businessDate: string;
  status: CashDaySessionStatus;
  notes: string | null;
  openedAt: Date;
  closedAt: Date | null;
  principalOpeningBalance: number;
  principalExpectedCashBalance: number | null;
  principalCountedCashBalance: number | null;
  principalCashDifference: number | null;
  principalCloseNotes: string | null;
}
