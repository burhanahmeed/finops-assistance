# FinanceOps Agent — Claude Code Plan

## Project Overview

An AI CFO agent for Indonesian small businesses (UMKM) that autonomously monitors Mayar.id and might support another payment gateway like Midtrans, Xendit, Stripe in the future financial data, detects anomalies, and delivers proactive insights in Bahasa Indonesia.

---

## Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router) |
| Agent | Mastra |
| LLM | GPT-4o mini |
| ORM | Drizzle ORM |
| Database | SQLite (better-sqlite3) |
| Payment Data | Mayar.id API |
| Deployment | Railway or local + ngrok |

---

## Project Structure

```
financeops/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Dashboard UI
│   │   ├── layout.tsx
│   │   └── api/
│   │       ├── agent/route.ts        # Chat with agent endpoint
│   │       └── webhook/route.ts      # Mayar webhook receiver
│   ├── mastra/
│   │   ├── index.ts                  # Mastra instance
│   │   ├── agents/
│   │   │   └── financeOps.ts         # Main CFO agent
│   │   ├── tools/
│   │   │   ├── mayar.ts              # Mayar API tools
│   │   │   ├── anomaly.ts            # Anomaly detection tool
│   │   │   └── report.ts             # Report generator tool
│   ├── db/
│   │   ├── schema.ts                 # Drizzle schema
│   │   ├── index.ts                  # DB instance
│   │   └── migrations/
│   ├── lib/
│   │   └── mayar.ts                  # Mayar API client
│   └── types/
│       └── mayar.ts                  # Mayar API types
├── drizzle.config.ts
├── .env.local
└── package.json
```

---

## Phase 1 — Project Setup

### Tasks
- [ ] Init Next.js 16 project with TypeScript
- [ ] Install dependencies: `mastra`, `drizzle-orm`, `better-sqlite3`
- [ ] Setup `.env.local` with keys: `MAYAR_API_KEY`, `OPENAI_API_KEY`
- [ ] Init Drizzle with SQLite
- [ ] Run `drizzle-kit generate` and `drizzle-kit migrate`

### Schema (Drizzle)

```typescript
// src/db/schema.ts

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
  type: text("type"),           // "alert" | "insight" | "report"
  message: text("message"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const anomalies = sqliteTable("anomalies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type"),           // "revenue_drop" | "overdue_invoice" | "churn"
  severity: text("severity"),   // "low" | "medium" | "high"
  description: text("description"),
  resolved: integer("resolved", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});
```

---

## Phase 2 — Mayar API Integration

### Tasks
- [ ] Create Mayar API client (`src/lib/mayar.ts`)
- [ ] Implement tools in `src/mastra/tools/mayar.ts`

### Tools to Build

```typescript
// src/mastra/tools/mayar.ts

getMayarTransactions   // GET /transaction — fetch paginated transactions
getMayarInvoices       // GET /invoice — fetch invoices with status
getMayarProducts       // GET /payment-link — list all payment links
getMayarSubscriptions  // GET /subscription — list subscriptions
syncToSQLite           // Fetch + upsert all data into local SQLite
```

### Mayar API Base
```
Base URL: https://api.mayar.id/hl/v1
Auth: Bearer token (MAYAR_API_KEY)
```

---

## Phase 3 — Anomaly Detection Tool

### Tasks
- [ ] Build `src/mastra/tools/anomaly.ts`
- [ ] Implement detection rules

### Detection Rules

