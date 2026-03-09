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
 * Handles multiple PROSES_BERPIKIR blocks (one per step)
 * Also handles common typo: BERPICAR instead of BERPIKIR
 */
async function parseAndStreamResponse(
  fullContent: string,
  sendEvent: (type: string, data?: any) => void,
  options: { streamPartialThinking?: boolean } = {}
) {
  console.log('[CoT] Parsing content, length:', fullContent.length);
  console.log('[CoT] First 200 chars:', fullContent.substring(0, 200));

  // Parse ALL thinking blocks and the final answer block
  // Handle both BERPIKIR (correct) and BERPICAR (typo)
  const thinkingRegex = /<PROSES_BERPI(?:K|C)IR>([\s\S]*?)<\/PROSES_BERPI(?:K|C)IR>/gi;
  const answerMatch = fullContent.match(/<JAWABAN>([\s\S]*?)<\/JAWABAN>/i);

  let thinkingMatches: RegExpExecArray | null;
  let allThinkingContent = "";

  // Extract all thinking blocks
  while ((thinkingMatches = thinkingRegex.exec(fullContent)) !== null) {
    allThinkingContent += thinkingMatches[1].trim() + "\n\n";
  }

  console.log('[CoT] Thinking blocks found:', allThinkingContent.length > 0, 'Answer match:', !!answerMatch);

  // If we have thinking content, stream it as "thinking" events
  if (allThinkingContent) {
    console.log('[CoT] Streaming thinking content, length:', allThinkingContent.length);

    // Stream thinking in chunks
    const chunkSize = 50;
    for (let i = 0; i < allThinkingContent.length; i += chunkSize) {
      const chunk = allThinkingContent.slice(i, i + chunkSize);
      sendEvent("thinking", { content: chunk });
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Extract final content
  let finalContent = "";

  if (answerMatch && answerMatch[1]) {
    // If we have explicit JAWABAN tags, use that content
    finalContent = answerMatch[1].trim();
  } else {
    // No JAWABAN tag found - remove all thinking blocks and see what's left
    // Handle both BERPIKIR and BERPICAR
    finalContent = fullContent
      .replace(/<PROSES_BERPI(?:K|C)IR>[\s\S]*?<\/PROSES_BERPI(?:K|C)IR>/gi, "")
      .replace(/<\/?JAWABAN>/gi, "")
      .trim();
  }

  // Only stream final content if we have something
  if (finalContent && !options.streamPartialThinking) {
    console.log('[CoT] Streaming final content, length:', finalContent.length);

    const chunkSize = 50;
    for (let i = 0; i < finalContent.length; i += chunkSize) {
      const chunk = finalContent.slice(i, i + chunkSize);
      sendEvent("content", { content: chunk });
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * Check if the buffer contains a complete thinking block
 * Handles common typos: BERPIKIR, BERPICAR
 */
function hasCompleteThinkingBlock(buffer: string): boolean {
  const thinkOpen = /<PROSES_BERPI(?:K|C)IR>/i;
  const thinkClose = /<\/PROSES_BERPI(?:K|C)IR>/i;
  return thinkOpen.test(buffer) && thinkClose.test(buffer);
}

/**
 * Check if the buffer contains a complete answer block
 */
function hasCompleteAnswerBlock(buffer: string): boolean {
  return buffer.includes('<JAWABAN>') && buffer.includes('</JAWABAN>');
}

/**
 * Check if the buffer contains an opening thinking tag but not yet closed
 * Handles both BERPIKIR and BERPICAR
 */
function hasOpenThinkingBlock(buffer: string): boolean {
  const openMatch = buffer.match(/<PROSES_BERPI(?:K|C)IR>/i);
  const closeMatch = buffer.match(/<\/PROSES_BERPI(?:K|C)IR>/i);
  return openMatch !== null && closeMatch === null;
}

/**
 * Extract and stream complete CoT blocks from buffer
 * Returns the remaining content after extracting complete blocks
 * Handles multiple PROSES_BERPIKIR blocks (and BERPICAR typo)
 * Streams thinking blocks immediately when complete
 */
async function extractAndStreamCompleteBlocks(
  buffer: string,
  sendEvent: (type: string, data?: any) => void
): Promise<string> {
  let remaining = buffer;

  // Keep processing while we have complete thinking blocks OR complete answer block
  while (hasCompleteThinkingBlock(remaining)) {
    // Find the opening and closing tags - handle both BERPIKIR and BERPICAR
    const openMatch = remaining.match(/<PROSES_BERPI(?:K|C)IR>/i);
    const closeMatch = remaining.match(/<\/PROSES_BERPI(?:K|C)IR>/i);

    if (!openMatch || openMatch.index === undefined || !closeMatch || closeMatch.index === undefined) break;

    const thinkingStartIndex = openMatch.index;
    const thinkingEndIndex = closeMatch.index + closeMatch[0].length;
    const thinkingBlock = remaining.substring(thinkingStartIndex, thinkingEndIndex);

    // Stream the thinking block immediately
    await parseAndStreamResponse(thinkingBlock, sendEvent);

    // Remove the thinking block from buffer and continue
    remaining = remaining.substring(thinkingEndIndex).trim();
  }

  // If we have a complete answer block, stream everything that's left (the answer)
  if (hasCompleteAnswerBlock(remaining)) {
    await parseAndStreamResponse(remaining, sendEvent);
    return "";
  }

  return remaining;
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
    // Set useMockMayarData setting for tools to use
    process.env.USE_MOCK_MAYAR_DATA = settings?.useMockMayarData ? "true" : "false";

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
              case 'start':
              case 'step-start':
                // Agent/step started - ignore, these are just markers
                break;

              case 'text-start':
                // Text streaming started - prepare buffer
                textBuffer = "";
                break;

              case 'text-delta':
                textBuffer += chunk.payload.text;

                // Incremental CoT streaming: extract and stream complete blocks immediately
                textBuffer = await extractAndStreamCompleteBlocks(textBuffer, sendEvent);
                break;

              case 'text-end':
                // Text streaming ended - flush remaining buffer
                if (textBuffer) {
                  await parseAndStreamResponse(textBuffer, sendEvent);
                  textBuffer = "";
                }
                break;

              case 'tool-call-input-streaming-start':
              case 'tool-call-delta':
              case 'tool-call-input-streaming-end':
                // Tool call streaming events - ignore intermediate chunks
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
                const errorPayload = chunk.payload as { error?: Error | { message?: string } | string };
                let errorMessage = 'An error occurred';

                if (typeof errorPayload?.error === 'string') {
                  errorMessage = errorPayload.error;
                } else if (errorPayload?.error instanceof Error) {
                  errorMessage = errorPayload.error.message;
                } else if (errorPayload?.error && typeof errorPayload.error === 'object' && 'message' in errorPayload.error) {
                  errorMessage = (errorPayload.error as { message: string }).message;
                }

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
                // Log other chunk types for debugging (but reduce noise for known streaming types)
                if (!chunk.type.includes('streaming') && !chunk.type.includes('delta')) {
                  console.log('[SSE] Unhandled chunk type:', chunk.type);
                }
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
