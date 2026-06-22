import { pgTable, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { customersTable } from "./customers";
import { propertiesTable } from "./properties";

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  company_id: integer("company_id").notNull().references(() => companiesTable.id),
  customer_id: integer("customer_id").notNull().references(() => customersTable.id),
  property_id: integer("property_id").notNull().references(() => propertiesTable.id),
  total_amount: numeric("total_amount", { precision: 15, scale: 2 }).notNull(),
  paid_amount: numeric("paid_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
