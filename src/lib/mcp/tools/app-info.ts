import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "app_info",
  title: "App info",
  description: "Returns basic metadata about the Hyperkids app (name, description, public URL).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            name: "HYPERKIDS",
            description:
              "HYPERKIDS — Athletic training, nutrition, program builder, competitions, and coaching platform.",
            url: "https://hyperkids.gr",
          },
          null,
          2,
        ),
      },
    ],
  }),
});
