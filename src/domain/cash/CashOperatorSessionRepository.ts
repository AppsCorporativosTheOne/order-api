import type { CashDbClient } from "./CashDbClient.js";
import { CashOperatorSession, CashOperatorSessionStatus } from "./CashOperatorSession.js";

export type OpenCashOperatorSessionData = {
  cashDaySessionId: string;
  operatorId: string;
  openingBalance: number;
  notes?: string | null;
};

export type CloseCashOperatorSessionValues = {
  expectedCashBalance: number;
  countedCashBalance: number;
  cashDifference: number;
  notes?: string | null;
};

export interface CashOperatorSessionRepository {
  create(data: OpenCashOperatorSessionData): Promise<CashOperatorSession>;
  findById(id: string): Promise<CashOperatorSession | null>;
  findByCashDaySessionAndOperatorId(
    cashDaySessionId: string,
    operatorId: string,
  ): Promise<CashOperatorSession | null>;
  findAnyOpenSessionForOperator(operatorId: string): Promise<CashOperatorSession | null>;
  listByCashDaySessionId(cashDaySessionId: string): Promise<CashOperatorSession[]>;
  hasOpenSessionsForCashDay(cashDaySessionId: string): Promise<boolean>;
  closeSession(sessionId: string, values: CloseCashOperatorSessionValues): Promise<CashOperatorSession>;
  closeSessionWithClient(
    client: CashDbClient,
    sessionId: string,
    values: CloseCashOperatorSessionValues,
  ): Promise<CashOperatorSession>;
}
