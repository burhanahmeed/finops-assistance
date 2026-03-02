import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  amount: integer("amount").notNull(),
  productName: text("product_name"),
  customerEmail: text("customer_email"),
  status: text("status"),
  createdAt: integer("created_at", { mode: "timestamp" }),
  syncedAt: integer("synced_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const agentLogs = sqliteTable("agent_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type"), // "alert" | "insight" | "report"
  message: text("message"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const anomalies = sqliteTable("anomalies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type"), // "revenue_drop" | "overdue_invoice" | "churn"
  severity: text("severity"), // "low" | "medium" | "high"
  description: text("description"),
  resolved: integer("resolved", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});
