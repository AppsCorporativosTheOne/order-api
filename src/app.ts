import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./http/middlewares/errorHandler.js";
import { routes } from "./http/routes/index.js";
import { mountSwaggerUiIfDev } from "./infra/swaggerUi.js";

export const app = express();

app.use(
  helmet(
    env.NODE_ENV === "production"
      ? {}
      : {
          contentSecurityPolicy: false,
        },
  ),
);
app.use(cors());
app.use(express.json());
mountSwaggerUiIfDev(app, env.PORT);
app.use(routes);
app.use(errorHandler);
