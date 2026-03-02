/**
 * LineChart component using Recharts
 * Displays time-series data trends
 */

"use client";

import React from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ChartConfig } from "@/types/chart";
import { formatCurrency } from "@/lib/chart-config";

interface LineChartProps {
  data: Record<string, string | number>[];
  config?: ChartConfig;
  dataKey?: string;
  nameKey?: string;
  height?: number;
  className?: string;
}

const DEFAULT_COLORS = ["#10b981", "#0d9488", "#14b8a6"];

export function LineChart({
  data,
  config,
  dataKey = "value",
  nameKey = "name",
  height = 300,
  className = "",
}: LineChartProps) {
  const colors = config?.colors || DEFAULT_COLORS;
  const showGrid = config?.showGrid ?? true;
  const showLegend = config?.showLegend ?? true;
  const showTooltip = config?.showTooltip ?? true;

  // Custom tooltip formatter
  const formatTooltip = (value: any, name: any): [string, string] => {
    if (value === undefined) return ["", name];
    if (name === "value" || name === "Revenue") {
      return [formatCurrency(Number(value)), name];
    }
    return [String(value), name];
  };

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{
            top: 5,
            right: 20,
            left: 0,
            bottom: 5,
          }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              vertical={false}
            />
          )}
          <XAxis
            dataKey={nameKey}
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickLine={{ stroke: "#e2e8f0" }}
            axisLine={{ stroke: "#e2e8f0" }}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickLine={{ stroke: "#e2e8f0" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickFormatter={(value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
              return value.toString();
            }}
          />
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
              wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
              iconType="circle"
            />
          )}
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={colors[0]}
            strokeWidth={2}
            dot={{ fill: colors[0], r: 4 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
