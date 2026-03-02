/**
 * DashboardLayout component
 * Responsive grid layout for multi-chart dashboards
 */

"use client";

import React from "react";
import type { ChartData } from "@/types/chart";
import { ChartCard } from "./ChartCard";
import { LineChart } from "./LineChart";
import { BarChart } from "./BarChart";
import { PieChart } from "./PieChart";

interface DashboardLayoutProps {
  charts: ChartData[];
  title?: string;
  description?: string;
  className?: string;
}

export function DashboardLayout({
  charts,
  title,
  description,
  className = "",
}: DashboardLayoutProps) {
  if (!charts || charts.length === 0) {
    return null;
  }

  const renderChart = (chart: ChartData, index: number) => {
    const { type, title: chartTitle, data, config, description: chartDescription } = chart;

    const chartContent = (
      <>
        {type === "line" && (
          <LineChart
            data={data}
            config={config}
            dataKey={config?.dataKey || "value"}
            nameKey={config?.nameKey || "name"}
            height={config?.height || 250}
          />
        )}
        {type === "bar" && (
          <BarChart
            data={data}
            config={config}
            dataKey={config?.dataKey || "value"}
            nameKey={config?.nameKey || "name"}
            height={config?.height || 250}
          />
        )}
        {type === "pie" && (
          <PieChart
            data={data}
            config={config}
            dataKey={config?.dataKey || "value"}
            nameKey={config?.nameKey || "name"}
            height={config?.height || 250}
          />
        )}
      </>
    );

    return (
      <div key={`dashboard-chart-${index}`}>
        <ChartCard title={chartTitle} description={chartDescription}>
          {chartContent}
        </ChartCard>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Dashboard Header */}
      {(title || description) && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          {title && (
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          )}
        </div>
      )}

      {/* Charts Grid */}
      {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {charts.map((chart, index) => renderChart(chart, index))}
      </div>
    </div>
  );
}
