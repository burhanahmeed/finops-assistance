# FinanceOps AI Agent

An AI-powered CFO assistant for Indonesian MSMEs (UMKM) that monitors financial data from [Mayar.id](https://mayar.id), detects anomalies and fraud, and provides actionable business insights using natural language.

## Features

- 🤖 **Natural Language Interface** - Chat with your AI CFO in Bahasa Indonesia
- 📊 **Interactive Charts** - Line, bar, and pie charts for data visualization
- 🔍 **Anomaly Detection** - Automatically detects unusual patterns in transactions
- 🛡️ **Fraud Detection** - Identifies potentially fraudulent transactions
- 📈 **Dashboard Views** - Comprehensive financial overview with multiple charts
- 💾 **Conversation Memory** - Remembers context across chat sessions
- 🎯 **Streaming Responses** - Real-time streaming of AI responses with visible thinking process

## Tech Stack

**Frontend:**
- Next.js 16 + React 19
- Tailwind CSS
- Recharts (data visualization)

**Backend:**
- Mastra (AI agent framework)
- Google AI SDK (Gemini 2.5 Flash)
- Drizzle ORM + SQLite

**AI/ML:**
- Chain-of-thought reasoning
- Tool-calling architecture
- Thread-based conversation memory

## Project Structure

```
financeops-agent/
├── app/                      # Next.js app router
│   ├── api/agent/           # Agent API endpoint
│   ├── layout.tsx
│   └── page.tsx             # Chat interface
│
├── mastra/                   # AI agent configuration
│   ├── agents/
│   │   └── financeOps.ts    # Main agent definition
│   ├── tools/               # AI tools
│   │   ├── mayar.ts         # Mayar API integration
│   │   ├── anomaly.ts       # Anomaly detection
│   │   ├── fraud.ts         # Fraud detection
│   │   ├── report.ts        # Report generation
│   │   └── charts.ts        # Chart generation tools
│   ├── memory.ts            # Conversation memory
│   └── index.ts
│
├── db/                       # Database
│   ├── schema.ts            # Drizzle schema
│   └── index.ts
│
└── components/               # React components
    ├── MarkdownMessage.tsx
    ├── ThinkingBlock.tsx
    ├── ToolExecution.tsx
    └── charts/              # Chart components
```

## Setup

### Prerequisites
- Node.js 18+
- Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))
- Mayar API key (optional - mock mode available)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Usage

1. **Configure API Keys**
   - Click the settings icon (⚙️) in the top right
   - Enter your Gemini API key (required)
   - Optionally enter your Mayar API key, or enable mock mode for testing

2. **Start Chatting**
   - Ask questions in natural language (Bahasa Indonesia or English)
   - Example queries:
     - "Bagaimana performa penjualan 7 hari terakhir?"
     - "Cek ada anomali tidak?"
     - "Tampilkan dashboard keuangan"
     - "Produk apa yang paling laku?"

3. **View Results**
   - The AI shows its thinking process before answering
   - Charts are rendered inline in the chat
   - Tool executions are visible for transparency

## AI Tools

The agent has access to these tools:

| Tool | Description |
|------|-------------|
| `getMayarTransactions` | Fetch transaction data from Mayar |
| `getMayarInvoices` | Fetch invoice data |
| `getMayarProducts` | Fetch product catalog |
| `getMayarSubscriptions` | Fetch subscription data |
| `detectAnomalies` | Detect unusual patterns |
| `detectFraud` | Identify suspicious transactions |
| `generateLineChart` | Create trend visualization |
| `generateBarChart` | Create comparison charts |
| `generatePieChart` | Create distribution charts |
| `generateDashboard` | Generate multi-chart dashboard |

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate DB migrations
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio
npm run db:seed      # Seed database with sample data
```

## Development

See [plan.md](plan.md) for detailed implementation notes and [prd.md](prd.md) for the product requirements document.
