import { useState } from "react";
import { MarkdownMessage } from "./MarkdownMessage";

interface ThinkingBlockProps {
  thinking: string;
}

export function ThinkingBlock({ thinking }: ThinkingBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Parse thinking content - preserve the full stream
  const thinkingLines = thinking
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      // Remove numbering prefix if present, but keep markdown formatting
      return line.replace(/^\d+\.\s*/, "").trim();
    })
    .filter((line) => line.length > 0);

  if (thinkingLines.length === 0) {
    return null;
  }

  // Format as markdown list for better rendering
  const formattedThinking = thinkingLines.map(line => `- ${line}`).join("\n");

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors mb-2"
      >
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Proses Berpikir
          {thinkingLines.length > 0 && (
            <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-xs">
              {thinkingLines.length}
            </span>
          )}
        </span>
      </button>

      {isExpanded && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-60 overflow-y-auto">
          <MarkdownMessage
            content={formattedThinking}
            className="text-xs"
          />
        </div>
      )}
    </div>
  );
}
