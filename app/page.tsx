"use client";

import { useState, useRef, useEffect } from "react";
import { MarkdownMessage } from "@/components/MarkdownMessage";
import { ThinkingBlock } from "@/components/ThinkingBlock";
import { ToolExecution, ToolCall } from "@/components/ToolExecution";
import { ChartMessage, DashboardLayout } from "@/components/charts";
import type { ChartData } from "@/types/chart";

export interface ToolCallData {
  toolName: string;
  status: "pending" | "running" | "completed" | "failed";
  result?: any;
  timestamp: Date;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolCalls?: ToolCallData[];
  charts?: ChartData[];
  dashboard?: boolean;
  dashboardTitle?: string;
  dashboardDescription?: string;
}

interface Settings {
  mayarApiKey: string;
  geminiApiKey: string;
  useMockMayarData: boolean;
}

const STORAGE_KEY = "financeops_settings";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Halo! Saya AI CFO kamu. Saya bantu monitor keuangan bisnismu dan kasih rekomendasi. Ada yang bisa saya bantu hari ini?",
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    mayarApiKey: "",
    geminiApiKey: "",
    useMockMayarData: false,
  });
  const [hasConfigured, setHasConfigured] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setSettings(parsed);
      setHasConfigured(!!parsed.geminiApiKey);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const saveSettings = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setHasConfigured(!!settings.geminiApiKey);
    setShowSettings(false);
  };

  const clearSettings = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSettings({
      mayarApiKey: "",
      geminiApiKey: "",
      useMockMayarData: false,
    });
    setHasConfigured(false);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    // Check if configured
    if (!settings.geminiApiKey) {
      setShowSettings(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Create placeholder for streaming message
    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      thinking: "",
      timestamp: new Date(),
      isStreaming: true,
      toolCalls: [],
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          settings: {
            geminiApiKey: settings.geminiApiKey,
            mayarApiKey: settings.mayarApiKey,
            useMockMayarData: settings.useMockMayarData,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to server");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let buffer = "";
      let isComplete = false;

      while (!isComplete) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, isStreaming: false }
                    : msg
                )
              );
              isComplete = true;
              break;
            }

            try {
              const event = JSON.parse(data);
              console.log("[Frontend] Received SSE event:", event);

              setMessages((prev) =>
                prev.map((msg) => {
                  if (msg.id !== assistantId) return msg;

                  const updated = { ...msg };

                  if (event.type === "content") {
                    updated.content = msg.content + event.content;
                  } else if (event.type === "thinking") {
                    updated.thinking = (msg.thinking || "") + event.content;
                  } else if (event.type === "tool_start") {
                    updated.toolCalls = [
                      ...(msg.toolCalls || []),
                      { toolName: event.tool, status: "running" as const, timestamp: new Date() },
                    ];
                  } else if (event.type === "tool_end") {
                    updated.toolCalls = (msg.toolCalls || []).map((tc) =>
                      tc.toolName === event.tool
                        ? { ...tc, status: event.error ? "failed" : "completed", result: event.result }
                        : tc
                    );
                  } else if (event.type === "chart_data") {
                    console.log("[Frontend] Processing chart_data event:", event);
                    updated.charts = [
                      ...(msg.charts || []),
                      {
                        type: event.chartType,
                        title: event.title || "",
                        data: event.data || [],
                        config: event.config,
                      },
                    ];
                    console.log("[Frontend] Updated charts array:", updated.charts);
                  } else if (event.type === "dashboard_start") {
                    console.log("[Frontend] Processing dashboard_start event");
                    updated.dashboard = true;
                    updated.dashboardTitle = event.title || "";
                    updated.dashboardDescription = event.description || "";
                  }

                  return updated;
                })
              );
            } catch (e) {
              console.error("Failed to parse SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content: "Maaf, gagal terhubung ke server. Coba lagi ya.",
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Konfigurasi API</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                API keys disimpan di browser kamu (localStorage)
              </p>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Gemini API Key */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Gemini API Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={settings.geminiApiKey}
                  onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                  placeholder="AIza..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                />
                <p className="text-xs text-slate-400 mt-1">Diperlukan untuk AI agent</p>
              </div>

              {/* Mock Mayar Data Toggle */}
              <div className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Gunakan Data Mock Mayar
                  </label>
                  <p className="text-xs text-slate-400">
                    Mode demo untuk testing tanpa API key Mayar
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, useMockMayarData: !settings.useMockMayarData })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.useMockMayarData ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.useMockMayarData ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Mayar API Key */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mayar API Key
                </label>
                <input
                  type="password"
                  value={settings.mayarApiKey}
                  onChange={(e) => setSettings({ ...settings, mayarApiKey: e.target.value })}
                  placeholder="Mayar API Key"
                  disabled={settings.useMockMayarData}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${
                    settings.useMockMayarData
                      ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  }`}
                />
                <p className={`text-xs mt-1 ${
                  settings.useMockMayarData ? "text-emerald-600" : "text-slate-400"
                }`}>
                  {settings.useMockMayarData
                    ? "Mock mode aktif - data palsu akan digunakan"
                    : "Opsional - untuk ambil data transaksi"}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={saveSettings}
                  disabled={!settings.geminiApiKey}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Simpan
                </button>
              </div>
              <button
                onClick={clearSettings}
                className="w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
              >
                Hapus Semua Data (Reset)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${hasConfigured ? "bg-emerald-500" : "bg-amber-500"}`}></span>
            </div>
            <div>
              <h1 className="font-semibold text-slate-900">FinanceOps AI</h1>
              <p className="text-xs text-slate-500">
                {hasConfigured ? "Terhubung" : "Belum dikonfigurasi"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className={`p-2 rounded-lg transition-colors ${hasConfigured ? "text-slate-400 hover:text-slate-600 hover:bg-slate-100" : "text-amber-500 hover:bg-amber-50"}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {!hasConfigured && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">Konfigurasi Diperlukan</p>
                <p className="text-sm text-amber-700 mt-1">
                  Silakan atur API key Gemini kamu di pengaturan untuk mulai menggunakan aplikasi.
                </p>
                <button
                  onClick={() => setShowSettings(true)}
                  className="mt-2 text-sm font-medium text-amber-800 underline hover:no-underline"
                >
                  Buka Pengaturan →
                </button>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar */}
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex-shrink-0 flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Message Bubble */}
                <div className="flex-1">
                  {/* Thinking Block */}
                  {msg.role === "assistant" && msg.thinking && (
                    <ThinkingBlock thinking={msg.thinking} />
                  )}

                  {/* Tool Execution */}
                  {msg.role === "assistant" && msg.toolCalls && msg.toolCalls.length > 0 && (
                    <ToolExecution toolCalls={msg.toolCalls} />
                  )}

                  {/* Charts/Dashboard */}
                  {msg.role === "assistant" && msg.charts && msg.charts.length > 0 && (() => {
                    console.log("[Render] Rendering chart for message:", msg.id, "Charts:", msg.charts);
                    return true;
                  })() && (
                    <div className="my-3">
                      {msg.dashboard ? (
                        <DashboardLayout
                          charts={msg.charts}
                          title={msg.dashboardTitle}
                          description={msg.dashboardDescription}
                        />
                      ) : (
                        <ChartMessage charts={msg.charts} />
                      )}
                    </div>
                  )}

                  {/* Message Content */}
                  <div className={`px-4 py-3 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white rounded-br-sm"
                      : "bg-white text-slate-800 rounded-bl-sm shadow-sm border border-slate-200"
                  }`}>
                    {msg.role === "assistant" ? (
                      <MarkdownMessage
                        content={msg.content || (msg.isStreaming ? "..." : "")}
                      />
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    )}
                  </div>
                  <p className={`text-xs text-slate-400 mt-1 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                    {msg.timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {loading && messages.filter(m => m.isStreaming).length === 0 && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex-shrink-0 flex items-center justify-center mt-1">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm shadow-sm border border-slate-200 px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={hasConfigured ? "Ketik pesan kamu..." : "Konfigurasi API key dulu..."}
              className="flex-1 px-4 py-3 bg-slate-100 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm"
              rows={1}
              disabled={loading || !hasConfigured}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || !hasConfigured}
              className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Tekan Enter untuk kirim • Shift + Enter untuk baris baru
          </p>
        </div>
      </div>
    </div>
  );
}
