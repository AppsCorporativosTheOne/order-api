import { DiningTable } from "./DiningTable.js";

export type CreateDiningTableData = {
  name: string;
  sortOrder?: number;
};

export interface DiningTableRepository {
  create(data: CreateDiningTableData): Promise<DiningTable>;
  findById(id: string): Promise<DiningTable | null>;
  list(filters?: { activeOnly?: boolean }): Promise<DiningTable[]>;
}
