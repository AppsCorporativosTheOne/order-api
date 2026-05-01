import { AppError } from "../../domain/errors/AppError.js";
import { StockEntryRepository } from "../../domain/stocks/StockEntryRepository.js";

export class GetStockEntryUseCase {
  constructor(private readonly stockEntryRepository: StockEntryRepository) {}

  async execute(id: string) {
    const stockEntry = await this.stockEntryRepository.findById(id);

    if (!stockEntry) {
      throw new AppError("Lancamento de estoque nao encontrado.", 404, "STOCK_ENTRY_NOT_FOUND");
    }

    return stockEntry;
  }
}
