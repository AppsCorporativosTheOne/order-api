import { Request, Response } from "express";
import { CreateStockEntryUseCase } from "../../application/stocks/CreateStockEntryUseCase.js";
import { GetStockEntryUseCase } from "../../application/stocks/GetStockEntryUseCase.js";
import { ListStockEntriesUseCase } from "../../application/stocks/ListStockEntriesUseCase.js";
import {
  createStockEntryBodySchema,
  listStockEntriesQuerySchema,
  stockEntryIdParamsSchema,
} from "../schemas/stockEntrySchemas.js";

export class StockEntryController {
  constructor(
    private readonly createStockEntryUseCase: CreateStockEntryUseCase,
    private readonly listStockEntriesUseCase: ListStockEntriesUseCase,
    private readonly getStockEntryUseCase: GetStockEntryUseCase,
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
}
