import { StockEntry } from "./StockEntry.js";

export interface CreateStockEntryData {
  productId: string;
  quantity: number;
  manufacturingDate?: Date | null;
  expirationDate?: Date | null;
  unitValue: number;
  cost: number;
}

export interface ListStockEntriesFilters {
  productId?: string;
  expiresUntil?: Date;
}

export interface StockEntryRepository {
  create(data: CreateStockEntryData): Promise<StockEntry>;
  findById(id: string): Promise<StockEntry | null>;
  list(filters: ListStockEntriesFilters): Promise<StockEntry[]>;
}
