import { Request, Response } from "express";
import { AddCashOrderLineUseCase } from "../../application/cash/AddCashOrderLineUseCase.js";
import { CloseCashDaySessionUseCase } from "../../application/cash/CloseCashDaySessionUseCase.js";
import { CloseCashOperatorSessionUseCase } from "../../application/cash/CloseCashOperatorSessionUseCase.js";
import { CloseCashOrderUseCase } from "../../application/cash/CloseCashOrderUseCase.js";
import { GetCashDaySessionByBusinessDateUseCase } from "../../application/cash/GetCashDaySessionByBusinessDateUseCase.js";
import { GetCashDaySessionByIdUseCase } from "../../application/cash/GetCashDaySessionByIdUseCase.js";
import { GetCashDaySessionOverviewUseCase } from "../../application/cash/GetCashDaySessionOverviewUseCase.js";
import { GetCashOrderDetailUseCase } from "../../application/cash/GetCashOrderDetailUseCase.js";
import { GetCashOperatorSessionDetailUseCase } from "../../application/cash/GetCashOperatorSessionDetailUseCase.js";
import { ListCashOrdersForDayUseCase } from "../../application/cash/ListCashOrdersForDayUseCase.js";
import { OpenCashDaySessionUseCase } from "../../application/cash/OpenCashDaySessionUseCase.js";
import { OpenCashOperatorSessionUseCase } from "../../application/cash/OpenCashOperatorSessionUseCase.js";
import { OpenCashOrderUseCase } from "../../application/cash/OpenCashOrderUseCase.js";
import { RecordCashMovementUseCase } from "../../application/cash/RecordCashMovementUseCase.js";
import { RecordPrincipalCashMovementUseCase } from "../../application/cash/RecordPrincipalCashMovementUseCase.js";
import {
  cashDaySessionByBusinessDateParamsSchema,
  cashDaySessionIdParamsSchema,
  cashOperatorSessionIdParamsSchema,
  cashOrderIdParamsSchema,
  createCashOrderLineBodySchema,
  closeCashDaySessionBodySchema,
  closeCashOperatorSessionBodySchema,
  createCashMovementBodySchema,
  createPrincipalCashMovementBodySchema,
  openCashDaySessionBodySchema,
  openCashOperatorSessionBodySchema,
  openCashOrderBodySchema,
} from "../schemas/cashSchemas.js";

export class CashRegisterController {
  constructor(
    private readonly openCashDaySessionUseCase: OpenCashDaySessionUseCase,
    private readonly getCashDaySessionByIdUseCase: GetCashDaySessionByIdUseCase,
    private readonly getCashDaySessionByBusinessDateUseCase: GetCashDaySessionByBusinessDateUseCase,
    private readonly getCashDaySessionOverviewUseCase: GetCashDaySessionOverviewUseCase,
    private readonly closeCashDaySessionUseCase: CloseCashDaySessionUseCase,
    private readonly openCashOperatorSessionUseCase: OpenCashOperatorSessionUseCase,
    private readonly closeCashOperatorSessionUseCase: CloseCashOperatorSessionUseCase,
    private readonly recordCashMovementUseCase: RecordCashMovementUseCase,
    private readonly recordPrincipalCashMovementUseCase: RecordPrincipalCashMovementUseCase,
    private readonly getCashOperatorSessionDetailUseCase: GetCashOperatorSessionDetailUseCase,
    private readonly openCashOrderUseCase: OpenCashOrderUseCase,
    private readonly closeCashOrderUseCase: CloseCashOrderUseCase,
    private readonly listCashOrdersForDayUseCase: ListCashOrdersForDayUseCase,
    private readonly addCashOrderLineUseCase: AddCashOrderLineUseCase,
    private readonly getCashOrderDetailUseCase: GetCashOrderDetailUseCase,
  ) {}

  openCashDaySession = async (request: Request, response: Response) => {
    const body = openCashDaySessionBodySchema.parse(request.body);
    const session = await this.openCashDaySessionUseCase.execute({
      businessDate: body.businessDate,
      notes: body.notes ?? null,
      principalOpeningBalance: body.principalOpeningBalance,
    });

    return response.status(201).json(session);
  };

  overviewCashDayById = async (request: Request, response: Response) => {
    const { cashDaySessionId } = cashDaySessionIdParamsSchema.parse(request.params);

    await this.getCashDaySessionByIdUseCase.execute(cashDaySessionId);
    const overview = await this.getCashDaySessionOverviewUseCase.execute(cashDaySessionId);

    return response.status(200).json(overview);
  };

  overviewCashDayByBusinessDate = async (request: Request, response: Response) => {
    const { businessDate } = cashDaySessionByBusinessDateParamsSchema.parse(request.params);
    const daySession =
      await this.getCashDaySessionByBusinessDateUseCase.execute(businessDate);
    const overview = await this.getCashDaySessionOverviewUseCase.execute(daySession.id);

    return response.status(200).json(overview);
  };

