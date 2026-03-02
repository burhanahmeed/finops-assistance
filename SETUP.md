# FinanceOps Agent - Setup Guide

AI CFO agent untuk UMKM Indonesia yang terintegrasi dengan Mayar.id

## ✅ What's Been Built

### Phase 1 - Project Setup ✓
- Next.js 16 with TypeScript
- Drizzle ORM + SQLite database
- Database schema (transactions, agent_logs, anomalies)
- Migrations generated and applied

### Phase 2 - Mayar Integration ✓
- Mayar API client (`lib/mayar.ts`)
- Mastra tools for fetching transactions, invoices, products, subscriptions
- Data sync tool to SQLite

### Phase 3 - Anomaly Detection ✓
- Revenue drop detection
- Zero sales product detection
- Anomaly logging to database

### Phase 4 - Mastra Agent ✓
- FinanceOps agent with GPT-4o-mini
- Bahasa Indonesia instructions
- All tools wired up

### Phase 5 - Dashboard UI ✓
- Chat interface with agent
- Settings panel for API keys

### Phase 6 - Demo Prep ✓
- Seed script with 3 months of data
- Revenue drop scenario
- Zero sales scenario

## 🚀 Quick Start

### 1. Environment Setup

Copy `.env.local` and fill in your API keys:

```bash
# Mayar API
MAYAR_API_KEY=your_mayar_api_key_here

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Database (already set)
DATABASE_URL=./financeops.db
```

### 2. Get API Keys

**Mayar.id:**
- Login to https://mayar.id
- Go to Settings → API
- Copy your API key

**OpenAI:**
- Go to https://platform.openai.com/api-keys
- Create new API key

### 3. Seed Demo Data

```bash
npm run db:seed
```

This creates 3 months of transaction data with:
- Revenue drop in last 2 weeks
- "Template IG Pack" with no recent sales

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## 📋 Available Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate new migrations
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio
npm run db:seed      # Seed demo data
```

## 🧪 Testing the Agent

### Chat with Agent
Try these questions:
- "Kenapa revenue turun minggu ini?"
- "Produk mana yang tidak laku?"
- "Berapa total revenue bulan ini?"

### 3. API Endpoints

**Chat with agent:**
```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Analisis revenue minggu ini"}'
```

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   └── agent/route.ts      # Chat endpoint
│   ├── page.tsx                # Dashboard
│   └── layout.tsx
├── db/
│   ├── schema.ts               # Database schema
│   ├── index.ts                # DB instance
│   └── migrations/
├── lib/
│   └── mayar.ts                # Mayar API client
├── mastra/
│   ├── index.ts                # Mastra instance
│   ├── agents/
│   │   └── financeOps.ts       # Main agent
│   └── tools/
│       ├── mayar.ts            # Mayar tools
│       ├── anomaly.ts          # Anomaly detection
│       └── report.ts           # Report generator
├── scripts/
│   └── seed.ts                 # Demo data seeder
└── types/
    └── mayar.ts                # Mayar API types
```

## 🔧 Next Steps

1. **Add more anomaly rules** in `mastra/tools/anomaly.ts`:
   - Overdue invoices
   - Subscription churn
   - High-value customer detection

2. **Enhance dashboard** in `app/page.tsx`:
   - Revenue charts
   - Anomaly list
   - Agent activity log

3. **Add webhook receiver** at `app/api/webhook/route.ts`:
   - Real-time Mayar transaction updates

4. **Deploy to production**:
   - Railway, Vercel, or similar
   - Set environment variables

## 🐛 Troubleshooting

**"Agent not responding"**
- Check OPENAI_API_KEY is set
- Verify API key is valid

**"Database errors"**
- Run `npm run db:migrate` again
- Delete `financeops.db` and re-run migrations

**"Mayar API errors"**
- Verify MAYAR_API_KEY is correct
- Check API rate limits

## 📚 Resources

- [Mastra Docs](https://mastra.ai/docs)
- [Mayar API Docs](https://docs.mayar.id)
- [Next.js 16 Docs](https://nextjs.org/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team)
