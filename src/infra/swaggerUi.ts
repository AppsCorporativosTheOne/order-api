import fs from "node:fs";
import path from "node:path";
import type { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { parse } from "yaml";
import { env } from "../config/env.js";

function loadOpenApiDocument(port: number): Record<string, unknown> {
  const filePath = path.join(process.cwd(), "docs", "openapi.yaml");
  const raw = fs.readFileSync(filePath, "utf8");
  const doc = parse(raw) as Record<string, unknown>;
  doc.servers = [{ url: `http://localhost:${port}` }];
  return doc;
}

export function mountSwaggerUiIfDev(app: Express, port: number): void {
  if (env.NODE_ENV === "production") {
    return;
  }

  const openApiDocument = loadOpenApiDocument(port);
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
}
