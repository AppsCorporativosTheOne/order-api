import { Router } from "express";
import { cashRoutes } from "./cash.routes.js";
import { diningTablesRoutes } from "./dining_tables.routes.js";
import { operatorsRoutes } from "./operators.routes.js";
import { productsRoutes } from "./products.routes.js";
import { stocksRoutes } from "./stocks.routes.js";

const routes = Router();

routes.get("/health", (_request, response) => {
  return response.status(200).json({ status: "ok" });
});

routes.use("/operators", operatorsRoutes);
routes.use("/cash", cashRoutes);
routes.use("/dining-tables", diningTablesRoutes);
routes.use("/products", productsRoutes);
routes.use("/stocks", stocksRoutes);

export { routes };
