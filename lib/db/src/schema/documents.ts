import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { customersTable } from "./customers";
import { propertiesTable } from "./properties";
import { usersTable } from "./users";

export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  company_id: integer("company_id").notNull().references(() => companiesTable.id),
  customer_id: integer("customer_id").references(() => customersTable.id),
  property_id: integer("property_id").references(() => propertiesTable.id),
  doc_type: text("doc_type").notNull(),
  file_name: text("file_name").notNull(),
  file_url: text("file_url").notNull(),
  uploaded_by: integer("uploaded_by").references(() => usersTable.id),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({ id: true, created_at: true });
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;
