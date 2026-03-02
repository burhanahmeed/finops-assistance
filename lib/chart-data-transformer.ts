/**
 * Chart data transformer utilities
 * Transforms Mayar API data into chart-friendly formats
 */

import type { MayarTransaction } from "@/types/mayar";
import type { TimeSeriesDataPoint, ComparisonDataPoint, DistributionDataPoint } from "@/types/chart";
import { formatCurrency } from "./chart-config";

/**
 * Time period grouping types
 */
type TimePeriod = "day" | "week" | "month";

/**
 * Group transactions by time period for line charts
 */
export function transformToTimeSeries(
  transactions: MayarTransaction[],
  period: TimePeriod = "day",
  limit: number = 30
): TimeSeriesDataPoint[] {
  // Filter successful transactions only
  const successfulTxns = transactions.filter(
    (t) => t.status === "settled"
  );

  // Group by time period
  const grouped = new Map<string, number>();

  successfulTxns.forEach((txn) => {
    const date = new Date(txn.createdAt);
    let key: string;

    if (period === "day") {
      key = date.toISOString().split("T")[0]; // YYYY-MM-DD
    } else if (period === "week") {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split("T")[0];
    } else {
      // month
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }

    const amount = txn.credit || 0;
    grouped.set(key, (grouped.get(key) || 0) + amount);
  });

  // Convert to array and sort by date
  const data = Array.from(grouped.entries())
    .map(([date, value]) => ({ date, value, label: formatCurrency(value) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Limit to most recent N periods
  return data.slice(-limit);
}

/**
 * Group transactions by category for bar charts
 */
export function transformToComparison(
  transactions: MayarTransaction[],
  groupBy: "product" | "paymentMethod" | "status",
  limit: number = 10
): ComparisonDataPoint[] {
  const grouped = new Map<string, { value: number; count: number }>();

  transactions.forEach((txn) => {
    let key: string;

    if (groupBy === "product") {
      key = txn.paymentLink?.name || "Unknown Product";
    } else if (groupBy === "paymentMethod") {
      key = txn.paymentMethod || "Unknown";
    } else {
      key = txn.status || "unknown";
    }

    const amount = txn.credit || 0;
    const current = grouped.get(key) || { value: 0, count: 0 };
    grouped.set(key, {
      value: current.value + amount,
      count: current.count + 1,
    });
  });

  // Convert to array, sort by value, and limit
  return Array.from(grouped.entries())
    .map(([name, { value, count }]) => ({ name, value, count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

/**
 * Transform to distribution data for pie charts
 */
export function transformToDistribution(
  transactions: MayarTransaction[],
  category: "product" | "paymentMethod" | "status"
): DistributionDataPoint[] {
  const grouped = new Map<string, number>();

  transactions.forEach((txn) => {
    let key: string;

    if (category === "product") {
      key = txn.paymentLink?.name || "Unknown";
    } else if (category === "paymentMethod") {
      key = txn.paymentMethod || "Unknown";
    } else {
      key = txn.status || "unknown";
    }

    const amount = txn.credit || 0;
    grouped.set(key, (grouped.get(key) || 0) + amount);
  });

  // Calculate total for percentages
  const total = Array.from(grouped.values()).reduce((sum, val) => sum + val, 0);

  // Convert to array with percentages
  return Array.from(grouped.entries())
    .map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Generate dashboard data (multiple charts)
 */
export interface DashboardData {
  revenueTrend: TimeSeriesDataPoint[];
  topProducts: ComparisonDataPoint[];
  paymentDistribution: DistributionDataPoint[];
}

export function transformToDashboard(
  transactions: MayarTransaction[],
  timePeriod: TimePeriod = "day"
): DashboardData {
  return {
    revenueTrend: transformToTimeSeries(transactions, timePeriod, 30),
    topProducts: transformToComparison(transactions, "product", 5),
    paymentDistribution: transformToDistribution(transactions, "paymentMethod"),
  };
}

/**
 * Format chart data for Recharts components
 */
export function formatForLineChart(data: TimeSeriesDataPoint[]) {
  return data.map((d) => ({
    name: formatDateKey(d.date),
    value: d.value,
    label: d.label,
  }));
}

export function formatForBarChart(data: ComparisonDataPoint[]) {
  return data.map((d) => ({
    name: d.name,
    value: d.value,
    count: d.count,
  }));
}

export function formatForPieChart(data: DistributionDataPoint[]) {
  return data.map((d) => ({
    name: d.name,
    value: d.value,
    percentage: d.percentage,
  }));
}

/**
 * Helper to format date key for display
 */
function formatDateKey(dateStr: string): string {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };

  // If it's a month key (YYYY-MM), include year
  if (dateStr.split("-").length === 2 && dateStr.length === 7) {
    return new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric" }).format(date);
  }

  return new Intl.DateTimeFormat("id-ID", options).format(date);
}
