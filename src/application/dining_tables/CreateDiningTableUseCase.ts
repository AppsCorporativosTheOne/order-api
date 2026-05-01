import { AppError } from "../../domain/errors/AppError.js";
import { DiningTableRepository } from "../../domain/cash/DiningTableRepository.js";

function isUniqueViolation(cause: unknown): boolean {
  return (
    typeof cause === "object" &&
    cause !== null &&
    "code" in cause &&
    (cause as { code: unknown }).code === "23505"
  );
}

export class CreateDiningTableUseCase {
  constructor(private readonly diningTableRepository: DiningTableRepository) {}

  async execute(data: { name: string; sortOrder?: number }) {
    const normalized = data.name.trim();

    if (!normalized.length) {
      throw new AppError(
        "Informe uma descricao valida para a mesa.",
        400,
        "INVALID_TABLE_NAME",
      );
    }

    try {
      return await this.diningTableRepository.create({
        name: normalized,
        sortOrder: data.sortOrder,
      });
    } catch (cause: unknown) {
      if (isUniqueViolation(cause)) {
        throw new AppError(
          "Ja existe mesa com este nome cadastrado.",
          409,
          "DINING_TABLE_ALREADY_EXISTS",
        );
      }

      throw cause;
    }
  }
}
