/**
 * Chart configuration constants
 * Matches existing FinanceOps AI theme (emerald/teal gradient)
 */

import type { ChartConfig } from "@/types/chart";

/**
 * Color scheme matching the existing FinanceOps AI theme
 */
export const CHART_COLORS = {
  primary: ["#10b981", "#0d9488", "#14b8a6"], // emerald-500 to teal-600
  secondary: ["#64748b", "#475569", "#334155"], // slate-500 to slate-700
  accent: ["#f59e0b", "#fbbf24", "#fcd34d"], // amber-500 to amber-300
  semantic: {
    positive: "#10b981", // emerald-500
    negative: "#ef4444", // red-500
    neutral: "#64748b", // slate-500
  },
  pie: [
    "#10b981", // emerald-500
    "#0d9488", // teal-600
    "#14b8a6", // teal-500
    "#f59e0b", // amber-500
    "#6366f1", // indigo-500
    "#8b5cf6", // violet-500
    "#ec4899", // pink-500
    "#3b82f6", // blue-500
  ],
} as const;

/**
 * Default chart dimensions
 */
export const CHART_DIMENSIONS = {
  height: {
    small: 200,
    medium: 300,
    large: 400,
  },
  width: {
    full: "100%",
  },
} as const;

/**
 * Default chart configuration
 */
export const DEFAULT_CHART_CONFIG: Partial<ChartConfig> = {
  showLegend: true,
  showTooltip: true,
  showGrid: true,
  height: CHART_DIMENSIONS.height.medium,
};

/**
 * Chart type specific configurations
 */
export const LINE_CHART_CONFIG: ChartConfig = {
  ...DEFAULT_CHART_CONFIG,
  colors: [...CHART_COLORS.primary],
  showGrid: true,
  height: CHART_DIMENSIONS.height.medium,
};

export const BAR_CHART_CONFIG: ChartConfig = {
  ...DEFAULT_CHART_CONFIG,
  colors: [...CHART_COLORS.primary],
  showGrid: true,
  height: CHART_DIMENSIONS.height.medium,
};

export const PIE_CHART_CONFIG: ChartConfig = {
  ...DEFAULT_CHART_CONFIG,
  colors: [...CHART_COLORS.pie],
  showLegend: true,
  showTooltip: true,
  showGrid: false,
  height: CHART_DIMENSIONS.height.medium,
};

/**
 * Chart title templates based on query patterns
 */
export const CHART_TITLES = {
  revenue: {
    line: "Tren Revenue",
    bar: "Revenue per Periode",
  },
  transactions: {
    line: "Volume Transaksi",
    bar: "Transaksi per Kategori",
    pie: "Distribusi Transaksi",
  },
  products: {
    bar: "Produk Terlaris",
    pie: "Distribusi Penjualan Produk",
  },
  payment: {
    pie: "Distribusi Metode Pembayaran",
    bar: "Pembayaran per Metode",
  },
  dashboard: "Dashboard Keuangan",
} as const;

/**
 * Format currency for Indonesian Rupiah
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format date for chart labels
 */
export function formatDate(date: Date | string | number): string {
  const d = typeof date === "number" ? new Date(date) : new Date(date);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(d);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}
