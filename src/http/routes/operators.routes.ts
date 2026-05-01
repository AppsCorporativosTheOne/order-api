import { Router } from "express";
import { CreateOperatorUseCase } from "../../application/operators/CreateOperatorUseCase.js";
import { GetOperatorUseCase } from "../../application/operators/GetOperatorUseCase.js";
import { ListOperatorsUseCase } from "../../application/operators/ListOperatorsUseCase.js";
import { pool } from "../../infra/database/postgres.js";
import { PostgresOperatorRepository } from "../../infra/repositories/PostgresOperatorRepository.js";
import { OperatorController } from "../controllers/OperatorController.js";

const operatorsRoutes = Router();

const operatorRepository = new PostgresOperatorRepository(pool);

const operatorController = new OperatorController(
  new CreateOperatorUseCase(operatorRepository),
  new ListOperatorsUseCase(operatorRepository),
  new GetOperatorUseCase(operatorRepository),
);

operatorsRoutes.post("/", operatorController.create);
operatorsRoutes.get("/", operatorController.list);
operatorsRoutes.get("/:id", operatorController.getById);

export { operatorsRoutes };
