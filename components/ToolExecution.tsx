import { useState } from "react";

export type ToolStatus = "pending" | "running" | "completed" | "failed";

export interface ToolCall {
  toolName: string;
  status: ToolStatus;
  result?: any;
  timestamp: Date;
}

interface ToolExecutionProps {
  toolCalls: ToolCall[];
}

export function ToolExecution({ toolCalls }: ToolExecutionProps) {
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  if (toolCalls.length === 0) {
    return null;
  }

  const getStatusColor = (status: ToolStatus) => {
    switch (status) {
      case "pending":
        return "bg-slate-200 text-slate-600";
      case "running":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-emerald-100 text-emerald-700";
      case "failed":
        return "bg-red-100 text-red-700";
    }
  };

  const getStatusIcon = (status: ToolStatus) => {
    switch (status) {
      case "running":
        return (
          <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      case "completed":
        return (
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        );
      case "failed":
        return (
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatToolName = (name: string) => {
    return name
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  return (
    <div className="mb-3 space-y-2">
      <p className="text-xs font-medium text-slate-500 mb-2">Tool Execution:</p>
      {toolCalls.map((tool) => (
        <div key={tool.toolName} className="inline-block mr-2 mb-2">
          <button
            onClick={() => setExpandedTool(expandedTool === tool.toolName ? null : tool.toolName)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all ${getStatusColor(
              tool.status
            )} ${tool.status !== "completed" && tool.status !== "failed" ? "cursor-not-allowed" : "cursor-pointer hover:opacity-80"}`}
            disabled={tool.status === "running" || tool.status === "pending"}
          >
            {getStatusIcon(tool.status)}
            <span>{formatToolName(tool.toolName)}</span>
          </button>

          {expandedTool === tool.toolName && tool.result && (
            <div className="mt-2 ml-2 p-2 bg-slate-900 rounded-lg text-xs">
              <pre className="text-emerald-400 overflow-x-auto">
                {JSON.stringify(tool.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
