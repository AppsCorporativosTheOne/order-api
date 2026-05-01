export type CashDbClient = {
  query: (text: string, values?: unknown[]) => Promise<{ rows: unknown[] }>;
};
