import { Request, Response } from "express";
import { CreateProductUseCase } from "../../application/products/CreateProductUseCase.js";
import { DeleteProductUseCase } from "../../application/products/DeleteProductUseCase.js";
import { GetProductUseCase } from "../../application/products/GetProductUseCase.js";
import { ListProductsUseCase } from "../../application/products/ListProductsUseCase.js";
import { UpdateProductUseCase } from "../../application/products/UpdateProductUseCase.js";
import {
  createProductBodySchema,
  listProductsQuerySchema,
  productIdParamsSchema,
  updateProductBodySchema,
} from "../schemas/productSchemas.js";

export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly getProductUseCase: GetProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
  ) {}

  create = async (request: Request, response: Response) => {
    const body = createProductBodySchema.parse(request.body);
    const product = await this.createProductUseCase.execute(body);

    return response.status(201).json(product);
  };

  list = async (request: Request, response: Response) => {
    const query = listProductsQuerySchema.parse(request.query);

    const products = await this.listProductsUseCase.execute({
      search: query.search,
      category: query.category,
      department: query.department,
      activeOnly: query.activeOnly === "true" ? true : undefined,
      eligibleForSale: query.eligibleForSale === "true" ? true : undefined,
    });

    return response.status(200).json(products);
  };

  getById = async (request: Request, response: Response) => {
    const { id } = productIdParamsSchema.parse(request.params);
    const product = await this.getProductUseCase.execute(id);

    return response.status(200).json(product);
  };

  updateById = async (request: Request, response: Response) => {
    const { id } = productIdParamsSchema.parse(request.params);
    const body = updateProductBodySchema.parse(request.body);
    const product = await this.updateProductUseCase.execute(id, body);

    return response.status(200).json(product);
  };

  deleteById = async (request: Request, response: Response) => {
    const { id } = productIdParamsSchema.parse(request.params);
    await this.deleteProductUseCase.execute(id);

    return response.status(204).send();
  };
}
