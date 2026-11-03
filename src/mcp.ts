/**
 * exitprobe MCP server. Tools: check_my_ip, lookup_ip.
 *
 * Why the low-level Server instead of McpServer: the
 * high-level helper converts zod schemas to JSON Schema and
 * injects keys that are not in this tool set's documented
 * spec ("$schema" and "additionalProperties"), which breaks
 * exact tool-list/schema parity with the spec. This file
 * serves tools/list with the spec's exact input schemas as
 * explicit literals, and the core validates every tools/call
 * argument set itself.
 *
 * Every tool returns a single text item carrying the upstream
 * JSON profile verbatim; validation and upstream failures
 * come back as isError results carrying the documented error
 * strings.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { checkMyIp, lookupIp, VERSION } from "./probe.js";

const TOOLS = [
  {
    name: "check_my_ip",
    description:
      "Profile of this machine's IPv4 / IPv6 exit: location, ASN, network type, risk level, environment score and AI service availability.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "lookup_ip",
    description:
      "Profile of the given IPv4 or IPv6 address: location, ASN, network type, risk level, environment score and AI service availability.",
    inputSchema: {
      type: "object" as const,
      properties: {
        ip: {
          type: "string",
          description: "The IPv4 or IPv6 address to look up.",
        },
      },
      required: ["ip"],
    },
  },
];

function textResult(text: string) {
  return {
    content: [{ type: "text" as const, text }],
  };
}

function errorResult(err: unknown) {
  return {
    content: [
      { type: "text" as const, text: err instanceof Error ? err.message : String(err) },
    ],
    isError: true,
  };
}

const server = new Server(
  { name: "exitprobe", version: VERSION },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const a = (args ?? {}) as Record<string, unknown>;
  try {
    let out: string;
    switch (name) {
      case "check_my_ip":
        out = await checkMyIp(a as never);
        break;
      case "lookup_ip":
        out = await lookupIp(a as never);
        break;
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
    return textResult(out);
  } catch (err) {
    if (err instanceof McpError) throw err;
    return errorResult(err);
  }
});

async function main(): Promise<void> {
  await server.connect(new StdioServerTransport());
}

void main();
