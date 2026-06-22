import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import leadsRouter from "./leads";
import customersRouter from "./customers";
import propertiesRouter from "./properties";
import ownershipsRouter from "./ownerships";
import paymentsRouter from "./payments";
import installmentsRouter from "./installments";
import usersRouter from "./users";
import leavesRouter from "./leaves";
import documentsRouter from "./documents";
import auditLogsRouter from "./audit-logs";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/dashboard", dashboardRouter);
router.use("/leads", leadsRouter);
router.use("/customers", customersRouter);
router.use("/properties", propertiesRouter);
router.use("/ownerships", ownershipsRouter);
router.use("/payments", paymentsRouter);
router.use("/installments", installmentsRouter);
router.use("/users", usersRouter);
router.use("/leaves", leavesRouter);
router.use("/documents", documentsRouter);
router.use("/audit-logs", auditLogsRouter);

export default router;
