/**
 * Chart Generation Tools for FinanceOps Agent
 *
 * These tools allow the LLM to intelligently decide when and what charts to generate
 * based on the user's request, rather than relying on hardcoded keyword matching.
 *
 * Each tool fetches Mayar data internally, making them self-contained.
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  transformToTimeSeries,
  transformToComparison,
  transformToDistribution,
  transformToDashboard,
  formatForLineChart,
  formatForBarChart,
  formatForPieChart,
} from "@/lib/chart-data-transformer";
import { LINE_CHART_CONFIG, BAR_CHART_CONFIG, PIE_CHART_CONFIG } from "@/lib/chart-config";
import { createMayarClient } from "@/lib/mayar";
import type { MayarTransaction } from "@/types/mayar";

/**
 * Helper function to fetch Mayar transactions
 * Used internally by chart tools
 * Falls back to environment variable if apiKey is not provided
 */
async function fetchTransactions(apiKey?: string, useMockData = false): Promise<MayarTransaction[]> {
  // Use provided API key, or fall back to environment variable
  const effectiveApiKey = apiKey || process.env.MAYAR_API_KEY || "";
  // If no API key is available and mock data is not requested, use mock data as fallback
  const shouldUseMock = useMockData || !effectiveApiKey;
  const client = createMayarClient(effectiveApiKey, shouldUseMock);
  return await client.getTransactions(1, 500);
}

/**
 * Generate Line Chart Tool
 *
 * Use this when the user asks for trends over time, growth patterns, or time-series data.
 * Examples: "tren revenue", "pertumbuhan bulan ini", "grafik 30 hari terakhir"
 */
export const generateLineChartTool = createTool({
  id: "generate-line-chart",
  description: `Generate a line chart showing trends over time. Use this when user asks for:
  - Trends or growth patterns (trend, pertumbuhan)
  - Time periods like "30 hari", "7 hari", "bulan ini", "minggu ini"
  - Revenue/sales over time
  - Transaction volume over time`,
  inputSchema: z.object({
    apiKey: z.string().optional().describe("Mayar API key (uses env var if not provided)"),
    useMockData: z.boolean().optional().default(false).describe("Use mock data for testing"),
    timePeriod: z.enum(["day", "week", "month"]).default("day").describe("Grouping period for the time series"),
    limit: z.number().default(30).describe("Number of periods to show (e.g., 30 for 30 days)"),
    title: z.string().optional().describe("Chart title"),
  }),
  execute: async ({ apiKey, useMockData = false, timePeriod = "day", limit = 30, title = "Tren Revenue" }) => {
    // Fetch transactions internally
    const transactions = await fetchTransactions(apiKey, useMockData);

    const timeSeriesData = transformToTimeSeries(transactions, timePeriod, limit);
    const chartData = formatForLineChart(timeSeriesData);

    return {
      chartType: "line",
      title,
      data: chartData,
      config: LINE_CHART_CONFIG,
      dataPoints: timeSeriesData.length,
      period: timePeriod,
    };
  },
});

/**
 * Generate Bar Chart Tool
 *
 * Use this when the user asks for comparisons between items.
 * Examples: "produk terlaris", "bandingkan penjualan", "ranking produk"
 */
export const generateBarChartTool = createTool({
  id: "generate-bar-chart",
  description: `Generate a bar chart for comparisons. Use this when user asks for:
  - Top/best selling products (produk terlaris, produk terbaik)
  - Comparisons between items (bandingkan, ranking)
  - Payment method comparisons
  - Status distributions`,
  inputSchema: z.object({
    apiKey: z.string().optional().describe("Mayar API key (uses env var if not provided)"),
    useMockData: z.boolean().optional().default(false).describe("Use mock data for testing"),
    groupBy: z.enum(["product", "paymentMethod", "status"]).default("product").describe("What to group by"),
    limit: z.number().default(10).describe("Maximum number of bars to show"),
    title: z.string().optional().describe("Chart title"),
  }),
  execute: async ({ apiKey, useMockData = false, groupBy = "product", limit = 10, title }) => {
    // Fetch transactions internally
    const transactions = await fetchTransactions(apiKey, useMockData);

    const comparisonData = transformToComparison(transactions, groupBy, limit);
    const chartData = formatForBarChart(comparisonData);

    // Generate title based on groupBy if not provided
    const defaultTitle = groupBy === "product" ? "Produk Terlaris"
      : groupBy === "paymentMethod" ? "Metode Pembayaran"
      : "Perbandingan";

    return {
      chartType: "bar",
      title: title || defaultTitle,
      data: chartData,
      config: BAR_CHART_CONFIG,
      items: comparisonData.length,
      groupBy,
    };
  },
});

