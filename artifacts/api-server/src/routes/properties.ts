import { Router } from "express";
import { db } from "@workspace/db";
import { propertiesTable, auditLogsTable } from "@workspace/db";
import { eq, ilike, and, sql } from "drizzle-orm";
import {
  GetPropertiesQueryParams,
  CreatePropertyBody,
  UpdatePropertyBody,
  UpdatePropertyParams,
  DeletePropertyParams,
  GetPropertyParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/stats", async (req, res) => {
  try {
    const companyId = (req as any).companyId ?? 1;
    const [stats] = await db.select({
      available: sql<number>`count(*) filter (where status = 'Available')::int`,
      reserved: sql<number>`count(*) filter (where status = 'Reserved')::int`,
      sold: sql<number>`count(*) filter (where status = 'Sold')::int`,
    }).from(propertiesTable).where(eq(propertiesTable.company_id, companyId));

    const byType = await db.select({
      property_type: propertiesTable.property_type,
      count: sql<number>`count(*)::int`,
    }).from(propertiesTable).where(eq(propertiesTable.company_id, companyId)).groupBy(propertiesTable.property_type);

    res.json({ ...stats, by_type: byType });
  } catch (err) {
    req.log.error({ err }, "property stats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const parsed = GetPropertiesQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : {};
    const companyId = (req as any).companyId ?? 1;
    const page = Number(params.page ?? 1);
    const limit = Number(params.limit ?? 20);
    const offset = (page - 1) * limit;

    const conditions = [eq(propertiesTable.company_id, companyId)];
    if (params.status) conditions.push(eq(propertiesTable.status, params.status));
    if (params.property_type) conditions.push(eq(propertiesTable.property_type, params.property_type));
    if (params.search) conditions.push(ilike(propertiesTable.property_name, `%${params.search}%`));

    const [rows, [{ total }]] = await Promise.all([
      db.select().from(propertiesTable).where(and(...conditions)).limit(limit).offset(offset).orderBy(sql`${propertiesTable.created_at} desc`),
      db.select({ total: sql<number>`count(*)::int` }).from(propertiesTable).where(and(...conditions)),
    ]);

    res.json({
      data: rows.map(r => ({ ...r, price: Number(r.price), created_at: r.created_at.toISOString(), updated_at: r.updated_at.toISOString() })),
      total,
      page,
      limit,
    });
  } catch (err) {
    req.log.error({ err }, "list properties error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = CreatePropertyBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
    const companyId = (req as any).companyId ?? 1;
    const [property] = await db.insert(propertiesTable).values({ ...parsed.data, company_id: companyId, price: String(parsed.data.price), status: parsed.data.status ?? "Available" }).returning();
    await db.insert(auditLogsTable).values({ company_id: companyId, action: "created", entity_type: "property", entity_id: property.id, description: `Property "${property.property_name}" added` });
    res.status(201).json({ ...property, price: Number(property.price), created_at: property.created_at.toISOString(), updated_at: property.updated_at.toISOString() });
  } catch (err) {
    req.log.error({ err }, "create property error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = GetPropertyParams.parse({ id: Number(req.params.id) });
    const [row] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ ...row, price: Number(row.price), created_at: row.created_at.toISOString(), updated_at: row.updated_at.toISOString() });
  } catch (err) {
    req.log.error({ err }, "get property error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = UpdatePropertyParams.parse({ id: Number(req.params.id) });
    const parsed = UpdatePropertyBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
    const updateData: Record<string, unknown> = { ...parsed.data, updated_at: new Date() };
    if (parsed.data.price !== undefined) updateData.price = String(parsed.data.price);
    const [property] = await db.update(propertiesTable).set(updateData).where(eq(propertiesTable.id, id)).returning();
    if (!property) return res.status(404).json({ error: "Not found" });
    res.json({ ...property, price: Number(property.price), created_at: property.created_at.toISOString(), updated_at: property.updated_at.toISOString() });
  } catch (err) {
    req.log.error({ err }, "update property error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = DeletePropertyParams.parse({ id: Number(req.params.id) });
    await db.delete(propertiesTable).where(eq(propertiesTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "delete property error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
