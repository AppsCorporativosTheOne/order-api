import { AppError } from "../../domain/errors/AppError.js";
import { CreateProductData, ProductRepository } from "../../domain/products/ProductRepository.js";

export class CreateProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(data: CreateProductData) {
    const productWithSameName = await this.productRepository.findByName(data.name);

    if (productWithSameName) {
      throw new AppError("Produto ja cadastrado com este nome.", 409, "PRODUCT_ALREADY_EXISTS");
    }

    return this.productRepository.create(data);
  }
}
