/**
 * BarChart component using Recharts
 * Displays comparison data for products, payment methods, etc.
 */

"use client";

import React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { ChartConfig } from "@/types/chart";
import { formatCurrency } from "@/lib/chart-config";

interface BarChartProps {
  data: Record<string, string | number>[];
  config?: ChartConfig;
  dataKey?: string;
  nameKey?: string;
  horizontal?: boolean;
  height?: number;
  className?: string;
}

const DEFAULT_COLORS = ["#10b981", "#0d9488", "#14b8a6", "#f59e0b", "#6366f1"];

export function BarChart({
  data,
  config,
  dataKey = "value",
  nameKey = "name",
  horizontal = false,
  height = 300,
  className = "",
}: BarChartProps) {
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
        <RechartsBarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{
            top: 5,
            right: 20,
            left: horizontal ? 60 : 0,
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
            dataKey={horizontal ? dataKey : nameKey}
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickLine={{ stroke: "#e2e8f0" }}
            axisLine={{ stroke: "#e2e8f0" }}
            angle={horizontal ? 0 : -45}
            textAnchor={horizontal ? "middle" : "end"}
            height={horizontal ? 40 : 60}
            dy={horizontal ? 0 : 10}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickLine={{ stroke: "#e2e8f0" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickFormatter={(value) => {
              if (horizontal) {
                return value.toString();
              }
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
              iconType="rect"
            />
          )}
          <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
