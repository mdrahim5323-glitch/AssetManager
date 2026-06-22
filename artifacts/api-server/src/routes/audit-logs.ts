import { Router } from "express";
import { db } from "@workspace/db";
import { auditLogsTable, usersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { GetAuditLogsQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const parsed = GetAuditLogsQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : {};
    const companyId = (req as any).companyId ?? 1;
    const page = Number(params.page ?? 1);
    const limit = Number(params.limit ?? 50);
    const offset = (page - 1) * limit;

    const conditions = [eq(auditLogsTable.company_id, companyId)];
    if (params.entity_type) conditions.push(eq(auditLogsTable.entity_type, params.entity_type));

    const rows = await db
      .select({
        id: auditLogsTable.id,
        company_id: auditLogsTable.company_id,
        user_id: auditLogsTable.user_id,
        user_name: usersTable.name,
        action: auditLogsTable.action,
        entity_type: auditLogsTable.entity_type,
        entity_id: auditLogsTable.entity_id,
        description: auditLogsTable.description,
        created_at: auditLogsTable.created_at,
      })
      .from(auditLogsTable)
      .leftJoin(usersTable, eq(auditLogsTable.user_id, usersTable.id))
      .where(and(...conditions))
      .orderBy(sql`${auditLogsTable.created_at} desc`)
      .limit(limit)
      .offset(offset);

    res.json(rows.map(r => ({ ...r, created_at: r.created_at.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "list audit logs error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
