import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { db } from "@/db";
import { agentLogs } from "@/db/schema";

export const generateReportTool = createTool({
  id: "generate-report",
  description: "Generate financial report and save to agent logs",
  inputSchema: z.object({
    type: z.enum(["alert", "insight", "report"]),
    message: z.string(),
  }),
  execute: async (inputData) => {
    const { type, message } = inputData;

    await db.insert(agentLogs).values({
      type,
      message,
    });

    return {
      success: true,
      message: "Report saved to logs",
    };
  },
});
