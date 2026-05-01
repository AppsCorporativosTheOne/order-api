import { AppError } from "../../domain/errors/AppError.js";
import { ProductRepository } from "../../domain/products/ProductRepository.js";
import {
  CreateStockEntryData,
  StockEntryRepository,
} from "../../domain/stocks/StockEntryRepository.js";

export class CreateStockEntryUseCase {
  constructor(
    private readonly stockEntryRepository: StockEntryRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(data: CreateStockEntryData) {
    const product = await this.productRepository.findById(data.productId);

    if (!product) {
      throw new AppError("Produto nao encontrado.", 404, "PRODUCT_NOT_FOUND");
    }

    if (
      data.manufacturingDate &&
      data.expirationDate &&
      data.expirationDate < data.manufacturingDate
    ) {
      throw new AppError(
        "Data de validade nao pode ser anterior a data de fabricacao.",
        400,
        "INVALID_EXPIRATION_DATE",
      );
    }

    return this.stockEntryRepository.create(data);
  }
}
