import { AppError } from "../../domain/errors/AppError.js";
import { CashDaySessionRepository } from "../../domain/cash/CashDaySessionRepository.js";
import { CashOperatorSessionRepository } from "../../domain/cash/CashOperatorSessionRepository.js";
import { OperatorRepository } from "../../domain/operators/OperatorRepository.js";
import { roundMoney } from "../../infra/cash/money.js";

export class OpenCashOperatorSessionUseCase {
  constructor(
    private readonly cashDaySessionRepository: CashDaySessionRepository,
    private readonly cashOperatorSessionRepository: CashOperatorSessionRepository,
    private readonly operatorRepository: OperatorRepository,
  ) {}

  async execute(payload: {
    cashDaySessionId: string;
    operatorId: string;
    openingBalance?: number | null;
    notes?: string | null;
  }) {
    const daySession =
      await this.cashDaySessionRepository.findById(payload.cashDaySessionId);

    if (!daySession) {
      throw new AppError(
        "Sessao diaria do caixa nao encontrada.",
        404,
        "CASH_DAY_NOT_FOUND",
      );
    }

    if (daySession.status !== "OPEN") {
      throw new AppError(
        "Este caixa do dia esta encerrado. Novos caixas de operadores nao sao aceitos.",
        409,
        "CASH_DAY_CLOSED",
      );
    }

    const operator = await this.operatorRepository.findById(payload.operatorId);

    if (!operator) {
      throw new AppError("Operador nao encontrado.", 404, "OPERATOR_NOT_FOUND");
    }

    if (!operator.active) {
      throw new AppError("Operador inativo.", 409, "OPERATOR_INACTIVE");
    }

    const existingDrawer =
      await this.cashOperatorSessionRepository.findByCashDaySessionAndOperatorId(
        payload.cashDaySessionId,
        payload.operatorId,
      );

    if (existingDrawer) {
      throw new AppError(
        "Este operador ja possui sessao registrada neste dia de negocio.",
        409,
        "CASH_OPERATOR_SESSION_ALREADY_EXISTS",
      );
    }

    const otherOpenDrawer =
      await this.cashOperatorSessionRepository.findAnyOpenSessionForOperator(payload.operatorId);

    if (otherOpenDrawer && otherOpenDrawer.cashDaySessionId !== payload.cashDaySessionId) {
      throw new AppError(
        "Operador com caixa ainda em aberto em outra data. Feche o caixa atual antes.",
        409,
        "OPERATOR_HAS_OPEN_DRAWER",
      );
    }

    const openingBalance = payload.openingBalance ?? 0;

    if (openingBalance < 0) {
      throw new AppError(
        "Valor de abertura nao pode ser negativo.",
        400,
        "INVALID_OPENING_BALANCE",
      );
    }

    return this.cashOperatorSessionRepository.create({
      cashDaySessionId: payload.cashDaySessionId,
      operatorId: payload.operatorId,
      openingBalance: roundMoney(openingBalance),
      notes: payload.notes ?? null,
    });
  }
}
