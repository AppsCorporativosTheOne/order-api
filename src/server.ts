import { env } from "./config/env.js";
import { app } from "./app.js";

const server = app.listen(env.PORT, () => {
  console.log(`API running on port ${env.PORT}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Porta ${env.PORT} ja esta em uso (outro processo Node ou outra app). Encerre com taskkill /PID <pid> /F ou mude PORT no .env.`,
    );
    process.exit(1);
  }
  throw err;
});
