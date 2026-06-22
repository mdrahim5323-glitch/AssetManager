import { Router } from "express";
import { db } from "@workspace/db";
import { installmentsTable, paymentsTable, customersTable, propertiesTable, auditLogsTable } from "@workspace/db";
import { eq, and, lte, sql } from "drizzle-orm";
import {
  GetInstallmentsQueryParams,
  CreateInstallmentBody,
  UpdateInstallmentBody,
  UpdateInstallmentParams,
  GetInstallmentParams,
  GetUpcomingInstallmentsQueryParams,
} from "@workspace/api-zod";

const router = Router();

function formatInstallment(r: any) {
  return {
    ...r,
    amount: Number(r.amount),
    created_at: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    updated_at: r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at,
  };
}

router.get("/upcoming", async (req, res) => {
  try {
    const parsed = GetUpcomingInstallmentsQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : {};
    const companyId = (req as any).companyId ?? 1;

    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const dateStr = thirtyDaysLater.toISOString().slice(0, 10);

    const conditions = [
      eq(installmentsTable.company_id, companyId),
      eq(installmentsTable.status, "Pending"),
      lte(installmentsTable.due_date, dateStr),
    ];
    if (params.customer_id) {
      conditions.push(eq(paymentsTable.customer_id, Number(params.customer_id)));
    }

    const rows = await db
      .select({
        id: installmentsTable.id,
        payment_id: installmentsTable.payment_id,
        company_id: installmentsTable.company_id,
        installment_no: installmentsTable.installment_no,
        amount: installmentsTable.amount,
        due_date: installmentsTable.due_date,
        paid_date: installmentsTable.paid_date,
        status: installmentsTable.status,
        customer_name: customersTable.name,
        property_name: propertiesTable.property_name,
        created_at: installmentsTable.created_at,
        updated_at: installmentsTable.updated_at,
      })
      .from(installmentsTable)
      .leftJoin(paymentsTable, eq(installmentsTable.payment_id, paymentsTable.id))
      .leftJoin(customersTable, eq(paymentsTable.customer_id, customersTable.id))
      .leftJoin(propertiesTable, eq(paymentsTable.property_id, propertiesTable.id))
      .where(and(...conditions))
      .orderBy(installmentsTable.due_date);

    res.json(rows.map(formatInstallment));
  } catch (err) {
    req.log.error({ err }, "upcoming installments error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const parsed = GetInstallmentsQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : {};
    const companyId = (req as any).companyId ?? 1;

    const conditions = [eq(installmentsTable.company_id, companyId)];
    if (params.payment_id) conditions.push(eq(installmentsTable.payment_id, Number(params.payment_id)));
    if (params.status) conditions.push(eq(installmentsTable.status, params.status));

    const rows = await db
      .select({
        id: installmentsTable.id,
        payment_id: installmentsTable.payment_id,
        company_id: installmentsTable.company_id,
        installment_no: installmentsTable.installment_no,
        amount: installmentsTable.amount,
        due_date: installmentsTable.due_date,
        paid_date: installmentsTable.paid_date,
        status: installmentsTable.status,
        customer_name: customersTable.name,
        property_name: propertiesTable.property_name,
        created_at: installmentsTable.created_at,
        updated_at: installmentsTable.updated_at,
      })
      .from(installmentsTable)
      .leftJoin(paymentsTable, eq(installmentsTable.payment_id, paymentsTable.id))
      .leftJoin(customersTable, eq(paymentsTable.customer_id, customersTable.id))
      .leftJoin(propertiesTable, eq(paymentsTable.property_id, propertiesTable.id))
      .where(and(...conditions))
      .orderBy(installmentsTable.due_date);

    res.json(rows.map(formatInstallment));
  } catch (err) {
    req.log.error({ err }, "list installments error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = CreateInstallmentBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
    const companyId = (req as any).companyId ?? 1;
    const [installment] = await db.insert(installmentsTable).values({
      ...parsed.data,
      company_id: companyId,
      amount: String(parsed.data.amount),
      status: parsed.data.status ?? "Pending",
    }).returning();
    res.status(201).json(formatInstallment({ ...installment, customer_name: null, property_name: null }));
  } catch (err) {
    req.log.error({ err }, "create installment error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = GetInstallmentParams.parse({ id: Number(req.params.id) });
    const [row] = await db
      .select({
        id: installmentsTable.id,
        payment_id: installmentsTable.payment_id,
        company_id: installmentsTable.company_id,
        installment_no: installmentsTable.installment_no,
        amount: installmentsTable.amount,
        due_date: installmentsTable.due_date,
        paid_date: installmentsTable.paid_date,
        status: installmentsTable.status,
        customer_name: customersTable.name,
        property_name: propertiesTable.property_name,
        created_at: installmentsTable.created_at,
        updated_at: installmentsTable.updated_at,
      })
      .from(installmentsTable)
      .leftJoin(paymentsTable, eq(installmentsTable.payment_id, paymentsTable.id))
      .leftJoin(customersTable, eq(paymentsTable.customer_id, customersTable.id))
      .leftJoin(propertiesTable, eq(paymentsTable.property_id, propertiesTable.id))
      .where(eq(installmentsTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(formatInstallment(row));
  } catch (err) {
    req.log.error({ err }, "get installment error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = UpdateInstallmentParams.parse({ id: Number(req.params.id) });
    const parsed = UpdateInstallmentBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
    const updateData: Record<string, unknown> = { ...parsed.data, updated_at: new Date() };
    if (parsed.data.amount !== undefined) updateData.amount = String(parsed.data.amount);
    const [installment] = await db.update(installmentsTable).set(updateData).where(eq(installmentsTable.id, id)).returning();
    if (!installment) return res.status(404).json({ error: "Not found" });
    const companyId = (req as any).companyId ?? 1;
    if (parsed.data.status === "Paid") {
      await db.insert(auditLogsTable).values({ company_id: companyId, action: "paid", entity_type: "installment", entity_id: installment.id, description: `Installment #${installment.installment_no} marked as paid` });
    }
    res.json(formatInstallment({ ...installment, customer_name: null, property_name: null }));
  } catch (err) {
    req.log.error({ err }, "update installment error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
