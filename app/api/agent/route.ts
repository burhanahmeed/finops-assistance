import { NextRequest } from "next/server";
import { mastra } from "@/mastra";

/**
 * Type definitions for tool results
 */
interface ChartData {
  chartType: 'line' | 'bar' | 'pie';
  title: string;
  data: any;
  config: any;
  [key: string]: any;
}

interface DashboardResult {
  isDashboard: true;
  title: string;
  description: string;
  charts: ChartData[];
}

interface ToolResult {
  isDashboard?: boolean;
  chartType?: string;
  title?: string;
  description?: string;
  charts?: ChartData[];
  data?: any;
  config?: any;
  [key: string]: any;
}

/**
 * Type guard for dashboard results
 */
function isDashboardResult(result: ToolResult): result is DashboardResult {
  return result.isDashboard === true;
}

/**
 * Type guard for chart results
 */
function isChartResult(result: ToolResult): result is ChartData {
  return 'chartType' in result && typeof result.chartType === 'string';
}

/**
 * Helper function to parse and stream Chain of Thought response
 * Parses the PROSES_BERPIKIR and JAWABAN tags and sends them separately
 */
async function parseAndStreamResponse(
  fullContent: string,
  sendEvent: (type: string, data?: any) => void
) {
  console.log('[CoT] Parsing content, length:', fullContent.length);
  console.log('[CoT] First 200 chars:', fullContent.substring(0, 200));

  // Parse the thinking process and final answer
  const thinkingMatch = fullContent.match(/<PROSES_BERPIKIR>([\s\S]*?)<\/PROSES_BERPIKIR>/i);
  const answerMatch = fullContent.match(/<JAWABAN>([\s\S]*?)<\/JAWABAN>/i);

  console.log('[CoT] Thinking match:', !!thinkingMatch, 'Answer match:', !!answerMatch);

  // If we have thinking content, stream it as "thinking" events
  if (thinkingMatch && thinkingMatch[1]) {
    const thinkingContent = thinkingMatch[1].trim();
    console.log('[CoT] Streaming thinking content, length:', thinkingContent.length);

    // Stream thinking in chunks
    const chunkSize = 50;
    for (let i = 0; i < thinkingContent.length; i += chunkSize) {
      const chunk = thinkingContent.slice(i, i + chunkSize);
      sendEvent("thinking", { content: chunk });
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Extract final content
  let finalContent = fullContent;

  if (answerMatch && answerMatch[1]) {
    // If we have explicit JAWABAN tags, use that content
    finalContent = answerMatch[1].trim();
  } else if (thinkingMatch) {
    // If we only have thinking tags, get content after them
    const parts = fullContent.split(/<\/PROSES_BERPIKIR>/i);
    if (parts[1]) {
      finalContent = parts[1]
        .replace(/<\/?JAWABAN>/gi, "")
        .trim();
    }
  } else {
    // No tags found, send everything as content
    finalContent = fullContent.trim();
  }

  console.log('[CoT] Streaming final content, length:', finalContent.length);

  // Stream final content in chunks
  if (finalContent) {
    const chunkSize = 50;
    for (let i = 0; i < finalContent.length; i += chunkSize) {
      const chunk = finalContent.slice(i, i + chunkSize);
      sendEvent("content", { content: chunk });
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 100));
}

/**
 * API Route for FinanceOps Agent Streaming
 *
 * This route uses Mastra's built-in streaming capabilities to handle
 * agent interactions. The agent intelligently decides which tools to use
 * based on the user's request.
 *
 * Features:
 * - Chain-of-thought parsing (PROSES_BERPIKIR/JAWABAN tags)
 * - Conversation memory support
 * - Tool execution with chart/dashboard support
 */
export async function POST(req: NextRequest) {
  try {
    const { message, settings, threadId } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract API key from settings
    const geminiApiKey = settings?.geminiApiKey || process.env.GEMINI_API_KEY || "";
    const mayarApiKey = settings?.mayarApiKey || "";

    // Use threadId from request or generate a default one
    const conversationThreadId = threadId || "default-thread";

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "Gemini API key is required. Please configure it in settings." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Store the original API keys to restore later
    const originalGeminiKey = process.env.GEMINI_API_KEY;
    const originalMayarKey = process.env.MAYAR_API_KEY;
    process.env.GEMINI_API_KEY = geminiApiKey;
    // Set Mayar API key if provided (for tools to use)
    if (mayarApiKey) {
      process.env.MAYAR_API_KEY = mayarApiKey;
    }

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (type: string, data: any = {}) => {
          const eventData = { type, ...data };
          const event = `data: ${JSON.stringify(eventData)}\n\n`;
          controller.enqueue(encoder.encode(event));
        };

        try {
          // Get the FinanceOps agent from Mastra
          const agent = mastra.getAgent('financeOps');

          // Stream the agent's response with memory support
          const mastraOutput = await agent.stream(message, {
            maxSteps: 20,
            memory: {
              thread: conversationThreadId,
              resource: "financeops-chat",
            },
          });

          // Buffer to collect text for chain-of-thought parsing
          let textBuffer = "";

          // Iterate over the full stream and handle different chunk types
          const reader = mastraOutput.fullStream.getReader();

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              console.log('[SSE] Stream done');
              // Flush any remaining buffered text
              if (textBuffer) {
                await parseAndStreamResponse(textBuffer, sendEvent);
              }
              break;
            }

            const chunk = value;

            // Handle different chunk types from Mastra
            switch (chunk.type) {
              case 'text-delta':
                // Buffer text - don't stream yet
                textBuffer += chunk.payload.text;
                break;

              case 'tool-call':
                // Flush buffered text before tool call
                if (textBuffer) {
                  await parseAndStreamResponse(textBuffer, sendEvent);
                  textBuffer = "";
                }

                // Tool execution started
                console.log(`[SSE] Tool call: ${chunk.payload.toolName}`);
                sendEvent('tool_start', {
                  tool: chunk.payload.toolName,
                  args: chunk.payload.args,
                });
                break;

              case 'tool-result':
                // Tool execution completed
                const result = chunk.payload.result as ToolResult | undefined;
                console.log(`[SSE] Tool result: ${chunk.payload.toolName}`);

                // Check if the result is a chart or dashboard
                if (result && typeof result === 'object') {
                  if (isDashboardResult(result)) {
                    // Handle dashboard result
                    sendEvent('dashboard_start', {
                      title: result.title,
                      description: result.description,
                    });
                    if (result.charts && Array.isArray(result.charts)) {
                      for (const chart of result.charts) {
                        sendEvent('chart_data', chart);
                      }
                    }
                  } else if (isChartResult(result)) {
                    // Handle single chart result
                    sendEvent('chart_data', result);
                  } else {
                    // Handle regular tool result
                    sendEvent('tool_end', {
                      tool: chunk.payload.toolName,
                      result,
                    });
                  }
                } else {
                  // Handle non-object tool results
                  sendEvent('tool_end', {
                    tool: chunk.payload.toolName,
                    result,
                  });
                }
                break;

              case 'error':
                // Flush buffered text before error
                if (textBuffer) {
                  await parseAndStreamResponse(textBuffer, sendEvent);
                  textBuffer = "";
                }

                // Handle error
                console.error('[SSE] Agent error:', chunk.payload);
                const errorMessage = chunk.payload?.error instanceof Error
                  ? chunk.payload.error.message
                  : 'An error occurred';
                sendEvent('error', { message: errorMessage });
                break;

              case 'step-finish':
                // Flush buffered text at end of step
                if (textBuffer) {
                  await parseAndStreamResponse(textBuffer, sendEvent);
                  textBuffer = "";
                }
                console.log('[SSE] Step finished');
                break;

              case 'finish':
                // Flush any remaining buffered text
                if (textBuffer) {
                  await parseAndStreamResponse(textBuffer, sendEvent);
                  textBuffer = "";
                }
                console.log('[SSE] Agent finished');
                break;

              default:
                // Log other chunk types for debugging
                console.log('[SSE] Unhandled chunk type:', chunk.type);
                break;
            }
          }

          // Send done event
          sendEvent("done", {});
          await new Promise((resolve) => setTimeout(resolve, 100));
          controller.close();
        } catch (error) {
          console.error("[SSE] Stream error:", error);
          sendEvent("error", {
            message: error instanceof Error ? error.message : "Unknown error",
          });
          await new Promise((resolve) => setTimeout(resolve, 200));
          controller.close();
        } finally {
          // Restore the original API keys
          process.env.GEMINI_API_KEY = originalGeminiKey;
          process.env.MAYAR_API_KEY = originalMayarKey;
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Agent] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to process request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
