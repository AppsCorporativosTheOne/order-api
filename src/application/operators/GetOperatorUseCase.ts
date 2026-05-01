import { AppError } from "../../domain/errors/AppError.js";
import { OperatorRepository } from "../../domain/operators/OperatorRepository.js";

export class GetOperatorUseCase {
  constructor(private readonly operatorRepository: OperatorRepository) {}

  async execute(operatorId: string) {
    const operator = await this.operatorRepository.findById(operatorId);

    if (!operator) {
      throw new AppError("Operador nao encontrado.", 404, "OPERATOR_NOT_FOUND");
    }

    return operator;
  }
}
