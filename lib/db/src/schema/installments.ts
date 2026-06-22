import { pgTable, serial, integer, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { paymentsTable } from "./payments";

export const installmentsTable = pgTable("installments", {
  id: serial("id").primaryKey(),
  payment_id: integer("payment_id").notNull().references(() => paymentsTable.id),
  company_id: integer("company_id").notNull().references(() => companiesTable.id),
  installment_no: integer("installment_no").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  due_date: text("due_date").notNull(),
  paid_date: text("paid_date"),
  status: text("status").notNull().default("Pending"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertInstallmentSchema = createInsertSchema(installmentsTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertInstallment = z.infer<typeof insertInstallmentSchema>;
export type Installment = typeof installmentsTable.$inferSelect;
