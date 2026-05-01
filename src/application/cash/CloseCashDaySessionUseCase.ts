import { AppError } from "../../domain/errors/AppError.js";
import { CashDaySessionRepository } from "../../domain/cash/CashDaySessionRepository.js";
import { CashOperatorSessionRepository } from "../../domain/cash/CashOperatorSessionRepository.js";
import { CashPrincipalMovementRepository } from "../../domain/cash/CashPrincipalMovementRepository.js";
import { roundMoney } from "../../infra/cash/money.js";

export class CloseCashDaySessionUseCase {
  constructor(
    private readonly cashDaySessionRepository: CashDaySessionRepository,
    private readonly cashOperatorSessionRepository: CashOperatorSessionRepository,
    private readonly cashPrincipalMovementRepository: CashPrincipalMovementRepository,
  ) {}

  async execute(
    cashDaySessionId: string,
    payload: { countedPrincipalCashBalance: number; principalCloseNotes?: string | null },
  ) {
    const session = await this.cashDaySessionRepository.findById(cashDaySessionId);

    if (!session) {
      throw new AppError(
        "Sessao diaria do caixa nao encontrada.",
        404,
        "CASH_DAY_NOT_FOUND",
      );
    }

    if (session.status !== "OPEN") {
      throw new AppError(
        "Este caixa do dia ja foi encerrado.",
        409,
        "CASH_DAY_ALREADY_CLOSED",
      );
    }

    const operatorStillOpen =
      await this.cashOperatorSessionRepository.hasOpenSessionsForCashDay(cashDaySessionId);

    if (operatorStillOpen) {
      throw new AppError(
        "Finalize todos os caixas dos operadores antes de encerrar o dia.",
        409,
        "CASH_DAY_HAS_OPEN_OPERATOR_SESSIONS",
      );
    }

    const principalTotals =
      await this.cashPrincipalMovementRepository.sumTotalsForDay(cashDaySessionId);

    const expectedPrincipalCashBalance = roundMoney(
      session.principalOpeningBalance + principalTotals.netImpact,
    );
    const countedPrincipalCashBalance = roundMoney(payload.countedPrincipalCashBalance);
    const principalCashDifference = roundMoney(
      countedPrincipalCashBalance - expectedPrincipalCashBalance,
    );

    const closedAt = new Date();

    try {
      await this.cashDaySessionRepository.finalizeDayClose(cashDaySessionId, {
        principalExpectedCashBalance: expectedPrincipalCashBalance,
        principalCountedCashBalance: countedPrincipalCashBalance,
        principalCashDifference,
        principalCloseNotes: payload.principalCloseNotes ?? null,
        closedAt,
      });
    } catch {
      throw new AppError(
        "Nao foi possivel atualizar sessao ao encerrar o caixa principal.",
        409,
        "CASH_DAY_CLOSE_REJECTED",
      );
    }

    const updatedSession = await this.cashDaySessionRepository.findById(cashDaySessionId);

    if (!updatedSession) {
      throw new AppError(
        "Sessao diaria apos atualizacao nao foi encontrada.",
        500,
        "CASH_DAY_INCONSISTENT_AFTER_CLOSE",
      );
    }

    return {
      cashDaySession: updatedSession,
      principalTotalsSnapshot: principalTotals,
      countedPrincipalCashBalance,
      principalCashDifference,
    };
  }
}
