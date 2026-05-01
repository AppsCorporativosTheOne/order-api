import { Router } from "express";
import { CloseCashDaySessionUseCase } from "../../application/cash/CloseCashDaySessionUseCase.js";
import { CloseCashOperatorSessionUseCase } from "../../application/cash/CloseCashOperatorSessionUseCase.js";
import { CloseCashOrderUseCase } from "../../application/cash/CloseCashOrderUseCase.js";
import { GetCashDaySessionByBusinessDateUseCase } from "../../application/cash/GetCashDaySessionByBusinessDateUseCase.js";
import { GetCashDaySessionByIdUseCase } from "../../application/cash/GetCashDaySessionByIdUseCase.js";
import { GetCashDaySessionOverviewUseCase } from "../../application/cash/GetCashDaySessionOverviewUseCase.js";
import { GetCashOperatorSessionDetailUseCase } from "../../application/cash/GetCashOperatorSessionDetailUseCase.js";
import { ListCashOrdersForDayUseCase } from "../../application/cash/ListCashOrdersForDayUseCase.js";
import { OpenCashDaySessionUseCase } from "../../application/cash/OpenCashDaySessionUseCase.js";
import { OpenCashOperatorSessionUseCase } from "../../application/cash/OpenCashOperatorSessionUseCase.js";
import { OpenCashOrderUseCase } from "../../application/cash/OpenCashOrderUseCase.js";
import { RecordCashMovementUseCase } from "../../application/cash/RecordCashMovementUseCase.js";
import { RecordPrincipalCashMovementUseCase } from "../../application/cash/RecordPrincipalCashMovementUseCase.js";
import { pool } from "../../infra/database/postgres.js";
import { PostgresCashDaySessionRepository } from "../../infra/repositories/PostgresCashDaySessionRepository.js";
import { PostgresCashMovementRepository } from "../../infra/repositories/PostgresCashMovementRepository.js";
import { PostgresCashOperatorSessionRepository } from "../../infra/repositories/PostgresCashOperatorSessionRepository.js";
import { PostgresCashOrderRepository } from "../../infra/repositories/PostgresCashOrderRepository.js";
import { PostgresCashPrincipalMovementRepository } from "../../infra/repositories/PostgresCashPrincipalMovementRepository.js";
import { PostgresDiningTableRepository } from "../../infra/repositories/PostgresDiningTableRepository.js";
import { PostgresOperatorRepository } from "../../infra/repositories/PostgresOperatorRepository.js";
import { CashRegisterController } from "../controllers/CashRegisterController.js";

const cashRoutes = Router();

const cashDaySessionRepository = new PostgresCashDaySessionRepository(pool);
const cashOperatorSessionRepository = new PostgresCashOperatorSessionRepository(pool);
const cashMovementRepository = new PostgresCashMovementRepository(pool);
const cashPrincipalMovementRepository = new PostgresCashPrincipalMovementRepository(pool);
const cashOrderRepository = new PostgresCashOrderRepository(pool);
const diningTableRepository = new PostgresDiningTableRepository(pool);
const operatorRepository = new PostgresOperatorRepository(pool);

const cashRegisterController = new CashRegisterController(
  new OpenCashDaySessionUseCase(cashDaySessionRepository),
  new GetCashDaySessionByIdUseCase(cashDaySessionRepository),
  new GetCashDaySessionByBusinessDateUseCase(cashDaySessionRepository),
  new GetCashDaySessionOverviewUseCase(
    cashDaySessionRepository,
    cashOperatorSessionRepository,
    cashMovementRepository,
    cashPrincipalMovementRepository,
    operatorRepository,
  ),
  new CloseCashDaySessionUseCase(
    cashDaySessionRepository,
    cashOperatorSessionRepository,
    cashPrincipalMovementRepository,
  ),
  new OpenCashOperatorSessionUseCase(
    cashDaySessionRepository,
    cashOperatorSessionRepository,
    operatorRepository,
  ),
  new CloseCashOperatorSessionUseCase(
    pool,
    cashDaySessionRepository,
    cashOperatorSessionRepository,
    cashMovementRepository,
    cashOrderRepository,
    cashPrincipalMovementRepository,
  ),
  new RecordCashMovementUseCase(
    cashDaySessionRepository,
    cashOperatorSessionRepository,
    cashMovementRepository,
  ),
  new RecordPrincipalCashMovementUseCase(
    cashDaySessionRepository,
    cashPrincipalMovementRepository,
  ),
  new GetCashOperatorSessionDetailUseCase(
    cashOperatorSessionRepository,
    cashMovementRepository,
    operatorRepository,
  ),
  new OpenCashOrderUseCase(
    cashDaySessionRepository,
    cashOperatorSessionRepository,
    cashOrderRepository,
    diningTableRepository,
  ),
  new CloseCashOrderUseCase(cashDaySessionRepository, cashOrderRepository),
  new ListCashOrdersForDayUseCase(cashDaySessionRepository, cashOrderRepository),
);

cashRoutes.post("/day-sessions", cashRegisterController.openCashDaySession);

cashRoutes.get(
  "/day-sessions/dates/:businessDate/session",
  cashRegisterController.readCashDaySessionByBusinessDate,
);

cashRoutes.get(
  "/day-sessions/dates/:businessDate/overview",
  cashRegisterController.overviewCashDayByBusinessDate,
);

cashRoutes.get("/day-sessions/:cashDaySessionId/overview", cashRegisterController.overviewCashDayById);

cashRoutes.get("/day-sessions/:cashDaySessionId/orders", cashRegisterController.listOrdersForCashDay);

cashRoutes.post(
  "/day-sessions/:cashDaySessionId/principal-movements",
  cashRegisterController.recordPrincipalCashMovement,
);

cashRoutes.patch("/day-sessions/:cashDaySessionId/close", cashRegisterController.closeCashDaySession);

cashRoutes.post(
  "/day-sessions/:cashDaySessionId/operator-sessions",
  cashRegisterController.openOperatorSession,
);

cashRoutes.post(
  "/operator-sessions/:operatorSessionId/orders",
  cashRegisterController.openCashOrder,
);

cashRoutes.patch(
  "/operator-sessions/:operatorSessionId/close",
  cashRegisterController.closeOperatorSession,
);

cashRoutes.post(
  "/operator-sessions/:operatorSessionId/movements",
  cashRegisterController.registerMovement,
);

cashRoutes.get(
  "/operator-sessions/:operatorSessionId/detail",
  cashRegisterController.getOperatorSessionDetail,
);

cashRoutes.patch("/orders/:cashOrderId/close", cashRegisterController.closeCashOrder);

export { cashRoutes };
