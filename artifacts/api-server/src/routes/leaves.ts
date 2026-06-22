import { Router } from "express";
import { db } from "@workspace/db";
import { leaveRequestsTable, usersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  GetLeaveRequestsQueryParams,
  CreateLeaveRequestBody,
  UpdateLeaveRequestBody,
  UpdateLeaveRequestParams,
  GetLeaveRequestParams,
} from "@workspace/api-zod";

const router = Router();

function formatLeave(r: any) {
  return {
    ...r,
    created_at: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    updated_at: r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at,
  };
}

router.get("/", async (req, res) => {
  try {
    const parsed = GetLeaveRequestsQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : {};
    const companyId = (req as any).companyId ?? 1;

    const conditions = [eq(leaveRequestsTable.company_id, companyId)];
    if (params.status) conditions.push(eq(leaveRequestsTable.status, params.status));
    if (params.user_id) conditions.push(eq(leaveRequestsTable.user_id, Number(params.user_id)));

    const rows = await db
      .select({
        id: leaveRequestsTable.id,
        company_id: leaveRequestsTable.company_id,
        user_id: leaveRequestsTable.user_id,
        user_name: usersTable.name,
        leave_type: leaveRequestsTable.leave_type,
        start_date: leaveRequestsTable.start_date,
        end_date: leaveRequestsTable.end_date,
        reason: leaveRequestsTable.reason,
        status: leaveRequestsTable.status,
        reviewed_by: leaveRequestsTable.reviewed_by,
        reviewed_at: leaveRequestsTable.reviewed_at,
        created_at: leaveRequestsTable.created_at,
        updated_at: leaveRequestsTable.updated_at,
      })
      .from(leaveRequestsTable)
      .leftJoin(usersTable, eq(leaveRequestsTable.user_id, usersTable.id))
      .where(and(...conditions))
      .orderBy(sql`${leaveRequestsTable.created_at} desc`);

    res.json(rows.map(formatLeave));
  } catch (err) {
    req.log.error({ err }, "list leave requests error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = CreateLeaveRequestBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
    const companyId = (req as any).companyId ?? 1;
    const userId = (req as any).userId ?? 1;
    const [leave] = await db.insert(leaveRequestsTable).values({
      ...parsed.data,
      company_id: companyId,
      user_id: userId,
      status: "Pending",
    }).returning();
    res.status(201).json(formatLeave({ ...leave, user_name: null }));
  } catch (err) {
    req.log.error({ err }, "create leave request error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = GetLeaveRequestParams.parse({ id: Number(req.params.id) });
    const [row] = await db
      .select({
        id: leaveRequestsTable.id,
        company_id: leaveRequestsTable.company_id,
        user_id: leaveRequestsTable.user_id,
        user_name: usersTable.name,
        leave_type: leaveRequestsTable.leave_type,
        start_date: leaveRequestsTable.start_date,
        end_date: leaveRequestsTable.end_date,
        reason: leaveRequestsTable.reason,
        status: leaveRequestsTable.status,
        reviewed_by: leaveRequestsTable.reviewed_by,
        reviewed_at: leaveRequestsTable.reviewed_at,
        created_at: leaveRequestsTable.created_at,
        updated_at: leaveRequestsTable.updated_at,
      })
      .from(leaveRequestsTable)
      .leftJoin(usersTable, eq(leaveRequestsTable.user_id, usersTable.id))
      .where(eq(leaveRequestsTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(formatLeave(row));
  } catch (err) {
    req.log.error({ err }, "get leave request error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = UpdateLeaveRequestParams.parse({ id: Number(req.params.id) });
    const parsed = UpdateLeaveRequestBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
    const updateData: Record<string, unknown> = { ...parsed.data, updated_at: new Date() };
    if (parsed.data.status && parsed.data.status !== "Pending") {
      updateData.reviewed_at = new Date().toISOString().slice(0, 10);
    }
    const [leave] = await db.update(leaveRequestsTable).set(updateData).where(eq(leaveRequestsTable.id, id)).returning();
    if (!leave) return res.status(404).json({ error: "Not found" });
    res.json(formatLeave({ ...leave, user_name: null }));
  } catch (err) {
    req.log.error({ err }, "update leave request error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
