import { pgTable, serial, integer, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { customersTable } from "./customers";
import { propertiesTable } from "./properties";

export const ownershipsTable = pgTable("ownerships", {
  id: serial("id").primaryKey(),
  company_id: integer("company_id").notNull().references(() => companiesTable.id),
  customer_id: integer("customer_id").notNull().references(() => customersTable.id),
  property_id: integer("property_id").notNull().references(() => propertiesTable.id),
  purchase_price: numeric("purchase_price", { precision: 15, scale: 2 }).notNull(),
  purchase_date: text("purchase_date").notNull(),
  ownership_type: text("ownership_type").notNull().default("Full"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertOwnershipSchema = createInsertSchema(ownershipsTable).omit({ id: true, created_at: true });
export type InsertOwnership = z.infer<typeof insertOwnershipSchema>;
export type Ownership = typeof ownershipsTable.$inferSelect;
