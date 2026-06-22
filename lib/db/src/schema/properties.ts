import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";

export const propertiesTable = pgTable("properties", {
  id: serial("id").primaryKey(),
  company_id: integer("company_id").notNull().references(() => companiesTable.id),
  project_name: text("project_name").notNull(),
  property_name: text("property_name").notNull(),
  unit_no: text("unit_no"),
  location: text("location"),
  property_type: text("property_type").notNull().default("Flat"),
  price: numeric("price", { precision: 15, scale: 2 }).notNull(),
  status: text("status").notNull().default("Available"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPropertySchema = createInsertSchema(propertiesTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof propertiesTable.$inferSelect;
