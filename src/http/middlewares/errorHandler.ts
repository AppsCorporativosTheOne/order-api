import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../domain/errors/AppError.js";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof ZodError) {
    return response.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Dados invalidos.",
      issues: error.flatten(),
    });
  }

  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      code: error.code,
      message: error.message,
    });
  }

  console.error(error);

  return response.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    message: "Erro interno do servidor.",
  });
}
