import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler } from "./http/middlewares/errorHandler.js";
import { routes } from "./http/routes/index.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(routes);
app.use(errorHandler);
