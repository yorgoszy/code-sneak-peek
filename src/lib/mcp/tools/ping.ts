import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "ping",
  title: "Ping",
  description: "Health-check tool. Returns 'pong' and the current server time to verify MCP connectivity.",
  inputSchema: {
    message: z.string().optional().describe("Optional message to echo back."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ message }) => ({
    content: [
      {
        type: "text",
        text: `pong${message ? `: ${message}` : ""} — ${new Date().toISOString()}`,
      },
    ],
  }),
});
