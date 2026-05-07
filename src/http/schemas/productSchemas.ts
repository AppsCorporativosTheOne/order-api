import { z } from "zod";

export const stockSalePolicySchema = z.enum(["YES", "NO"]);

export const createProductBodySchema = z.object({
  brand: z.string().trim().min(1).max(120).nullable().optional(),
  name: z.string().trim().min(2).max(160),
  category: z.string().trim().min(2).max(120),
  department: z.string().trim().min(2).max(120),
  sellWithoutStock: stockSalePolicySchema,
  active: z.boolean().optional(),
  salePrice: z.coerce.number().nonnegative().nullable().optional(),
});

export const listProductsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  department: z.string().trim().min(1).optional(),
  activeOnly: z.enum(["true", "false"]).optional(),
  eligibleForSale: z.enum(["true", "false"]).optional(),
});

export const productIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const updateProductBodySchema = z
  .object({
    brand: z.union([z.string().trim().min(1).max(120), z.null()]).optional(),
    name: z.string().trim().min(2).max(160).optional(),
    category: z.string().trim().min(2).max(120).optional(),
    department: z.string().trim().min(2).max(120).optional(),
    sellWithoutStock: stockSalePolicySchema.optional(),
    active: z.boolean().optional(),
    salePrice: z.coerce.number().nonnegative().nullable().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "Informe ao menos um campo para atualizar.",
  });
