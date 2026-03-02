# Mayar Merchant Assistant

A ChatGPT-like interface for Mayar merchants to manage products and view transaction summaries using natural language.

## Features

- Natural language product management (create, update, delete)
- Transaction summaries with visualizations
- CSV bulk product import
- Slash command palette
- Chat history persistence

## Tech Stack

**Frontend:**
- React + Vite
- PapaParse (CSV parsing)
- Recharts (data visualization)

**Backend:**
- Node.js + Fastify
- Gemini SDK (LLM with function calling)
- Mayar MCP client

## Project Structure

```
mayar-merchant-assistant/
├── frontend/                  # React app
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/         # API key setup
│   │   │   ├── Chat/         # Chat interface
│   │   │   ├── Results/      # Product cards & charts
│   │   │   └── Layout/       # App shell
│   │   ├── hooks/            # React hooks
│   │   ├── services/         # API client
│   │   └── main.jsx
│   └── package.json
│
└── backend/                   # Node.js + Fastify
    ├── src/
    │   ├── routes/           # API endpoints
    │   ├── services/         # Gemini & Mayar MCP
    │   ├── tools/            # LLM tool definitions
    │   └── server.js
    └── package.json
```

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Usage

1. Enter your Mayar API key and Gemini API key
2. Start chatting with the assistant
3. Use `/` to see available commands
4. Drag and drop CSV files to bulk import products

## Available Commands

- `/create_product` - Create a new product
- `/update_product` - Update an existing product
- `/delete_product` - Delete a product
- `/transaction_summary` - View transaction summary

## Development Phases

This project was built in 7 phases:
1. Scaffold & Auth
2. Backend Setup
3. Tool Definitions
4. Chat Interface
5. CSV Product Import
6. Transaction Summary UI
7. Polish & Error Handling

See `plan.md` for detailed implementation plan.
