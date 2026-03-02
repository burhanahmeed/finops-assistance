/**
 * Chart type definitions for FinanceOps AI
 */

export type ChartType = "line" | "bar" | "pie";

export interface ChartConfig {
  xAxis?: string;
  yAxis?: string;
  dataKey?: string;
  nameKey?: string;
  colors?: string[];
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  height?: number;
}

export interface ChartData {
  type: ChartType;
  title: string;
  data: Record<string, string | number>[];
  config?: ChartConfig;
  description?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ComparisonDataPoint {
  name: string;
  value: number;
  count?: number;
}

export interface DistributionDataPoint {
  name: string;
  value: number;
  percentage?: number;
}

/**
 * Chart request for AI to generate
 */
export interface ChartRequest {
  type: ChartType;
  title: string;
  dataSource: "transactions" | "products" | "invoices" | "subscriptions";
  aggregation?: "sum" | "count" | "avg";
  groupBy?: "day" | "week" | "month" | "product" | "paymentMethod" | "status";
  timeRange?: "7d" | "30d" | "90d" | "custom";
  limit?: number;
}

/**
 * Chart generation event for SSE
 */
export interface ChartStartEvent {
  chartType: ChartType;
  chartId: string;
  title: string;
}

export interface ChartDataEvent {
  chartId: string;
  data: any[];
  config?: ChartConfig;
}

export interface ChartCompleteEvent {
  chartId: string;
}
