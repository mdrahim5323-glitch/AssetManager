import { Router } from "express";
import { db } from "@workspace/db";
import { paymentsTable, customersTable, propertiesTable, auditLogsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  GetPaymentsQueryParams,
  CreatePaymentBody,
  UpdatePaymentBody,
  UpdatePaymentParams,
  GetPaymentParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const parsed = GetPaymentsQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : {};
    const companyId = (req as any).companyId ?? 1;

    const conditions = [eq(paymentsTable.company_id, companyId)];
    if (params.customer_id) conditions.push(eq(paymentsTable.customer_id, Number(params.customer_id)));
    if (params.property_id) conditions.push(eq(paymentsTable.property_id, Number(params.property_id)));

    const rows = await db
      .select({
        id: paymentsTable.id,
        company_id: paymentsTable.company_id,
        customer_id: paymentsTable.customer_id,
        property_id: paymentsTable.property_id,
        customer_name: customersTable.name,
        property_name: propertiesTable.property_name,
        total_amount: paymentsTable.total_amount,
        paid_amount: paymentsTable.paid_amount,
        created_at: paymentsTable.created_at,
        updated_at: paymentsTable.updated_at,
      })
      .from(paymentsTable)
      .leftJoin(customersTable, eq(paymentsTable.customer_id, customersTable.id))
      .leftJoin(propertiesTable, eq(paymentsTable.property_id, propertiesTable.id))
      .where(and(...conditions));

    res.json(rows.map(r => ({
      ...r,
      total_amount: Number(r.total_amount),
      paid_amount: Number(r.paid_amount),
      due_amount: Number(r.total_amount) - Number(r.paid_amount),
      created_at: r.created_at.toISOString(),
      updated_at: r.updated_at.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "list payments error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = CreatePaymentBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
    const companyId = (req as any).companyId ?? 1;
    const [payment] = await db.insert(paymentsTable).values({
      ...parsed.data,
      company_id: companyId,
      total_amount: String(parsed.data.total_amount),
      paid_amount: String(parsed.data.paid_amount ?? 0),
    }).returning();
    await db.insert(auditLogsTable).values({ company_id: companyId, action: "added", entity_type: "payment", entity_id: payment.id, description: `Payment record created` });
    res.status(201).json({ ...payment, total_amount: Number(payment.total_amount), paid_amount: Number(payment.paid_amount), due_amount: Number(payment.total_amount) - Number(payment.paid_amount), customer_name: null, property_name: null, created_at: payment.created_at.toISOString(), updated_at: payment.updated_at.toISOString() });
  } catch (err) {
    req.log.error({ err }, "create payment error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = GetPaymentParams.parse({ id: Number(req.params.id) });
    const [row] = await db
      .select({
        id: paymentsTable.id,
        company_id: paymentsTable.company_id,
        customer_id: paymentsTable.customer_id,
        property_id: paymentsTable.property_id,
        customer_name: customersTable.name,
        property_name: propertiesTable.property_name,
        total_amount: paymentsTable.total_amount,
        paid_amount: paymentsTable.paid_amount,
        created_at: paymentsTable.created_at,
        updated_at: paymentsTable.updated_at,
      })
      .from(paymentsTable)
      .leftJoin(customersTable, eq(paymentsTable.customer_id, customersTable.id))
      .leftJoin(propertiesTable, eq(paymentsTable.property_id, propertiesTable.id))
      .where(eq(paymentsTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ ...row, total_amount: Number(row.total_amount), paid_amount: Number(row.paid_amount), due_amount: Number(row.total_amount) - Number(row.paid_amount), created_at: row.created_at.toISOString(), updated_at: row.updated_at.toISOString() });
  } catch (err) {
    req.log.error({ err }, "get payment error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = UpdatePaymentParams.parse({ id: Number(req.params.id) });
    const parsed = UpdatePaymentBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (parsed.data.total_amount !== undefined) updateData.total_amount = String(parsed.data.total_amount);
    if (parsed.data.paid_amount !== undefined) updateData.paid_amount = String(parsed.data.paid_amount);
    const [payment] = await db.update(paymentsTable).set(updateData).where(eq(paymentsTable.id, id)).returning();
    if (!payment) return res.status(404).json({ error: "Not found" });
    res.json({ ...payment, total_amount: Number(payment.total_amount), paid_amount: Number(payment.paid_amount), due_amount: Number(payment.total_amount) - Number(payment.paid_amount), customer_name: null, property_name: null, created_at: payment.created_at.toISOString(), updated_at: payment.updated_at.toISOString() });
  } catch (err) {
    req.log.error({ err }, "update payment error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
