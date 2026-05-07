import { AppError } from "../../domain/errors/AppError.js";
import { ProductRepository } from "../../domain/products/ProductRepository.js";
import {
  StockEntryRepository,
  UpdateStockEntryData,
} from "../../domain/stocks/StockEntryRepository.js";

export class UpdateStockEntryUseCase {
  constructor(
    private readonly stockEntryRepository: StockEntryRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(id: string, data: UpdateStockEntryData) {
    if (!Object.keys(data).length) {
      throw new AppError(
        "Informe ao menos um campo para atualizar.",
        400,
        "STOCK_ENTRY_UPDATE_EMPTY_BODY",
      );
    }

    const entry = await this.stockEntryRepository.findById(id);

    if (!entry) {
      throw new AppError("Entrada no estoque nao encontrada.", 404, "STOCK_ENTRY_NOT_FOUND");
    }

    const effectiveProductId = data.productId ?? entry.productId;

    const product = await this.productRepository.findById(effectiveProductId);

    if (!product) {
      throw new AppError("Produto nao encontrado.", 404, "PRODUCT_NOT_FOUND");
    }

    const manufacturingDate =
      data.manufacturingDate !== undefined ? data.manufacturingDate : entry.manufacturingDate;

    const expirationDate =
      data.expirationDate !== undefined ? data.expirationDate : entry.expirationDate;

    if (
      manufacturingDate &&
      expirationDate &&
      expirationDate < manufacturingDate
    ) {
      throw new AppError(
        "Data de validade nao pode ser anterior a data de fabricacao.",
        400,
        "INVALID_EXPIRATION_DATE",
      );
    }

    const updated = await this.stockEntryRepository.update(id, data);

    if (!updated) {
      throw new AppError("Entrada no estoque nao encontrada.", 404, "STOCK_ENTRY_NOT_FOUND");
    }

    return updated;
  }
}
