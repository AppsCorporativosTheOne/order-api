import { Router } from "express";
import { CreateProductUseCase } from "../../application/products/CreateProductUseCase.js";
import { GetProductUseCase } from "../../application/products/GetProductUseCase.js";
import { ListProductsUseCase } from "../../application/products/ListProductsUseCase.js";
import { pool } from "../../infra/database/postgres.js";
import { PostgresProductRepository } from "../../infra/repositories/PostgresProductRepository.js";
import { ProductController } from "../controllers/ProductController.js";

const productsRoutes = Router();
const productRepository = new PostgresProductRepository(pool);
const productController = new ProductController(
  new CreateProductUseCase(productRepository),
  new ListProductsUseCase(productRepository),
  new GetProductUseCase(productRepository),
);

productsRoutes.post("/", productController.create);
productsRoutes.get("/", productController.list);
productsRoutes.get("/:id", productController.getById);

export { productsRoutes };
