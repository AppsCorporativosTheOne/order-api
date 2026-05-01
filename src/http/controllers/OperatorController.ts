import { Request, Response } from "express";
import { CreateOperatorUseCase } from "../../application/operators/CreateOperatorUseCase.js";
import { GetOperatorUseCase } from "../../application/operators/GetOperatorUseCase.js";
import { ListOperatorsUseCase } from "../../application/operators/ListOperatorsUseCase.js";
import {
  createOperatorBodySchema,
  listOperatorsQuerySchema,
  operatorIdParamsSchema,
} from "../schemas/operatorSchemas.js";

export class OperatorController {
  constructor(
    private readonly createOperatorUseCase: CreateOperatorUseCase,
    private readonly listOperatorsUseCase: ListOperatorsUseCase,
    private readonly getOperatorUseCase: GetOperatorUseCase,
  ) {}

  create = async (request: Request, response: Response) => {
    const body = createOperatorBodySchema.parse(request.body);
    const code = body.code === "" ? null : body.code ?? null;
    const operator = await this.createOperatorUseCase.execute({
      name: body.name,
      code,
    });

    return response.status(201).json(operator);
  };

  list = async (request: Request, response: Response) => {
    const query = listOperatorsQuerySchema.parse(request.query);
    const operators = await this.listOperatorsUseCase.execute({
      activeOnly: query.activeOnly === "true" ? true : undefined,
    });

    return response.status(200).json(operators);
  };

  getById = async (request: Request, response: Response) => {
    const { id } = operatorIdParamsSchema.parse(request.params);
    const operator = await this.getOperatorUseCase.execute(id);

    return response.status(200).json(operator);
  };
}