```typescript
// Rules the agent uses
const rules = [
  {
    name: "revenue_drop",
    condition: thisWeekRevenue < lastWeekRevenue * 0.7,
    severity: "high",
    message: "Revenue turun lebih dari 30% dibanding minggu lalu"
  },
  {
    name: "overdue_invoice",
    condition: invoice.daysOverdue > 14,
    severity: "medium",
    message: `Invoice ${invoice.id} sudah lewat jatuh tempo ${invoice.daysOverdue} hari`
  },
  {
    name: "zero_sales_product",
    condition: product.salesLast3Days === 0 && product.salesPrev3Days > 0,
    severity: "medium",
    message: `Produk "${product.name}" tidak ada penjualan 3 hari terakhir`
  },
  {
    name: "subscription_churn",
    condition: churnedThisWeek > churnedLastWeek * 1.5,
    severity: "high",
    message: "Churn subscriber meningkat signifikan minggu ini"
  },
  {
    name: "high_value_customer",
    condition: customer.purchasesThisWeek >= 3,
    severity: "info",
    message: `Pelanggan ${customer.email} beli 3x minggu ini — perlu diperhatikan`
  }
]
```

---

## Phase 4 — Mastra Agent

### Tasks
- [ ] Create `src/mastra/agents/financeOps.ts`
- [ ] Write system prompt in Bahasa Indonesia
- [ ] Wire all tools to agent

### Agent Definition

```typescript
// src/mastra/agents/financeOps.ts

export const financeOpsAgent = new Agent({
  name: "FinanceOps",
  instructions: `
    Kamu adalah CFO AI untuk bisnis UMKM Indonesia.
    Tugasmu adalah memantau data keuangan dari Mayar.id,
    mendeteksi anomali, dan memberikan saran yang actionable.

    Gaya komunikasi:
    - Gunakan Bahasa Indonesia yang ramah dan profesional
    - Langsung ke poin, tidak bertele-tele
    - Selalu sertakan angka spesifik
    - Berikan rekomendasi konkret, bukan hanya observasi

    Ketika ada anomali:
    1. Jelaskan apa yang terjadi
    2. Analisis kemungkinan penyebab
    3. Rekomendasikan tindakan spesifik
  `,
  model: openai("gpt-4o-mini"),
  tools: {
    getMayarTransactions,
    getMayarInvoices,
    getMayarProducts,
    getMayarSubscriptions,
    detectAnomalies,
    generateReport,
  },
});
```

---

## Phase 5 — Dashboard UI

### Tasks
- [ ] Build `src/app/page.tsx` dashboard
- [ ] Show: revenue chart, anomaly list, agent log feed
- [ ] Chat interface to ask agent questions on demand
- [ ] Call `POST /api/agent` for chat

### Dashboard Sections
1. **Revenue Overview** — this week vs last week
2. **Active Anomalies** — list with severity badges
3. **Agent Activity Log** — what the agent has done/said
4. **Ask CFO** — chat input to query agent directly

---

## Phase 6 — Demo Preparation

### Seed Data Script
- [ ] Create `scripts/seed.ts` to insert 3 months of fake transaction data
- [ ] Include scenarios: revenue drop, overdue invoices, churned subscriber
- [ ] Run: `npx tsx scripts/seed.ts`

### Demo Flow
1. Show dashboard with seeded data
2. Ask agent: *"Kenapa revenue turun minggu ini?"*
3. Agent drills down and gives recommendation
4. Show agent activity log updating in real-time

---

## Environment Variables

```bash
# .env.local
MAYAR_API_KEY=
OPENAI_API_KEY=
DATABASE_URL=./financeops.db
```

---

## Key Dependencies

```json
{
  "dependencies": {
    "@mastra/core": "latest",
    "@mastra/openai": "latest",
    "drizzle-orm": "latest",
    "better-sqlite3": "latest",
    "next": "14",
    "react": "18",
    "typescript": "5"
  },
  "devDependencies": {
    "drizzle-kit": "latest",
    "@types/better-sqlite3": "latest",
    "tsx": "latest"
  }
}
```

---

## Build Order Summary

```
Phase 1 → Project setup + DB schema
Phase 2 → Mayar API tools
Phase 3 → Anomaly detection
Phase 4 → Mastra agent
Phase 5 → Dashboard UI
Phase 6 → Seed data + demo prep
```