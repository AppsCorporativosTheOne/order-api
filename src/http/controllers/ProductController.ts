import { Request, Response } from "express";
import { CreateProductUseCase } from "../../application/products/CreateProductUseCase.js";
import { GetProductUseCase } from "../../application/products/GetProductUseCase.js";
import { ListProductsUseCase } from "../../application/products/ListProductsUseCase.js";
import {
  createProductBodySchema,
  listProductsQuerySchema,
  productIdParamsSchema,
} from "../schemas/productSchemas.js";

export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly getProductUseCase: GetProductUseCase,
  ) {}

  create = async (request: Request, response: Response) => {
    const body = createProductBodySchema.parse(request.body);
    const product = await this.createProductUseCase.execute(body);

    return response.status(201).json(product);
  };

  list = async (request: Request, response: Response) => {
    const query = listProductsQuerySchema.parse(request.query);
    const products = await this.listProductsUseCase.execute(query);

    return response.status(200).json(products);
  };

  getById = async (request: Request, response: Response) => {
    const { id } = productIdParamsSchema.parse(request.params);
    const product = await this.getProductUseCase.execute(id);

    return response.status(200).json(product);
  };
}
