import { InMemoryStore } from "@mastra/core/storage";
import { Memory } from "@mastra/memory";

// Create in-memory storage for conversation memory
// This will persist conversations during the session
const storage = new InMemoryStore();

// Create memory instance for conversation persistence
export const memory = new Memory({ storage });

// Export storage for use in Mastra instance
export { storage };
