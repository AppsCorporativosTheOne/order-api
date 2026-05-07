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

export interface UpdateStockEntryData {
  productId?: string;
  quantity?: number;
  manufacturingDate?: Date | null;
  expirationDate?: Date | null;
  unitValue?: number;
  cost?: number;
}

export interface StockEntryRepository {
  create(data: CreateStockEntryData): Promise<StockEntry>;
  findById(id: string): Promise<StockEntry | null>;
  list(filters: ListStockEntriesFilters): Promise<StockEntry[]>;
  update(id: string, data: UpdateStockEntryData): Promise<StockEntry | null>;
  sumQuantityByProductId(productId: string): Promise<number>;
}
