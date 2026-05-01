import { Router } from "express";
import { productsRoutes } from "./products.routes.js";
import { stocksRoutes } from "./stocks.routes.js";

const routes = Router();

routes.get("/health", (_request, response) => {
  return response.status(200).json({ status: "ok" });
});

routes.use("/products", productsRoutes);
routes.use("/stocks", stocksRoutes);

export { routes };
