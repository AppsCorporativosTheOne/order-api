import { ListProductsFilters, ProductRepository } from "../../domain/products/ProductRepository.js";

export class ListProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(filters: ListProductsFilters) {
    return this.productRepository.list(filters);
  }
}
