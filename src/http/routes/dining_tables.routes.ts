import { Router } from "express";
import { CreateDiningTableUseCase } from "../../application/dining_tables/CreateDiningTableUseCase.js";
import { GetDiningTableUseCase } from "../../application/dining_tables/GetDiningTableUseCase.js";
import { ListDiningTablesUseCase } from "../../application/dining_tables/ListDiningTablesUseCase.js";
import { pool } from "../../infra/database/postgres.js";
import { PostgresDiningTableRepository } from "../../infra/repositories/PostgresDiningTableRepository.js";
import { DiningTableController } from "../controllers/DiningTableController.js";

const diningTablesRoutes = Router();

const diningTableRepository = new PostgresDiningTableRepository(pool);

const diningTableController = new DiningTableController(
  new CreateDiningTableUseCase(diningTableRepository),
  new ListDiningTablesUseCase(diningTableRepository),
  new GetDiningTableUseCase(diningTableRepository),
);

diningTablesRoutes.post("/", diningTableController.create);
diningTablesRoutes.get("/", diningTableController.list);
diningTablesRoutes.get("/:id", diningTableController.getById);

export { diningTablesRoutes };
