import { Router } from "express";
import { db } from "@workspace/db";
import {
  leadsTable,
  customersTable,
  propertiesTable,
  paymentsTable,
  installmentsTable,
  auditLogsTable,
  usersTable,
} from "@workspace/db";
import { eq, sql, and, gte, lt } from "drizzle-orm";

const router = Router();

router.get("/summary", async (req, res) => {
  try {
    const companyId = (req as any).companyId ?? 1;

    const [
      [leadCount],
      [customerCount],
      [propStats],
      [installStats],
      [revenueRow],
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(leadsTable).where(eq(leadsTable.company_id, companyId)),
      db.select({ count: sql<number>`count(*)::int` }).from(customersTable).where(eq(customersTable.company_id, companyId)),
      db.select({
        total: sql<number>`count(*)::int`,
        available: sql<number>`count(*) filter (where status = 'Available')::int`,
        sold: sql<number>`count(*) filter (where status = 'Sold')::int`,
        reserved: sql<number>`count(*) filter (where status = 'Reserved')::int`,
      }).from(propertiesTable).where(eq(propertiesTable.company_id, companyId)),
      db.select({
        pending: sql<number>`count(*) filter (where status = 'Pending')::int`,
        overdue: sql<number>`count(*) filter (where status = 'Overdue')::int`,
      }).from(installmentsTable).where(eq(installmentsTable.company_id, companyId)),
      db.select({ total: sql<number>`coalesce(sum(paid_amount::numeric), 0)` }).from(paymentsTable).where(eq(paymentsTable.company_id, companyId)),
    ]);

    res.json({
      total_leads: leadCount.count,
      total_customers: customerCount.count,
      total_properties: propStats.total,
      total_revenue: Number(revenueRow.total),
      available_properties: propStats.available,
      sold_properties: propStats.sold,
      reserved_properties: propStats.reserved,
      pending_installments: installStats.pending,
      overdue_installments: installStats.overdue,
      my_assigned_leads: null,
      my_follow_ups_today: null,
    });
  } catch (err) {
    req.log.error({ err }, "dashboard summary error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/lead-pipeline", async (req, res) => {
  try {
    const companyId = (req as any).companyId ?? 1;
    const rows = await db
      .select({
        status: leadsTable.status,
        count: sql<number>`count(*)::int`,
      })
      .from(leadsTable)
      .where(eq(leadsTable.company_id, companyId))
      .groupBy(leadsTable.status);

    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "lead pipeline error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/recent-activity", async (req, res) => {
  try {
    const companyId = (req as any).companyId ?? 1;
    const logs = await db
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
      .where(eq(auditLogsTable.company_id, companyId))
      .orderBy(sql`${auditLogsTable.created_at} desc`)
      .limit(10);

    res.json(logs.map(l => ({ ...l, created_at: l.created_at.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "recent activity error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/collection-summary", async (req, res) => {
  try {
    const companyId = (req as any).companyId ?? 1;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const [[totals], [monthly]] = await Promise.all([
      db.select({
        total_amount: sql<number>`coalesce(sum(total_amount::numeric), 0)`,
        total_paid: sql<number>`coalesce(sum(paid_amount::numeric), 0)`,
      }).from(paymentsTable).where(eq(paymentsTable.company_id, companyId)),
      db.select({
        collected: sql<number>`coalesce(sum(amount::numeric), 0)`,
      }).from(installmentsTable).where(
        and(
          eq(installmentsTable.company_id, companyId),
          eq(installmentsTable.status, "Paid"),
          gte(installmentsTable.paid_date, startOfMonth.slice(0, 10)),
          lt(installmentsTable.paid_date, endOfMonth.slice(0, 10))
        )
      ),
    ]);

    const total_amount = Number(totals.total_amount);
    const total_paid = Number(totals.total_paid);
    res.json({
      total_amount,
      total_paid,
      total_due: total_amount - total_paid,
      this_month_collected: Number(monthly.collected),
    });
  } catch (err) {
    req.log.error({ err }, "collection summary error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
