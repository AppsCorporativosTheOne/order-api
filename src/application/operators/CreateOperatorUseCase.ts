import { AppError } from "../../domain/errors/AppError.js";
import {
  CreateOperatorData,
  OperatorRepository,
} from "../../domain/operators/OperatorRepository.js";

export class CreateOperatorUseCase {
  constructor(private readonly operatorRepository: OperatorRepository) {}

  async execute(data: CreateOperatorData) {
    const existing = await this.operatorRepository.findByNameIgnoringCase(data.name);

    if (existing) {
      throw new AppError(
        "Operador ja cadastrado com este nome.",
        409,
        "OPERATOR_ALREADY_EXISTS",
      );
    }

    return this.operatorRepository.create(data);
  }
}
