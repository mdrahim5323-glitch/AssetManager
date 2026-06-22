import { Router } from "express";
import { db } from "@workspace/db";
import { leadsTable, usersTable, auditLogsTable } from "@workspace/db";
import { eq, ilike, and, sql } from "drizzle-orm";
import {
  GetLeadsQueryParams,
  CreateLeadBody,
  UpdateLeadBody,
  UpdateLeadParams,
  DeleteLeadParams,
  GetLeadParams,
  AssignLeadBody,
  AssignLeadParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const parsed = GetLeadsQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : {};
    const companyId = (req as any).companyId ?? 1;
    const page = Number(params.page ?? 1);
    const limit = Number(params.limit ?? 20);
    const offset = (page - 1) * limit;

    const conditions = [eq(leadsTable.company_id, companyId)];
    if (params.status) conditions.push(eq(leadsTable.status, params.status));
    if (params.assigned_to) conditions.push(eq(leadsTable.assigned_to, Number(params.assigned_to)));

    const baseQuery = db
      .select({
        id: leadsTable.id,
        company_id: leadsTable.company_id,
        name: leadsTable.name,
        phone: leadsTable.phone,
        email: leadsTable.email,
        source: leadsTable.source,
        status: leadsTable.status,
        assigned_to: leadsTable.assigned_to,
        assigned_user_name: usersTable.name,
        follow_up_date: leadsTable.follow_up_date,
        notes: leadsTable.notes,
        created_at: leadsTable.created_at,
        updated_at: leadsTable.updated_at,
      })
      .from(leadsTable)
      .leftJoin(usersTable, eq(leadsTable.assigned_to, usersTable.id))
      .where(and(...conditions));

    const [rows, [{ total }]] = await Promise.all([
      baseQuery.limit(limit).offset(offset).orderBy(sql`${leadsTable.created_at} desc`),
      db.select({ total: sql<number>`count(*)::int` }).from(leadsTable).where(and(...conditions)),
    ]);

    res.json({
      data: rows.map(r => ({ ...r, created_at: r.created_at.toISOString(), updated_at: r.updated_at.toISOString() })),
      total,
      page,
      limit,
    });
  } catch (err) {
    req.log.error({ err }, "list leads error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = CreateLeadBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
    const companyId = (req as any).companyId ?? 1;
    const [lead] = await db.insert(leadsTable).values({ ...parsed.data, company_id: companyId, status: parsed.data.status ?? "New" }).returning();
    await db.insert(auditLogsTable).values({ company_id: companyId, action: "created", entity_type: "lead", entity_id: lead.id, description: `Lead "${lead.name}" created` });
    res.status(201).json({ ...lead, created_at: lead.created_at.toISOString(), updated_at: lead.updated_at.toISOString() });
  } catch (err) {
    req.log.error({ err }, "create lead error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = GetLeadParams.parse({ id: Number(req.params.id) });
    const [row] = await db
      .select({
        id: leadsTable.id,
        company_id: leadsTable.company_id,
        name: leadsTable.name,
        phone: leadsTable.phone,
        email: leadsTable.email,
        source: leadsTable.source,
        status: leadsTable.status,
        assigned_to: leadsTable.assigned_to,
        assigned_user_name: usersTable.name,
        follow_up_date: leadsTable.follow_up_date,
        notes: leadsTable.notes,
        created_at: leadsTable.created_at,
        updated_at: leadsTable.updated_at,
      })
      .from(leadsTable)
      .leftJoin(usersTable, eq(leadsTable.assigned_to, usersTable.id))
      .where(eq(leadsTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ ...row, created_at: row.created_at.toISOString(), updated_at: row.updated_at.toISOString() });
  } catch (err) {
    req.log.error({ err }, "get lead error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = UpdateLeadParams.parse({ id: Number(req.params.id) });
    const parsed = UpdateLeadBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
    const [lead] = await db.update(leadsTable).set({ ...parsed.data, updated_at: new Date() }).where(eq(leadsTable.id, id)).returning();
    if (!lead) return res.status(404).json({ error: "Not found" });
    const companyId = (req as any).companyId ?? 1;
    await db.insert(auditLogsTable).values({ company_id: companyId, action: "updated", entity_type: "lead", entity_id: lead.id, description: `Lead "${lead.name}" updated` });
    res.json({ ...lead, created_at: lead.created_at.toISOString(), updated_at: lead.updated_at.toISOString() });
  } catch (err) {
    req.log.error({ err }, "update lead error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = DeleteLeadParams.parse({ id: Number(req.params.id) });
    await db.delete(leadsTable).where(eq(leadsTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "delete lead error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/assign", async (req, res) => {
  try {
    const { id } = AssignLeadParams.parse({ id: Number(req.params.id) });
    const parsed = AssignLeadBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
    const [lead] = await db.update(leadsTable).set({ assigned_to: parsed.data.assigned_to, updated_at: new Date() }).where(eq(leadsTable.id, id)).returning();
    if (!lead) return res.status(404).json({ error: "Not found" });
    res.json({ ...lead, assigned_user_name: null, created_at: lead.created_at.toISOString(), updated_at: lead.updated_at.toISOString() });
  } catch (err) {
    req.log.error({ err }, "assign lead error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