/**
 * Generate Pie Chart Tool
 *
 * Use this when the user asks for distributions or percentages.
 * Examples: "distribusi pembayaran", "persentase", "porsi revenue"
 */
export const generatePieChartTool = createTool({
  id: "generate-pie-chart",
  description: `Generate a pie chart for distributions. Use this when user asks for:
  - Distributions or percentages (distribusi, persentase, porsi)
  - Payment method breakdown
  - Product category share
  - "Bagaimana distribusi..."`,
  inputSchema: z.object({
    apiKey: z.string().optional().describe("Mayar API key (uses env var if not provided)"),
    useMockData: z.boolean().optional().default(false).describe("Use mock data for testing"),
    category: z.enum(["product", "paymentMethod", "status"]).default("paymentMethod").describe("Category to distribute"),
    title: z.string().optional().describe("Chart title"),
  }),
  execute: async ({ apiKey, useMockData = false, category = "paymentMethod", title }) => {
    // Fetch transactions internally
    const transactions = await fetchTransactions(apiKey, useMockData);

    const distributionData = transformToDistribution(transactions, category);
    const chartData = formatForPieChart(distributionData);

    // Generate title based on category if not provided
    const defaultTitle = category === "product" ? "Distribusi Produk"
      : category === "paymentMethod" ? "Distribusi Metode Pembayaran"
      : "Distribusi";

    return {
      chartType: "pie",
      title: title || defaultTitle,
      data: chartData,
      config: PIE_CHART_CONFIG,
      categories: distributionData.length,
      category,
    };
  },
});

/**
 * Generate Dashboard Tool
 *
 * Use this when the user asks for an overview or comprehensive view.
 * Examples: "dashboard", "overview", "ringkasan", "tampilkan semua"
 */
export const generateDashboardTool = createTool({
  id: "generate-dashboard",
  description: `Generate a multi-chart dashboard. Use this when user asks for:
  - Dashboard or overview (dashboard, overview, ringkasan)
  - "Show me everything" or comprehensive views
  - Financial health check`,
  inputSchema: z.object({
    apiKey: z.string().optional().describe("Mayar API key (uses env var if not provided)"),
    useMockData: z.boolean().optional().default(false).describe("Use mock data for testing"),
    timePeriod: z.enum(["day", "week", "month"]).default("day").describe("Grouping period for trend chart"),
    title: z.string().optional().describe("Dashboard title"),
    description: z.string().optional().describe("Dashboard description"),
  }),
  execute: async ({ apiKey, useMockData = false, timePeriod = "day", title = "Dashboard Keuangan", description = "Overview performa keuangan bisnis Anda" }) => {
    // Fetch transactions internally
    const transactions = await fetchTransactions(apiKey, useMockData);

    const dashboardData = transformToDashboard(transactions, timePeriod);

    return {
      isDashboard: true,
      title,
      description,
      charts: [
        {
          chartType: "line",
          title: `Tren Revenue (30 Hari)`,
          data: formatForLineChart(dashboardData.revenueTrend),
          config: LINE_CHART_CONFIG,
        },
        {
          chartType: "bar",
          title: "Top 5 Produk Terlaris",
          data: formatForBarChart(dashboardData.topProducts),
          config: BAR_CHART_CONFIG,
        },
        {
          chartType: "pie",
          title: "Distribusi Metode Pembayaran",
          data: formatForPieChart(dashboardData.paymentDistribution),
          config: PIE_CHART_CONFIG,
        },
      ],
    };
  },
});
