import { z } from "zod";

export const operatorIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createOperatorBodySchema = z.object({
  name: z.string().min(1).max(200),
  code: z.union([z.string().min(1).max(50), z.literal(""), z.null()]).optional(),
});

export const listOperatorsQuerySchema = z.object({
  activeOnly: z.enum(["true", "false"]).optional(),
});
