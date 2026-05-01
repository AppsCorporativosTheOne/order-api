import { Router } from "express";
import { CreateStockEntryUseCase } from "../../application/stocks/CreateStockEntryUseCase.js";
import { GetStockEntryUseCase } from "../../application/stocks/GetStockEntryUseCase.js";
import { ListStockEntriesUseCase } from "../../application/stocks/ListStockEntriesUseCase.js";
import { pool } from "../../infra/database/postgres.js";
import { PostgresProductRepository } from "../../infra/repositories/PostgresProductRepository.js";
import { PostgresStockEntryRepository } from "../../infra/repositories/PostgresStockEntryRepository.js";
import { StockEntryController } from "../controllers/StockEntryController.js";

const stocksRoutes = Router();
const stockEntryRepository = new PostgresStockEntryRepository(pool);
const productRepository = new PostgresProductRepository(pool);
const stockEntryController = new StockEntryController(
  new CreateStockEntryUseCase(stockEntryRepository, productRepository),
  new ListStockEntriesUseCase(stockEntryRepository),
  new GetStockEntryUseCase(stockEntryRepository),
);

stocksRoutes.post("/", stockEntryController.create);
stocksRoutes.get("/", stockEntryController.list);
stocksRoutes.get("/:id", stockEntryController.getById);

export { stocksRoutes };
