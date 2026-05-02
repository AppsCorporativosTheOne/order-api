import { env } from "./config/env.js";
import { app } from "./app.js";
import { runDevSeed } from "./infra/devSeed/runDevSeed.js";
import { pool } from "./infra/database/postgres.js";

async function bootstrap(): Promise<void> {
  if (env.USE_DEV_SEED) {
    if (env.NODE_ENV === "production") {
      console.warn("USE_DEV_SEED foi ignorado (NODE_ENV=production).");
    } else {
      await runDevSeed(pool);
    }
  }

  const server = app.listen(env.PORT, () => {
    console.log(`API running on port ${env.PORT}`);
    if (env.NODE_ENV !== "production") {
      console.log(`Swagger UI: http://localhost:${env.PORT}/docs`);
    }
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        [
          `Porta ${env.PORT} ja esta em uso.`,
          "PowerShell (substitua a porta se precisar):",
          `  Get-NetTCPConnection -LocalPort ${env.PORT} | Select-Object -ExpandProperty OwningProcess`,
          "  Stop-Process -Id <PID> -Force",
          "Ou: netstat -ano | findstr :" + env.PORT + "  ->  taskkill /PID <PID> /F",
        ].join("\n"),
      );
      process.exit(1);
    }
    throw err;
  });

  const shutdown = (signal: string) => {
    console.info(`\n${signal}: encerrando servidor e pool do Postgres...`);
    server.close(() => {
      void pool
        .end()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
