import {
  ListStockEntriesFilters,
  StockEntryRepository,
} from "../../domain/stocks/StockEntryRepository.js";

export class ListStockEntriesUseCase {
  constructor(private readonly stockEntryRepository: StockEntryRepository) {}

  async execute(filters: ListStockEntriesFilters) {
    return this.stockEntryRepository.list(filters);
  }
}
