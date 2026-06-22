import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { usersTable } from "./users";

export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  company_id: integer("company_id").notNull().references(() => companiesTable.id),
  user_id: integer("user_id").references(() => usersTable.id),
  action: text("action").notNull(),
  entity_type: text("entity_type").notNull(),
  entity_id: integer("entity_id"),
  description: text("description").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogsTable).omit({ id: true, created_at: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogsTable.$inferSelect;
