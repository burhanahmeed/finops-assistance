/**
 * PieChart component using Recharts
 * Displays distribution data for payment methods, product categories, etc.
 */

"use client";

import React from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { ChartConfig } from "@/types/chart";
import { formatCurrency } from "@/lib/chart-config";

interface PieChartProps {
  data: Record<string, string | number>[];
  config?: ChartConfig;
  dataKey?: string;
  nameKey?: string;
  height?: number;
  className?: string;
  showPercentage?: boolean;
}

const DEFAULT_COLORS = [
  "#10b981", // emerald-500
  "#0d9488", // teal-600
  "#14b8a6", // teal-500
  "#f59e0b", // amber-500
  "#6366f1", // indigo-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#3b82f6", // blue-500
];

export function PieChart({
  data,
  config,
  dataKey = "value",
  nameKey = "name",
  height = 300,
  className = "",
  showPercentage = true,
}: PieChartProps) {
  const colors = config?.colors || DEFAULT_COLORS;
  const showLegend = config?.showLegend ?? true;
  const showTooltip = config?.showTooltip ?? true;

  // Calculate total for percentage calculation
  const total = data.reduce((sum, entry) => {
    const value = entry[dataKey] as number;
    return sum + (typeof value === "number" ? value : 0);
  }, 0);

  // Custom label renderer
  const renderLabel = (entry: any) => {
    const value = entry[dataKey] as number | undefined;
    if (value === undefined) return "";

    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0";

    if (showPercentage) {
      return `${percentage}%`;
    }
    return entry[nameKey] as string;
  };

  // Custom tooltip formatter
  const formatTooltip = (value: any, name: any): [string, string] => {
    if (value === undefined) return ["", name];
    return [formatCurrency(Number(value)), name];
  };

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={80}
            dataKey={dataKey}
            nameKey={nameKey}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
                stroke="#ffffff"
                strokeWidth={2}
              />
            ))}
          </Pie>
          {showTooltip && (
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={formatTooltip}
            />
          )}
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
