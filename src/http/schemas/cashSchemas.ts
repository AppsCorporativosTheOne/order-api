import { z } from "zod";

const localDateRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

export const openCashDaySessionBodySchema = z.object({
  businessDate: z.string().regex(localDateRegex, {
    message: "Use formato YYYY-MM-DD.",
  }),
  notes: z.string().max(2000).nullable().optional(),
  principalOpeningBalance: z.coerce.number().nonnegative().optional(),
});

export const closeCashDaySessionBodySchema = z.object({
  countedPrincipalCashBalance: z.coerce.number(),
  principalCloseNotes: z.string().max(2000).nullable().optional(),
});

export const cashDaySessionIdParamsSchema = z.object({
  cashDaySessionId: z.string().uuid(),
});

export const cashOperatorSessionIdParamsSchema = z.object({
  operatorSessionId: z.string().uuid(),
});

export const cashDaySessionByBusinessDateParamsSchema = z.object({
  businessDate: z.string().regex(localDateRegex, {
    message: "Use formato YYYY-MM-DD.",
  }),
});

export const openCashOperatorSessionBodySchema = z.object({
  operatorId: z.string().uuid(),
  openingBalance: z.coerce.number().nonnegative().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const closeCashOperatorSessionBodySchema = z.object({
  countedCashBalance: z.coerce.number(),
  notes: z.string().max(2000).nullable().optional(),
});

const cashMovementKindSchema = z.enum([
  "PAYMENT_RECEIVED",
  "CHANGE_DELIVERED",
  "CASH_SUPPLY",
  "CASH_WITHDRAWAL",
  "OTHER_IN",
  "OTHER_OUT",
]);

export const createCashMovementBodySchema = z.object({
  kind: cashMovementKindSchema,
  amount: z.coerce.number(),
  description: z.string().max(2000).nullable().optional(),
  referenceType: z.string().max(100).nullable().optional(),
  referenceId: z.string().uuid().nullable().optional(),
  occurredAt: z.coerce.date().nullable().optional(),
});

const manualPrincipalMovementKindSchema = z.enum([
  "PRINCIPAL_SUPPLY",
  "PRINCIPAL_WITHDRAWAL",
  "OTHER_IN",
  "OTHER_OUT",
]);

export const createPrincipalCashMovementBodySchema = z.object({
  kind: manualPrincipalMovementKindSchema,
  amount: z.coerce.number(),
  description: z.string().max(2000).nullable().optional(),
  referenceType: z.string().max(100).nullable().optional(),
  referenceId: z.string().uuid().nullable().optional(),
  occurredAt: z.coerce.date().nullable().optional(),
});

export const openCashOrderBodySchema = z.object({
  diningTableId: z.string().uuid().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const cashOrderIdParamsSchema = z.object({
  cashOrderId: z.string().uuid(),
});
