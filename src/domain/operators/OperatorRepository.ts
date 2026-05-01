import { Operator } from "./Operator.js";

export type CreateOperatorData = {
  name: string;
  code?: string | null;
};

export interface OperatorRepository {
  create(data: CreateOperatorData): Promise<Operator>;
  findById(id: string): Promise<Operator | null>;
  findByNameIgnoringCase(name: string): Promise<Operator | null>;
  list(filters: { activeOnly?: boolean }): Promise<Operator[]>;
}
