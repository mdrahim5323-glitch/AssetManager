import { Router } from "express";
import { db } from "@workspace/db";
import { customersTable, auditLogsTable } from "@workspace/db";
import { eq, ilike, and, sql } from "drizzle-orm";
import {
  GetCustomersQueryParams,
  CreateCustomerBody,
  UpdateCustomerBody,
  UpdateCustomerParams,
  DeleteCustomerParams,
  GetCustomerParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const parsed = GetCustomersQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : {};
    const companyId = (req as any).companyId ?? 1;
    const page = Number(params.page ?? 1);
    const limit = Number(params.limit ?? 20);
    const offset = (page - 1) * limit;

    const conditions = [eq(customersTable.company_id, companyId)];
    if (params.search) conditions.push(ilike(customersTable.name, `%${params.search}%`));

    const [rows, [{ total }]] = await Promise.all([
      db.select().from(customersTable).where(and(...conditions)).limit(limit).offset(offset).orderBy(sql`${customersTable.created_at} desc`),
      db.select({ total: sql<number>`count(*)::int` }).from(customersTable).where(and(...conditions)),
    ]);

    res.json({
      data: rows.map(r => ({ ...r, created_at: r.created_at.toISOString(), updated_at: r.updated_at.toISOString() })),
      total,
      page,
      limit,
    });
  } catch (err) {
    req.log.error({ err }, "list customers error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = CreateCustomerBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
    const companyId = (req as any).companyId ?? 1;
    const [customer] = await db.insert(customersTable).values({ ...parsed.data, company_id: companyId }).returning();
    await db.insert(auditLogsTable).values({ company_id: companyId, action: "created", entity_type: "customer", entity_id: customer.id, description: `Customer "${customer.name}" created` });
    res.status(201).json({ ...customer, created_at: customer.created_at.toISOString(), updated_at: customer.updated_at.toISOString() });
  } catch (err) {
    req.log.error({ err }, "create customer error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = GetCustomerParams.parse({ id: Number(req.params.id) });
    const [row] = await db.select().from(customersTable).where(eq(customersTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ ...row, created_at: row.created_at.toISOString(), updated_at: row.updated_at.toISOString() });
  } catch (err) {
    req.log.error({ err }, "get customer error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = UpdateCustomerParams.parse({ id: Number(req.params.id) });
    const parsed = UpdateCustomerBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
    const [customer] = await db.update(customersTable).set({ ...parsed.data, updated_at: new Date() }).where(eq(customersTable.id, id)).returning();
    if (!customer) return res.status(404).json({ error: "Not found" });
    res.json({ ...customer, created_at: customer.created_at.toISOString(), updated_at: customer.updated_at.toISOString() });
  } catch (err) {
    req.log.error({ err }, "update customer error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = DeleteCustomerParams.parse({ id: Number(req.params.id) });
    await db.delete(customersTable).where(eq(customersTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "delete customer error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
