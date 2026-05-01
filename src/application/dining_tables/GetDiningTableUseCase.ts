import { AppError } from "../../domain/errors/AppError.js";
import { DiningTableRepository } from "../../domain/cash/DiningTableRepository.js";

export class GetDiningTableUseCase {
  constructor(private readonly diningTableRepository: DiningTableRepository) {}

  async execute(id: string) {
    const table = await this.diningTableRepository.findById(id);

    if (!table) {
      throw new AppError(
        "Mesa nao encontrada.",
        404,
        "DINING_TABLE_NOT_FOUND",
      );
    }

    return table;
  }
}
