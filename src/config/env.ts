import dotenv from "dotenv";
import { z } from "zod";

// Sobrescreve variáveis já definidas no SO (ex.: PORT=5432) para o .env local prevalecer.
dotenv.config({ override: true });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(3333)
    .refine((p) => p !== 5432, {
      message:
        "PORT nao pode ser 5432 (porta do PostgreSQL). Defina a porta HTTP da API (ex.: 3333); o banco fica em DATABASE_URL.",
    }),
  DATABASE_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
