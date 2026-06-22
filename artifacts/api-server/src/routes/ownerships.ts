import { Router } from "express";
import { db } from "@workspace/db";
import { ownershipsTable, customersTable, propertiesTable, auditLogsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  GetOwnershipsQueryParams,
  CreateOwnershipBody,
  UpdateOwnershipBody,
  UpdateOwnershipParams,
  GetOwnershipParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const parsed = GetOwnershipsQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : {};
    const companyId = (req as any).companyId ?? 1;

    const conditions = [eq(ownershipsTable.company_id, companyId)];
    if (params.customer_id) conditions.push(eq(ownershipsTable.customer_id, Number(params.customer_id)));
    if (params.property_id) conditions.push(eq(ownershipsTable.property_id, Number(params.property_id)));

    const rows = await db
      .select({
        id: ownershipsTable.id,
        company_id: ownershipsTable.company_id,
        customer_id: ownershipsTable.customer_id,
        property_id: ownershipsTable.property_id,
        customer_name: customersTable.name,
        property_name: propertiesTable.property_name,
        project_name: propertiesTable.project_name,
        purchase_price: ownershipsTable.purchase_price,
        purchase_date: ownershipsTable.purchase_date,
        ownership_type: ownershipsTable.ownership_type,
        created_at: ownershipsTable.created_at,
      })
      .from(ownershipsTable)
      .leftJoin(customersTable, eq(ownershipsTable.customer_id, customersTable.id))
      .leftJoin(propertiesTable, eq(ownershipsTable.property_id, propertiesTable.id))
      .where(and(...conditions));

    res.json(rows.map(r => ({ ...r, purchase_price: Number(r.purchase_price), created_at: r.created_at.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "list ownerships error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = CreateOwnershipBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
    const companyId = (req as any).companyId ?? 1;
    const [ownership] = await db.insert(ownershipsTable).values({
      ...parsed.data,
      company_id: companyId,
      purchase_price: String(parsed.data.purchase_price),
    }).returning();
    await db.update(propertiesTable).set({ status: "Sold", updated_at: new Date() }).where(eq(propertiesTable.id, parsed.data.property_id));
    await db.insert(auditLogsTable).values({ company_id: companyId, action: "assigned", entity_type: "property", entity_id: ownership.property_id, description: `Property assigned to customer` });
    res.status(201).json({ ...ownership, purchase_price: Number(ownership.purchase_price), customer_name: null, property_name: null, project_name: null, created_at: ownership.created_at.toISOString() });
  } catch (err) {
    req.log.error({ err }, "create ownership error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = GetOwnershipParams.parse({ id: Number(req.params.id) });
    const [row] = await db
      .select({
        id: ownershipsTable.id,
        company_id: ownershipsTable.company_id,
        customer_id: ownershipsTable.customer_id,
        property_id: ownershipsTable.property_id,
        customer_name: customersTable.name,
        property_name: propertiesTable.property_name,
        project_name: propertiesTable.project_name,
        purchase_price: ownershipsTable.purchase_price,
        purchase_date: ownershipsTable.purchase_date,
        ownership_type: ownershipsTable.ownership_type,
        created_at: ownershipsTable.created_at,
      })
      .from(ownershipsTable)
      .leftJoin(customersTable, eq(ownershipsTable.customer_id, customersTable.id))
      .leftJoin(propertiesTable, eq(ownershipsTable.property_id, propertiesTable.id))
      .where(eq(ownershipsTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ ...row, purchase_price: Number(row.purchase_price), created_at: row.created_at.toISOString() });
  } catch (err) {
    req.log.error({ err }, "get ownership error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = UpdateOwnershipParams.parse({ id: Number(req.params.id) });
    const parsed = UpdateOwnershipBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
    const updateData: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.purchase_price !== undefined) updateData.purchase_price = String(parsed.data.purchase_price);
    const [ownership] = await db.update(ownershipsTable).set(updateData).where(eq(ownershipsTable.id, id)).returning();
    if (!ownership) return res.status(404).json({ error: "Not found" });
    res.json({ ...ownership, purchase_price: Number(ownership.purchase_price), customer_name: null, property_name: null, project_name: null, created_at: ownership.created_at.toISOString() });
  } catch (err) {
    req.log.error({ err }, "update ownership error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