  readCashDaySessionByBusinessDate = async (request: Request, response: Response) => {
    const { businessDate } = cashDaySessionByBusinessDateParamsSchema.parse(request.params);
    const session =
      await this.getCashDaySessionByBusinessDateUseCase.execute(businessDate);

    return response.status(200).json(session);
  };

  listOrdersForCashDay = async (request: Request, response: Response) => {
    const { cashDaySessionId } = cashDaySessionIdParamsSchema.parse(request.params);
    const orders = await this.listCashOrdersForDayUseCase.execute(cashDaySessionId);

    return response.status(200).json(orders);
  };

  recordPrincipalCashMovement = async (request: Request, response: Response) => {
    const { cashDaySessionId } = cashDaySessionIdParamsSchema.parse(request.params);
    const body = createPrincipalCashMovementBodySchema.parse(request.body);

    const movement = await this.recordPrincipalCashMovementUseCase.execute({
      cashDaySessionId,
      kind: body.kind,
      amount: body.amount,
      description: body.description ?? null,
      referenceType: body.referenceType ?? null,
      referenceId: body.referenceId ?? null,
      occurredAt: body.occurredAt ?? null,
    });

    return response.status(201).json(movement);
  };

  closeCashDaySession = async (request: Request, response: Response) => {
    const { cashDaySessionId } = cashDaySessionIdParamsSchema.parse(request.params);
    const body = closeCashDaySessionBodySchema.parse(request.body ?? {});

    const result = await this.closeCashDaySessionUseCase.execute(cashDaySessionId, {
      countedPrincipalCashBalance: body.countedPrincipalCashBalance,
      principalCloseNotes: body.principalCloseNotes ?? null,
    });

    return response.status(200).json(result);
  };

  openOperatorSession = async (request: Request, response: Response) => {
    const { cashDaySessionId } = cashDaySessionIdParamsSchema.parse(request.params);
    const body = openCashOperatorSessionBodySchema.parse(request.body);

    const drawer = await this.openCashOperatorSessionUseCase.execute({
      cashDaySessionId,
      operatorId: body.operatorId,
      openingBalance: body.openingBalance,
      notes: body.notes ?? null,
    });

    return response.status(201).json(drawer);
  };

  closeOperatorSession = async (request: Request, response: Response) => {
    const { operatorSessionId } = cashOperatorSessionIdParamsSchema.parse(request.params);
    const body = closeCashOperatorSessionBodySchema.parse(request.body);

    const result = await this.closeCashOperatorSessionUseCase.execute({
      operatorSessionId,
      countedCashBalance: body.countedCashBalance,
      notes: body.notes ?? null,
    });

    return response.status(200).json(result);
  };

  registerMovement = async (request: Request, response: Response) => {
    const { operatorSessionId } = cashOperatorSessionIdParamsSchema.parse(request.params);
    const body = createCashMovementBodySchema.parse(request.body);

    const movement = await this.recordCashMovementUseCase.execute({
      cashOperatorSessionId: operatorSessionId,
      kind: body.kind,
      amount: body.amount,
      description: body.description ?? null,
      referenceType: body.referenceType ?? null,
      referenceId: body.referenceId ?? null,
      occurredAt: body.occurredAt ?? null,
    });

    return response.status(201).json(movement);
  };

  getOperatorSessionDetail = async (request: Request, response: Response) => {
    const { operatorSessionId } = cashOperatorSessionIdParamsSchema.parse(request.params);
    const detail = await this.getCashOperatorSessionDetailUseCase.execute(operatorSessionId);

    return response.status(200).json(detail);
  };

  openCashOrder = async (request: Request, response: Response) => {
    const { operatorSessionId } = cashOperatorSessionIdParamsSchema.parse(request.params);
    const body = openCashOrderBodySchema.parse(request.body ?? {});

    const order = await this.openCashOrderUseCase.execute({
      cashOperatorSessionId: operatorSessionId,
      diningTableId: body.diningTableId ?? null,
      notes: body.notes ?? null,
    });

    return response.status(201).json(order);
  };

  closeCashOrder = async (request: Request, response: Response) => {
    const { cashOrderId } = cashOrderIdParamsSchema.parse(request.params);

    const order = await this.closeCashOrderUseCase.execute(cashOrderId);

    return response.status(200).json(order);
  };

  addCashOrderLine = async (request: Request, response: Response) => {
    const { cashOrderId } = cashOrderIdParamsSchema.parse(request.params);
    const body = createCashOrderLineBodySchema.parse(request.body);

    const line = await this.addCashOrderLineUseCase.execute(cashOrderId, {
      productId: body.productId,
      quantity: body.quantity,
      unitPrice: body.unitPrice,
      notes: body.notes ?? null,
    });

    return response.status(201).json(line);
  };

  getCashOrderDetail = async (request: Request, response: Response) => {
    const { cashOrderId } = cashOrderIdParamsSchema.parse(request.params);
    const detail = await this.getCashOrderDetailUseCase.execute(cashOrderId);

    return response.status(200).json(detail);
  };
}
