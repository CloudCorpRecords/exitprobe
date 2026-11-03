# exitprobe — Build Report (Batch 22)

Rebuild of the `ipforai-mcp` MCP server (npm `ipforai-mcp`,
registry `cc.ipforai/ipforai`) from the firsthand spec in
`specs-batch22/exitprobe.md`. Built 2026-10-27.

## Identity

- npm: `@reneturcios/exitprobe` @ 0.1.0, bin `exitprobe` →
  `dist/cli.js`
- MCP Registry name: `io.github.CloudCorpRecords/exitprobe`
  (matches `package.json` `mcpName`, `server.json` `name`,
  and the Dockerfile `io.modelcontextprotocol.server.name`
  label)
- server.json description (89 chars, verified): "Check
  whether an exit IP works for AI services: ASN, network
  type, risk, AI availability."
- server.json: npm package entry carries `"version":
  "0.1.0"`; the OCI entry
  (`ghcr.io/cloudcorprecords/exitprobe:0.1.0`) carries **no**
  `version` field (verified).

## Files (19-file factory set, per TEMPLATE.md §2)

package.json, server.json, Dockerfile, tsconfig.json
(byte-identical to builds/fairdraw/tsconfig.json, verified
with `cmp`), .gitignore, package-lock.json, README.md
(fresh prose), LICENSE (MIT, © 2026 Rene Turcios),
CHANGELOG.md (single 0.1.0 entry dated 2026-10-27),
src/index.ts, src/cli.ts, src/mcp.ts, src/types.ts,
src/probe.ts (core), test/probe.test.ts, and the four
workflows under .github/workflows/ (publish-container
adapted: IMAGE ghcr.io/cloudcorprecords/exitprobe, smoke
assertion on server name `exitprobe`). Plus this
BUILD-REPORT.md and the parity-out/ artifacts.

## Implementation

- `src/mcp.ts`: low-level `Server` API
  (`sdk/server/index.js` + `StdioServerTransport`, handlers
  for `ListToolsRequestSchema` / `CallToolRequestSchema`
  from `sdk/types.js`), explicit JSON-schema literals for
  both tools (`check_my_ip`, `lookup_ip`); no
  McpServer/zod registration. Tool descriptions,
  per-property descriptions, types and `required` lists are
  the fixture's, exactly.
- `src/probe.ts`: exports `VERSION = "0.1.0"`. All upstream
  access goes through an injectable fetch; the base URL
  defaults to `https://ipforai.cc` and is injectable in the
  core. `check_my_ip` calls `GET /json`; `lookup_ip` calls
  `GET /json?ip=<ip>` (URL-encoded). A successful call
  returns the upstream JSON body verbatim as the result
  text. Non-2xx → `ipforai error: HTTP <status>`; a
  throwing fetch → `ipforai unreachable`. Validation runs
  before any request: `lookup_ip`'s `ip` must be a
  non-empty string, else `ip must be a non-empty string`.
- CLI: `check_my_ip` takes no argument, `lookup_ip` takes
  one JSON argument string, plus `mcp` and `--version`;
  unknown subcommand → usage on stderr, exit 2; isError
  results exit 1 (verified: a validation failure via the
  CLI exits 1 with the pinned error text, and an argument
  passed to `check_my_ip` is a usage error, exit 2).

## Verification (all real, run 2026-10-27)

- `npm run build` (tsc): exit 0. `npx tsc --noEmit`:
  exit 0.
- `npm test`: **17 tests, 17 pass, 0 fail** — fake fetch
  only, no live network. Covers VERSION, verbatim return
  for both tools, the `/json` and `/json?ip=` URLs,
  IPv6 URL-encoding, the injectable base URL, HTTP-error
  and unreachable mapping for both tools, and every
  `lookup_ip` validation case (empty / missing /
  non-string / null `ip`, each proven to happen before
  any request).
- `node dist/cli.js --version`: `0.1.0`; unknown command:
  usage on stderr, exit 2.
- Parity: `python3 harness/parity.py --original
  harness/fixtures/ipforai-mcp-tools-original.json
  --rebuild "stdio:node builds/exitprobe/dist/cli.js mcp"
  --out builds/exitprobe/parity-out` →
  **verdict=PASS parity_pct=100.0, 2/2 tools identical,
  no schema diffs**.
- Lockfile: Route 3 only — clean temp dir with
  package.json alone, `npm install --package-lock-only
  --ignore-scripts --offline`; parses, name
  `@reneturcios/exitprobe`, **128 package entries**.
  Dependencies installed in the build dir with
  `npm install --offline --ignore-scripts` (exit 0).

## Gap notes / deviations (from the spec, verbatim)

- The per-address lookup wire (`/json?ip=`) is a documented
  reconstruction; the profile JSON is returned verbatim, so
  any upstream field naming is the upstream's own. This is
  labelled in the spec, in the fixture `_source`, in
  `src/probe.ts`, and in the README.
- No live ipforai.cc call was made; behaviour is proven
  against fake fetch only.
- No push, no publish.
