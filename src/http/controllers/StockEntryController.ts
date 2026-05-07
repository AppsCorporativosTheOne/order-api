import { Request, Response } from "express";
import { CreateStockEntryUseCase } from "../../application/stocks/CreateStockEntryUseCase.js";
import { GetStockEntryUseCase } from "../../application/stocks/GetStockEntryUseCase.js";
import { ListStockEntriesUseCase } from "../../application/stocks/ListStockEntriesUseCase.js";
import { UpdateStockEntryUseCase } from "../../application/stocks/UpdateStockEntryUseCase.js";
import {
  createStockEntryBodySchema,
  listStockEntriesQuerySchema,
  stockEntryIdParamsSchema,
  updateStockEntryBodySchema,
} from "../schemas/stockEntrySchemas.js";

export class StockEntryController {
  constructor(
    private readonly createStockEntryUseCase: CreateStockEntryUseCase,
    private readonly listStockEntriesUseCase: ListStockEntriesUseCase,
    private readonly getStockEntryUseCase: GetStockEntryUseCase,
    private readonly updateStockEntryUseCase: UpdateStockEntryUseCase,
  ) {}

  create = async (request: Request, response: Response) => {
    const body = createStockEntryBodySchema.parse(request.body);
    const stockEntry = await this.createStockEntryUseCase.execute(body);

    return response.status(201).json(stockEntry);
  };

  list = async (request: Request, response: Response) => {
    const query = listStockEntriesQuerySchema.parse(request.query);
    const stockEntries = await this.listStockEntriesUseCase.execute(query);

    return response.status(200).json(stockEntries);
  };

  getById = async (request: Request, response: Response) => {
    const { id } = stockEntryIdParamsSchema.parse(request.params);
    const stockEntry = await this.getStockEntryUseCase.execute(id);

    return response.status(200).json(stockEntry);
  };

  updateById = async (request: Request, response: Response) => {
    const { id } = stockEntryIdParamsSchema.parse(request.params);
    const body = updateStockEntryBodySchema.parse(request.body);
    const stockEntry = await this.updateStockEntryUseCase.execute(id, body);

    return response.status(200).json(stockEntry);
  };
}
