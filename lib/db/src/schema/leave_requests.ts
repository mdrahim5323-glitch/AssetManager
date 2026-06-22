import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { usersTable } from "./users";

export const leaveRequestsTable = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  company_id: integer("company_id").notNull().references(() => companiesTable.id),
  user_id: integer("user_id").notNull().references(() => usersTable.id),
  leave_type: text("leave_type").notNull(),
  start_date: text("start_date").notNull(),
  end_date: text("end_date").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("Pending"),
  reviewed_by: integer("reviewed_by").references(() => usersTable.id),
  reviewed_at: text("reviewed_at"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLeaveRequestSchema = createInsertSchema(leaveRequestsTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type LeaveRequest = typeof leaveRequestsTable.$inferSelect;
