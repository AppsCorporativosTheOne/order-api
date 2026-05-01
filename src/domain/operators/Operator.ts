export interface Operator {
  id: string;
  name: string;
  code: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
