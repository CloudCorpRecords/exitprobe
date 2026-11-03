#!/usr/bin/env node
/**
 * exitprobe CLI.
 *
 *   exitprobe check_my_ip
 *   exitprobe lookup_ip '<json>'
 *   exitprobe mcp
 *   exitprobe --version
 *
 * Tool subcommands mirror the MCP tools: `lookup_ip` takes
 * one JSON argument string with the tool's arguments and
 * `check_my_ip` takes none. Each prints the tool's result
 * text. Exit codes: 0 success, 1 runtime error, 2 usage
 * error.
 */
import { checkMyIp, lookupIp, VERSION } from "./probe.js";

const TOOL_NAMES = ["check_my_ip", "lookup_ip"] as const;

function usage(): never {
  console.error(`Usage:
  exitprobe check_my_ip
  exitprobe lookup_ip '<json-args>'
  exitprobe mcp
  exitprobe --version`);
  process.exit(2);
}

async function runTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "check_my_ip":
      return checkMyIp(args as never);
    case "lookup_ip":
      return lookupIp(args as never);
    default:
      usage();
  }
}

async function main(): Promise<void> {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === "--version" || cmd === "-v") {
    console.log(VERSION);
    return;
  }
  if (cmd === "mcp") {
    if (rest.length !== 0) usage();
    await import("./mcp.js");
    return;
  }
  if (!(TOOL_NAMES as readonly string[]).includes(cmd ?? "")) usage();
  if (cmd === "check_my_ip" && rest.length !== 0) usage();
  if (rest.length > 1) usage();
  let args: Record<string, unknown> = {};
  if (rest.length === 1) {
    try {
      const parsed: unknown = JSON.parse(rest[0]);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) usage();
      args = parsed as Record<string, unknown>;
    } catch {
      console.error("error: argument must be a JSON object string");
      process.exit(2);
    }
  }
  try {
    const out = await runTool(cmd, args);
    console.log(out);
  } catch (err) {
    console.error(`error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

void main();
