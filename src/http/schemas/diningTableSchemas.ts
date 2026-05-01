import { z } from "zod";

export const diningTableIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createDiningTableBodySchema = z.object({
  name: z.string().min(1).max(200),
  sortOrder: z.coerce.number().int().optional(),
});

export const listDiningTablesQuerySchema = z.object({
  activeOnly: z.enum(["true", "false"]).optional(),
});
