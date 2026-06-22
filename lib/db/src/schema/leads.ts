import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { usersTable } from "./users";

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  company_id: integer("company_id").notNull().references(() => companiesTable.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  source: text("source").notNull().default("Direct"),
  status: text("status").notNull().default("New"),
  assigned_to: integer("assigned_to").references(() => usersTable.id),
  follow_up_date: text("follow_up_date"),
  notes: text("notes"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;
