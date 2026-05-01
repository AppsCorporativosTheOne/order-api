import { AppError } from "../../domain/errors/AppError.js";
import { CashMovementRepository } from "../../domain/cash/CashMovementRepository.js";
import { CashOperatorSessionRepository } from "../../domain/cash/CashOperatorSessionRepository.js";
import { OperatorRepository } from "../../domain/operators/OperatorRepository.js";
import { roundMoney } from "../../infra/cash/money.js";

export class GetCashOperatorSessionDetailUseCase {
  constructor(
    private readonly cashOperatorSessionRepository: CashOperatorSessionRepository,
    private readonly cashMovementRepository: CashMovementRepository,
    private readonly operatorRepository: OperatorRepository,
  ) {}

  async execute(operatorSessionId: string) {
    const drawer =
      await this.cashOperatorSessionRepository.findById(operatorSessionId);

    if (!drawer) {
      throw new AppError(
        "Sessao de caixa do operador nao encontrada.",
        404,
        "CASH_OPERATOR_SESSION_NOT_FOUND",
      );
    }

    const operator = await this.operatorRepository.findById(drawer.operatorId);

    if (!operator) {
      throw new AppError(
        "Operador vinculado ao caixa estava inconsistente na base.",
        500,
        "OPERATOR_INCONSISTENT",
      );
    }

    const [totals, movements] = await Promise.all([
      this.cashMovementRepository.sumTotalsForOperatorSession(drawer.id),
      this.cashMovementRepository.listByCashOperatorSessionId(drawer.id),
    ]);

    const liveExpectedCashBalance = roundMoney(drawer.openingBalance + totals.netImpact);

    return {
      operatorSession: drawer,
      operator,
      movementTotals: totals,
      computed: {
        liveExpectedCashBalance,
      },
      movements,
    };
  }
}
