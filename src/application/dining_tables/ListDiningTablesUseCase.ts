import { DiningTableRepository } from "../../domain/cash/DiningTableRepository.js";

export class ListDiningTablesUseCase {
  constructor(private readonly diningTableRepository: DiningTableRepository) {}

  async execute(filters?: { activeOnly?: boolean }) {
    return this.diningTableRepository.list(filters ?? {});
  }
}
