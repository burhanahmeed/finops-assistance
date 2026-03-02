import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createMayarClient } from "@/lib/mayar";
import { detectFraudTool } from "./fraud";

/**
 * Fraud Detection Workflow Tool
 *
 * Multi-step orchestrator that:
 * 1. Fetches transaction data from Mayar API
 * 2. Passes the data to the fraud detection tool
 * 3. Returns combined results
 *
 * This replaces the database-querying approach with an API-first approach.
 */
export const fraudDetectionWorkflow = createTool({
  id: "fraud-detection-workflow",
  description: "Multi-step workflow: fetch Mayar transaction data via API, then detect fraud (no database queries)",
  inputSchema: z.object({
    apiKey: z.string().optional().describe("Mayar API key (optional, will use env var if not provided)"),
    useMockData: z.boolean().optional().default(false).describe("Use mock data for testing"),
    limit: z.number().optional().default(500).describe("Maximum number of transactions to fetch"),
    lookbackDays: z.number().optional().default(7).describe("Number of days to look back for fraud analysis"),
  }),
  execute: async ({ apiKey, useMockData = false, limit = 500, lookbackDays = 7 }) => {
    // Step 1: Fetch transaction data from Mayar API
    const client = createMayarClient(apiKey || "", useMockData);
    const transactions = await client.getTransactions(1, limit);

    if (transactions.length === 0) {
      return {
        transactionsFetched: 0,
        fraudDetected: 0,
        suspiciousTransactions: [],
        message: "No transactions found from Mayar API",
      };
    }

    // Step 2: Pass the fetched data to the fraud detection tool
    // Note: Using type assertion to handle Mastra's tool execute signature
    const fraudResult = (detectFraudTool.execute
      ? await (detectFraudTool.execute as any)({ transactions, lookbackDays })
      : {
          fraudDetected: 0,
          suspiciousTransactions: [],
          summary: "No fraud detected",
        });

    // Step 3: Return combined results
    return {
      transactionsFetched: transactions.length,
      fraudDetected: fraudResult.fraudDetected,
      suspiciousTransactions: fraudResult.suspiciousTransactions,
      summary: fraudResult.summary,
      statistics: fraudResult.statistics,
      message: `Analyzed ${transactions.length} transactions from Mayar API and found ${fraudResult.fraudDetected} suspicious activities`,
    };
  },
});
