import { AppError } from "../../domain/errors/AppError.js";
import { CashDaySessionRepository } from "../../domain/cash/CashDaySessionRepository.js";
import { CashMovementRepository } from "../../domain/cash/CashMovementRepository.js";
import { CashOperatorSessionRepository } from "../../domain/cash/CashOperatorSessionRepository.js";
import { CashPrincipalMovementRepository } from "../../domain/cash/CashPrincipalMovementRepository.js";
import { OperatorRepository } from "../../domain/operators/OperatorRepository.js";
import { roundMoney } from "../../infra/cash/money.js";

export class GetCashDaySessionOverviewUseCase {
  constructor(
    private readonly cashDaySessionRepository: CashDaySessionRepository,
    private readonly cashOperatorSessionRepository: CashOperatorSessionRepository,
    private readonly cashMovementRepository: CashMovementRepository,
    private readonly cashPrincipalMovementRepository: CashPrincipalMovementRepository,
    private readonly operatorRepository: OperatorRepository,
  ) {}

  async execute(cashDaySessionId: string) {
    const daySession = await this.cashDaySessionRepository.findById(cashDaySessionId);

    if (!daySession) {
      throw new AppError(
        "Sessao diaria do caixa nao encontrada.",
        404,
        "CASH_DAY_NOT_FOUND",
      );
    }

    const operatorSessions =
      await this.cashOperatorSessionRepository.listByCashDaySessionId(cashDaySessionId);

    const operatorIds = [...new Set(operatorSessions.map((session) => session.operatorId))];
    const operators = await Promise.all(
      operatorIds.map((operatorId) => this.operatorRepository.findById(operatorId)),
    );

    const operatorById = new Map(
      operators
        .filter((candidate): candidate is NonNullable<Awaited<typeof candidate>> =>
          candidate !== undefined && candidate !== null,
        )
        .map((candidate) => [candidate.id, candidate]),
    );

    const drawersOverview = [];

    let runningDayNetImpact = 0;

    for (const session of operatorSessions) {
      const totals =
        await this.cashMovementRepository.sumTotalsForOperatorSession(session.id);
      runningDayNetImpact = roundMoney(runningDayNetImpact + totals.netImpact);

      drawersOverview.push({
        operatorSession: session,
        operator: operatorById.get(session.operatorId) ?? null,
        movementTotals: totals,
        liveExpectedCashBalance: roundMoney(session.openingBalance + totals.netImpact),
      });
    }

    const [principalTotals, principalMovements] = await Promise.all([
      this.cashPrincipalMovementRepository.sumTotalsForDay(cashDaySessionId),
      this.cashPrincipalMovementRepository.listByCashDaySessionId(cashDaySessionId),
    ]);

    const liveExpectedPrincipalCashBalance = roundMoney(
      daySession.principalOpeningBalance + principalTotals.netImpact,
    );

    return {
      cashDaySession: daySession,
      operatorDrawers: drawersOverview,
      principal: {
        movementTotals: principalTotals,
        movements: principalMovements,
        liveExpectedPrincipalCashBalance,
      },
      totals: {
        operatorSessionsCount: operatorSessions.length,
        netCashImpactFromMovements: runningDayNetImpact,
      },
    };
  }
}
