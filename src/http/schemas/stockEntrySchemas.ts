import { z } from "zod";

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato YYYY-MM-DD.")
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

export const createStockEntryBodySchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  manufacturingDate: dateOnlySchema.nullable().optional(),
  expirationDate: dateOnlySchema.nullable().optional(),
  unitValue: z.coerce.number().nonnegative(),
  cost: z.coerce.number().nonnegative(),
});

export const listStockEntriesQuerySchema = z.object({
  productId: z.string().uuid().optional(),
  expiresUntil: dateOnlySchema.optional(),
});

export const stockEntryIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const updateStockEntryBodySchema = z
  .object({
    productId: z.string().uuid().optional(),
    quantity: z.coerce.number().positive().optional(),
    manufacturingDate: dateOnlySchema.nullable().optional(),
    expirationDate: dateOnlySchema.nullable().optional(),
    unitValue: z.coerce.number().nonnegative().optional(),
    cost: z.coerce.number().nonnegative().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "Informe ao menos um campo para atualizar.",
  });
