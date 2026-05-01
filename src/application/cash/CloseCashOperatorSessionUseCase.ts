import type { Pool } from "pg";
import { AppError } from "../../domain/errors/AppError.js";
import { CashDaySessionRepository } from "../../domain/cash/CashDaySessionRepository.js";
import { CashMovementRepository } from "../../domain/cash/CashMovementRepository.js";
import {
  CashOperatorSessionRepository,
  CloseCashOperatorSessionValues,
} from "../../domain/cash/CashOperatorSessionRepository.js";
import { CashOrderRepository } from "../../domain/cash/CashOrderRepository.js";
import { CashPrincipalMovementRepository } from "../../domain/cash/CashPrincipalMovementRepository.js";
import type { CashDbClient } from "../../domain/cash/CashDbClient.js";
import { withTransaction } from "../../infra/database/withTransaction.js";
import { roundMoney } from "../../infra/cash/money.js";

function isUniqueViolation(cause: unknown): boolean {
  return (
    typeof cause === "object" &&
    cause !== null &&
    "code" in cause &&
    (cause as { code: unknown }).code === "23505"
  );
}

export class CloseCashOperatorSessionUseCase {
  constructor(
    private readonly pool: Pool,
    private readonly cashDaySessionRepository: CashDaySessionRepository,
    private readonly cashOperatorSessionRepository: CashOperatorSessionRepository,
    private readonly cashMovementRepository: CashMovementRepository,
    private readonly cashOrderRepository: CashOrderRepository,
    private readonly cashPrincipalMovementRepository: CashPrincipalMovementRepository,
  ) {}

  async execute(payload: {
    operatorSessionId: string;
    countedCashBalance: number;
    notes?: string | null;
  }) {
    const drawer = await this.cashOperatorSessionRepository.findById(payload.operatorSessionId);

    if (!drawer) {
      throw new AppError(
        "Sessao de caixa do operador nao encontrada.",
        404,
        "CASH_OPERATOR_SESSION_NOT_FOUND",
      );
    }

    if (drawer.status !== "OPEN") {
      throw new AppError(
        "Este caixa do operador ja foi encerrado.",
        409,
        "CASH_OPERATOR_SESSION_ALREADY_CLOSED",
      );
    }

    const daySession = await this.cashDaySessionRepository.findById(drawer.cashDaySessionId);

    if (!daySession) {
      throw new AppError(
        "Sessao diaria do caixa estava inconsistente na base.",
        500,
        "CASH_DAY_INCONSISTENT",
      );
    }

    if (daySession.status !== "OPEN") {
      throw new AppError(
        "O dia de caixa precisa estar aberto para fechar sessoes pelo fluxo atual.",
        409,
        "CASH_DAY_CLOSED",
      );
    }

    const openOrders = await this.cashOrderRepository.countOpenByCashOperatorSessionId(drawer.id);

    if (openOrders > 0) {
      throw new AppError(
        "Encerre todos os pedidos/mesas em aberto deste caixa antes de fechar.",
        409,
        "CASH_OPERATOR_HAS_OPEN_ORDERS",
      );
    }

    const totals = await this.cashMovementRepository.sumTotalsForOperatorSession(drawer.id);
    const expectedCashBalance = roundMoney(drawer.openingBalance + totals.netImpact);

    const countedCashBalance = roundMoney(payload.countedCashBalance);
    const cashDifference = roundMoney(countedCashBalance - expectedCashBalance);

    const closeValues: CloseCashOperatorSessionValues = {
      expectedCashBalance,
      countedCashBalance,
      cashDifference,
      notes: payload.notes ?? null,
    };

    const closedDrawer = await withTransaction(this.pool, async (client) => {
      const dbClient: CashDbClient = {
        query: async (text, vals) =>
          ({
            rows: (await client.query(text, vals as unknown[])).rows as unknown[],
          }) as { rows: unknown[] },
      };

      const closed = await this.cashOperatorSessionRepository.closeSessionWithClient(
        dbClient,
        drawer.id,
        closeValues,
      );

      try {
        await this.cashPrincipalMovementRepository.createWithClient(dbClient, {
          cashDaySessionId: closed.cashDaySessionId,
          cashOperatorSessionId: closed.id,
          kind: "OPERATOR_CLOSE_CONTRIBUTION",
          cashEffect: "IN",
          amount: countedCashBalance,
          description: "Incorporacao automatica do valor conferido ao fechar o drawer do operador.",
          referenceType: "CASH_OPERATOR_SESSION",
          referenceId: closed.id,
        });
      } catch (cause: unknown) {
        if (isUniqueViolation(cause)) {
          throw new AppError(
            "Contribuicao ao caixa principal para este operador ja foi registrada.",
            409,
            "OPERATOR_ALREADY_CONSOLIDATED_IN_PRINCIPAL",
          );
        }

        throw cause;
      }

      return closed;
    });

    return {
      operatorSession: closedDrawer,
      totals,
      countedCashBalance,
      cashDifference,
    };
  }
}
