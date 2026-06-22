import { Router } from "express";
import { db } from "@workspace/db";
import { documentsTable, customersTable, propertiesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  GetDocumentsQueryParams,
  CreateDocumentBody,
  GetDocumentParams,
  DeleteDocumentParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const parsed = GetDocumentsQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : {};
    const companyId = (req as any).companyId ?? 1;

    const conditions = [eq(documentsTable.company_id, companyId)];
    if (params.customer_id) conditions.push(eq(documentsTable.customer_id, Number(params.customer_id)));
    if (params.property_id) conditions.push(eq(documentsTable.property_id, Number(params.property_id)));
    if (params.doc_type) conditions.push(eq(documentsTable.doc_type, params.doc_type));

    const rows = await db
      .select({
        id: documentsTable.id,
        company_id: documentsTable.company_id,
        customer_id: documentsTable.customer_id,
        property_id: documentsTable.property_id,
        customer_name: customersTable.name,
        property_name: propertiesTable.property_name,
        doc_type: documentsTable.doc_type,
        file_name: documentsTable.file_name,
        file_url: documentsTable.file_url,
        uploaded_by: documentsTable.uploaded_by,
        created_at: documentsTable.created_at,
      })
      .from(documentsTable)
      .leftJoin(customersTable, eq(documentsTable.customer_id, customersTable.id))
      .leftJoin(propertiesTable, eq(documentsTable.property_id, propertiesTable.id))
      .where(and(...conditions))
      .orderBy(sql`${documentsTable.created_at} desc`);

    res.json(rows.map(r => ({ ...r, created_at: r.created_at.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "list documents error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = CreateDocumentBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
    const companyId = (req as any).companyId ?? 1;
    const userId = (req as any).userId ?? null;
    const [doc] = await db.insert(documentsTable).values({ ...parsed.data, company_id: companyId, uploaded_by: userId }).returning();
    res.status(201).json({ ...doc, customer_name: null, property_name: null, created_at: doc.created_at.toISOString() });
  } catch (err) {
    req.log.error({ err }, "create document error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = GetDocumentParams.parse({ id: Number(req.params.id) });
    const [row] = await db
      .select({
        id: documentsTable.id,
        company_id: documentsTable.company_id,
        customer_id: documentsTable.customer_id,
        property_id: documentsTable.property_id,
        customer_name: customersTable.name,
        property_name: propertiesTable.property_name,
        doc_type: documentsTable.doc_type,
        file_name: documentsTable.file_name,
        file_url: documentsTable.file_url,
        uploaded_by: documentsTable.uploaded_by,
        created_at: documentsTable.created_at,
      })
      .from(documentsTable)
      .leftJoin(customersTable, eq(documentsTable.customer_id, customersTable.id))
      .leftJoin(propertiesTable, eq(documentsTable.property_id, propertiesTable.id))
      .where(eq(documentsTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ ...row, created_at: row.created_at.toISOString() });
  } catch (err) {
    req.log.error({ err }, "get document error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = DeleteDocumentParams.parse({ id: Number(req.params.id) });
    await db.delete(documentsTable).where(eq(documentsTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "delete document error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
