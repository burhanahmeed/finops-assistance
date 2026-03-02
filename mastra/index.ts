import { Mastra } from "@mastra/core";
import { financeOpsAgent } from "./agents/financeOps";
import { storage, memory } from "./memory";

export { memory } from "./memory";

export const mastra = new Mastra({
  agents: { financeOps: financeOpsAgent },
  workflows: {},
  storage,
});
