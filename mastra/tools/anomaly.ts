import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Schema for a transaction (matches Mayar API response)
const mayarTransactionSchema = z.object({
  id: z.string(),
  amount: z.number(),
  product_name: z.string().optional(),
  customer_email: z.string().optional(),
  status: z.string(),
  created_at: z.string(),
});

export const detectAnomaliesTool = createTool({
  id: "detect-anomalies",
  description: "Detect financial anomalies from provided transaction data (in-memory, no database queries)",
  inputSchema: z.object({
    transactions: z.array(mayarTransactionSchema),
  }),
  execute: async ({ transactions }) => {
    const detectedAnomalies = [];

    // Get date ranges
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Parse transaction dates for comparison
    const transactionsWithDates = transactions.map((t) => ({
      ...t,
      createdAt: new Date(t.created_at),
    }));

    // Rule 1: Revenue drop detection (compare this week vs last week)
    const thisWeekTransactions = transactionsWithDates.filter(
      (t) => t.createdAt >= oneWeekAgo
    );
    const lastWeekTransactions = transactionsWithDates.filter(
      (t) => t.createdAt >= twoWeeksAgo && t.createdAt < oneWeekAgo
    );

    // Only count successful/paid transactions for revenue
    const successfulStatuses = ["success", "paid", "completed", "settlement"];
    const thisWeekRevenue = thisWeekTransactions
      .filter((t) => successfulStatuses.includes(t.status.toLowerCase()))
      .reduce((sum, t) => sum + t.amount, 0);

    const lastWeekRevenue = lastWeekTransactions
      .filter((t) => successfulStatuses.includes(t.status.toLowerCase()))
      .reduce((sum, t) => sum + t.amount, 0);

    if (lastWeekRevenue > 0 && thisWeekRevenue < lastWeekRevenue * 0.7) {
      const dropPercentage = Math.round(
        ((lastWeekRevenue - thisWeekRevenue) / lastWeekRevenue) * 100
      );

      detectedAnomalies.push({
        type: "revenue_drop",
        severity: "high",
        message: `Revenue turun ${dropPercentage}% minggu ini (Rp ${lastWeekRevenue.toLocaleString(
          "id-ID"
        )} → Rp ${thisWeekRevenue.toLocaleString("id-ID")})`,
      });
    }

    // Rule 2: Zero sales detection (products with no recent sales)
    const recentTransactions = transactionsWithDates.filter(
      (t) => t.createdAt >= oneWeekAgo
    );

    const productSales = new Map<string, number>();
    recentTransactions.forEach((txn) => {
      if (txn.product_name && successfulStatuses.includes(txn.status.toLowerCase())) {
        productSales.set(txn.product_name, (productSales.get(txn.product_name) || 0) + 1);
      }
    });

    // Get all unique products from the entire transaction list
    const allProducts = new Set<string>();
    transactionsWithDates.forEach((t) => {
      if (t.product_name) {
        allProducts.add(t.product_name);
      }
    });

    // Check for products with zero sales in recent period
    for (const productName of allProducts) {
      if (!productSales.has(productName)) {
        detectedAnomalies.push({
          type: "zero_sales_product",
          severity: "medium",
          message: `Produk "${productName}" tidak ada penjualan 7 hari terakhir`,
        });
      }
    }

    return {
      anomaliesDetected: detectedAnomalies.length,
      anomalies: detectedAnomalies,
      statistics: {
        totalTransactions: transactions.length,
        thisWeekRevenue,
        lastWeekRevenue,
        revenueChange: lastWeekRevenue > 0
          ? Math.round(((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100)
          : 0,
      },
    };
  },
});
