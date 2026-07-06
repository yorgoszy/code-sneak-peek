import { defineMcp } from "@lovable.dev/mcp-js";
import pingTool from "./tools/ping";
import appInfoTool from "./tools/app-info";

export default defineMcp({
  name: "hyperkids-mcp",
  title: "Hyperkids MCP",
  version: "0.1.0",
  instructions:
    "MCP server for the Hyperkids athletic training platform. Use `ping` to verify connectivity and `app_info` to fetch basic app metadata. Additional tools can be added over time.",
  tools: [pingTool, appInfoTool],
});
