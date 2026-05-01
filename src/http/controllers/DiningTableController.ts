import { Request, Response } from "express";
import { CreateDiningTableUseCase } from "../../application/dining_tables/CreateDiningTableUseCase.js";
import { GetDiningTableUseCase } from "../../application/dining_tables/GetDiningTableUseCase.js";
import { ListDiningTablesUseCase } from "../../application/dining_tables/ListDiningTablesUseCase.js";
import {
  createDiningTableBodySchema,
  diningTableIdParamsSchema,
  listDiningTablesQuerySchema,
} from "../schemas/diningTableSchemas.js";

export class DiningTableController {
  constructor(
    private readonly createDiningTableUseCase: CreateDiningTableUseCase,
    private readonly listDiningTablesUseCase: ListDiningTablesUseCase,
    private readonly getDiningTableUseCase: GetDiningTableUseCase,
  ) {}

  create = async (request: Request, response: Response) => {
    const body = createDiningTableBodySchema.parse(request.body);
    const table = await this.createDiningTableUseCase.execute(body);

    return response.status(201).json(table);
  };

  list = async (request: Request, response: Response) => {
    const query = listDiningTablesQuerySchema.parse(request.query);

    const tables = await this.listDiningTablesUseCase.execute({
      activeOnly: query.activeOnly === "true" ? true : undefined,
    });

    return response.status(200).json(tables);
  };

  getById = async (request: Request, response: Response) => {
    const { id } = diningTableIdParamsSchema.parse(request.params);
    const table = await this.getDiningTableUseCase.execute(id);

    return response.status(200).json(table);
  };
}
