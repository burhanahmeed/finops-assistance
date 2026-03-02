import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createMayarClient } from "@/lib/mayar";
import { db } from "@/db";
import { transactions } from "@/db/schema";

export const getMayarTransactionsTool = createTool({
  id: "get-mayar-transactions",
  description: "Fetch transactions from Mayar API",
  inputSchema: z.object({
    page: z.number().optional().default(1),
    limit: z.number().optional().default(100),
    apiKey: z.string().optional(),
    useMockData: z.boolean().optional().default(false),
  }),
  execute: async (inputData) => {
    const { page, limit, apiKey, useMockData } = inputData;
    // Use provided API key, or fall back to environment variable
    const effectiveApiKey = apiKey || process.env.MAYAR_API_KEY || "";
    // If no API key is available and mock data is not requested, use mock data as fallback
    const shouldUseMock = useMockData || !effectiveApiKey;
    const client = createMayarClient(effectiveApiKey, shouldUseMock);
    const data = await client.getTransactions(page, limit);
    return {
      transactions: data,
      count: data.length,
    };
  },
});

export const getMayarInvoicesTool = createTool({
  id: "get-mayar-invoices",
  description: "Fetch invoices from Mayar API",
  inputSchema: z.object({
    page: z.number().optional().default(1),
    limit: z.number().optional().default(100),
    apiKey: z.string().optional(),
    useMockData: z.boolean().optional().default(false),
  }),
  execute: async (inputData) => {
    const { page, limit, apiKey, useMockData } = inputData;
    const effectiveApiKey = apiKey || process.env.MAYAR_API_KEY || "";
    const shouldUseMock = useMockData || !effectiveApiKey;
    const client = createMayarClient(effectiveApiKey, shouldUseMock);
    const data = await client.getInvoices(page, limit);
    return {
      invoices: data,
      count: data.length,
    };
  },
});

export const getMayarProductsTool = createTool({
  id: "get-mayar-products",
  description: "Fetch payment links/products from Mayar API",
  inputSchema: z.object({
    apiKey: z.string().optional(),
    useMockData: z.boolean().optional().default(false),
  }),
  execute: async (inputData) => {
    const { apiKey, useMockData } = inputData;
    const effectiveApiKey = apiKey || process.env.MAYAR_API_KEY || "";
    const shouldUseMock = useMockData || !effectiveApiKey;
    const client = createMayarClient(effectiveApiKey, shouldUseMock);
    const data = await client.getProducts();
    return {
      products: data,
      count: data.length,
    };
  },
});

export const getMayarSubscriptionsTool = createTool({
  id: "get-mayar-subscriptions",
  description: "Fetch subscriptions from Mayar API",
  inputSchema: z.object({
    apiKey: z.string().optional(),
    useMockData: z.boolean().optional().default(false),
  }),
  execute: async (inputData) => {
    const { apiKey, useMockData } = inputData;
    const effectiveApiKey = apiKey || process.env.MAYAR_API_KEY || "";
    const shouldUseMock = useMockData || !effectiveApiKey;
    const client = createMayarClient(effectiveApiKey, shouldUseMock);
    const data = await client.getSubscriptions();
    return {
      subscriptions: data,
      count: data.length,
    };
  },
});

export const syncMayarDataTool = createTool({
  id: "sync-mayar-data",
  description: "Sync all Mayar transaction data to local SQLite database",
  inputSchema: z.object({
    apiKey: z.string().optional(),
    useMockData: z.boolean().optional().default(false),
  }),
  execute: async (inputData) => {
    const { apiKey, useMockData } = inputData;
    const effectiveApiKey = apiKey || process.env.MAYAR_API_KEY || "";
    const shouldUseMock = useMockData || !effectiveApiKey;
    const client = createMayarClient(effectiveApiKey, shouldUseMock);
    const transactionData = await client.getTransactions(1, 1000);

    for (const txn of transactionData) {
      await db.insert(transactions).values({
        id: txn.id,
        amount: txn.credit,
        productName: txn.paymentLink?.name || "",
        customerEmail: txn.customer?.email || "",
        status: txn.status,
        createdAt: new Date(txn.createdAt),
      }).onConflictDoUpdate({
        target: transactions.id,
        set: {
          amount: txn.credit,
          status: txn.status,
          syncedAt: new Date(),
        },
      });
    }

    return {
      synced: transactionData.length,
      message: `Synced ${transactionData.length} transactions to database`,
    };
  },
});
