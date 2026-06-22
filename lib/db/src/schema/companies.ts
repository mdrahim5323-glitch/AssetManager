import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const companiesTable = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: text("plan").notNull().default("starter"),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertCompanySchema = createInsertSchema(companiesTable).omit({ id: true, created_at: true });
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companiesTable.$inferSelect;
