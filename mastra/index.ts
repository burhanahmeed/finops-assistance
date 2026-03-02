import { Mastra } from "@mastra/core";
import { financeOpsAgent } from "./agents/financeOps";
import { InMemoryStore } from "@mastra/core/storage";

// Create in-memory storage for conversation memory
// This will persist conversations during the session
const storage = new InMemoryStore();

export const mastra = new Mastra({
  agents: { financeOps: financeOpsAgent },
  workflows: {},
  storage,
});
