import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createMayarClient } from "@/lib/mayar";
import { detectAnomaliesTool } from "./anomaly";

/**
 * Anomaly Detection Workflow Tool
 *
 * Multi-step orchestrator that:
 * 1. Fetches transaction data from Mayar API
 * 2. Passes the data to the anomaly detection tool
 * 3. Returns combined results
 *
 * This replaces the database-querying approach with an API-first approach.
 */
export const anomalyDetectionWorkflow = createTool({
  id: "anomaly-detection-workflow",
  description: "Multi-step workflow: fetch Mayar transaction data via API, then detect anomalies (no database queries)",
  inputSchema: z.object({
    apiKey: z.string().optional().describe("Mayar API key (optional, will use env var if not provided)"),
    useMockData: z.boolean().optional().default(false).describe("Use mock data for testing"),
    limit: z.number().optional().default(500).describe("Maximum number of transactions to fetch"),
  }),
  execute: async ({ apiKey, useMockData, limit = 500 }) => {
    // Step 1: Fetch transaction data from Mayar API
    // Check environment variable for mock data setting, or use the parameter
    const envUseMock = process.env.USE_MOCK_MAYAR_DATA === "true";
    const shouldUseMock = useMockData ?? envUseMock ?? !apiKey;
    const client = createMayarClient(apiKey || "", shouldUseMock);
    const transactions = await client.getTransactions(1, limit);

    if (transactions.length === 0) {
      return {
        transactionsFetched: 0,
        anomaliesDetected: 0,
        anomalies: [],
        message: "No transactions found from Mayar API",
      };
    }

    // Step 2: Pass the fetched data to the anomaly detection tool
    // Note: Using type assertion to handle Mastra's tool execute signature
    const anomalyResult = (detectAnomaliesTool.execute
      ? await (detectAnomaliesTool.execute as any)({ transactions })
      : {
          anomaliesDetected: 0,
          anomalies: [],
          statistics: {
            totalTransactions: transactions.length,
            thisWeekRevenue: 0,
            lastWeekRevenue: 0,
            revenueChange: 0,
          },
        });

    // Step 3: Return combined results
    return {
      transactionsFetched: transactions.length,
      anomaliesDetected: anomalyResult.anomaliesDetected,
      anomalies: anomalyResult.anomalies,
      statistics: anomalyResult.statistics,
      message: `Analyzed ${transactions.length} transactions from Mayar API and found ${anomalyResult.anomaliesDetected} anomalies`,
    };
  },
});
