import { CashDaySession, CashDaySessionStatus } from "./CashDaySession.js";

export type OpenCashDaySessionData = {
  businessDate: string;
  notes?: string | null;
  principalOpeningBalance?: number;
};

export type FinalizeCashDayCloseData = {
  principalExpectedCashBalance: number;
  principalCountedCashBalance: number;
  principalCashDifference: number;
  principalCloseNotes?: string | null;
  closedAt: Date;
};

export interface CashDaySessionRepository {
  create(data: OpenCashDaySessionData): Promise<CashDaySession>;
  findByBusinessDate(businessDate: string): Promise<CashDaySession | null>;
  findById(id: string): Promise<CashDaySession | null>;
  updateStatus(sessionId: string, status: CashDaySessionStatus, closedAt?: Date | null): Promise<void>;
  finalizeDayClose(sessionId: string, data: FinalizeCashDayCloseData): Promise<void>;
}
