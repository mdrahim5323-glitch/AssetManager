import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, companiesTable, auditLogsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  GetUsersQueryParams,
  CreateUserBody,
  UpdateUserBody,
  UpdateUserParams,
  DeleteUserParams,
  GetUserParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/me", async (req, res) => {
  try {
    const clerkUserId = (req as any).auth?.userId;
    if (!clerkUserId) {
      // Return a default user for development
      return res.json({
        id: 1,
        company_id: 1,
        clerk_user_id: "dev",
        name: "Demo Admin",
        email: "admin@estatehub.com",
        role: "company_admin",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    let [user] = await db.select().from(usersTable).where(eq(usersTable.clerk_user_id, clerkUserId));
    if (!user) {
      // Auto-provision user from Clerk
      let [company] = await db.select().from(companiesTable).limit(1);
      if (!company) {
        [company] = await db.insert(companiesTable).values({ name: "Estate Hub", slug: "estate-hub" }).returning();
      }
      [user] = await db.insert(usersTable).values({
        company_id: company.id,
        clerk_user_id: clerkUserId,
        name: "New User",
        email: "",
        role: "sales_executive",
      }).returning();
    }

    res.json({ ...user, created_at: user.created_at.toISOString(), updated_at: user.updated_at.toISOString() });
  } catch (err) {
    req.log.error({ err }, "get me error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const parsed = GetUsersQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : {};
    const companyId = (req as any).companyId ?? 1;

    const conditions = [eq(usersTable.company_id, companyId)];
    if (params.role) conditions.push(eq(usersTable.role, params.role));
    if (params.is_active !== undefined) conditions.push(eq(usersTable.is_active, Boolean(params.is_active)));

    const rows = await db.select().from(usersTable).where(and(...conditions)).orderBy(sql`${usersTable.created_at} desc`);
    res.json(rows.map(r => ({ ...r, created_at: r.created_at.toISOString(), updated_at: r.updated_at.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "list users error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = CreateUserBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
    const companyId = (req as any).companyId ?? 1;
    const [user] = await db.insert(usersTable).values({ ...parsed.data, company_id: companyId }).returning();
    await db.insert(auditLogsTable).values({ company_id: companyId, action: "created", entity_type: "user", entity_id: user.id, description: `User "${user.name}" created` });
    res.status(201).json({ ...user, created_at: user.created_at.toISOString(), updated_at: user.updated_at.toISOString() });
  } catch (err) {
    req.log.error({ err }, "create user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = GetUserParams.parse({ id: Number(req.params.id) });
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json({ ...user, created_at: user.created_at.toISOString(), updated_at: user.updated_at.toISOString() });
  } catch (err) {
    req.log.error({ err }, "get user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = UpdateUserParams.parse({ id: Number(req.params.id) });
    const parsed = UpdateUserBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
    const [user] = await db.update(usersTable).set({ ...parsed.data, updated_at: new Date() }).where(eq(usersTable.id, id)).returning();
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json({ ...user, created_at: user.created_at.toISOString(), updated_at: user.updated_at.toISOString() });
  } catch (err) {
    req.log.error({ err }, "update user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = DeleteUserParams.parse({ id: Number(req.params.id) });
    await db.update(usersTable).set({ is_active: false, updated_at: new Date() }).where(eq(usersTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "deactivate user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
