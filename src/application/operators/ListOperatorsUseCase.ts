import { OperatorRepository } from "../../domain/operators/OperatorRepository.js";

export class ListOperatorsUseCase {
  constructor(private readonly operatorRepository: OperatorRepository) {}

  async execute(filters?: { activeOnly?: boolean }) {
    return this.operatorRepository.list(filters ?? {});
  }
}
