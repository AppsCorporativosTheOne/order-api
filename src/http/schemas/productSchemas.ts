import { z } from "zod";

export const stockSalePolicySchema = z.enum(["YES", "NO"]);

export const createProductBodySchema = z.object({
  brand: z.string().trim().min(1).max(120).nullable().optional(),
  name: z.string().trim().min(2).max(160),
  category: z.string().trim().min(2).max(120),
  department: z.string().trim().min(2).max(120),
  sellWithoutStock: stockSalePolicySchema,
});

export const listProductsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  department: z.string().trim().min(1).optional(),
});

export const productIdParamsSchema = z.object({
  id: z.string().uuid(),
});
