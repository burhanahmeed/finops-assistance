/**
 * ChartMessage component
 * Renders charts within chat message bubbles
 */

"use client";

import React from "react";
import type { ChartData } from "@/types/chart";
import { ChartCard } from "./ChartCard";
import { LineChart } from "./LineChart";
import { BarChart } from "./BarChart";
import { PieChart } from "./PieChart";

interface ChartMessageProps {
  charts: ChartData[];
  className?: string;
}

export function ChartMessage({ charts, className = "" }: ChartMessageProps) {
  if (!charts || charts.length === 0) {
    return null;
  }

  const renderChart = (chart: ChartData, index: number) => {
    const { type, title, data, config, description } = chart;

    const chartContent = (
      <>
        {type === "line" && (
          <LineChart
            data={data}
            config={config}
            dataKey={config?.dataKey || "value"}
            nameKey={config?.nameKey || "name"}
            height={config?.height || 300}
          />
        )}
        {type === "bar" && (
          <BarChart
            data={data}
            config={config}
            dataKey={config?.dataKey || "value"}
            nameKey={config?.nameKey || "name"}
            height={config?.height || 300}
          />
        )}
        {type === "pie" && (
          <PieChart
            data={data}
            config={config}
            dataKey={config?.dataKey || "value"}
            nameKey={config?.nameKey || "name"}
            height={config?.height || 300}
          />
        )}
      </>
    );

    return (
      <div key={`chart-${index}`} className="w-full">
        <ChartCard title={title} description={description}>
          {chartContent}
        </ChartCard>
      </div>
    );
  };

  // If multiple charts, render in a grid
  if (charts.length > 1) {
    return (
      <div className={`space-y-4 ${className}`}>
        {charts.map((chart, index) => renderChart(chart, index))}
      </div>
    );
  }

  // Single chart
  return <div className={className}>{renderChart(charts[0], 0)}</div>;
}
