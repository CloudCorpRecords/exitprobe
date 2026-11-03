# exitprobe

An exit IP can look perfectly ordinary and still be useless
for AI services: it may sit in a datacenter range, arrive
through a proxy, or carry a risk profile that providers
quietly refuse. exitprobe asks ipforai.cc to profile an exit
address before you find that out the hard way.

The profile it returns covers the location, the ASN, the
network type (residential, ISP, datacenter, proxy or Tor),
the access and routing type, a risk level, an environment
score, and whether common AI services are reachable from
that exit, along with a link to the full report. exitprobe
adds nothing of its own to that answer: a successful call
hands the upstream JSON back verbatim, exactly as ipforai.cc
produced it.

The two tools:

- `check_my_ip` — profile the exit this machine actually
  uses, for both its IPv4 and IPv6 addresses where present.
  Handy as a pre-flight check before routing work through a
  new connection.
- `lookup_ip` — profile any IPv4 or IPv6 address you name,
  so you can vet a candidate exit before anything depends
  on it.

## A note on the lookup wire

`check_my_ip` is served from ipforai.cc's documented `/json`
endpoint. For `lookup_ip`, the upstream documentation pins
that the server calls ipforai.cc's `/json` and exit echo
endpoints but does not pin the per-address lookup path, so
this rebuild uses `GET /json?ip=<ip>` — a documented
reconstruction, not a verified upstream contract. Because
the profile JSON is returned verbatim either way, any field
naming in the result is the upstream's own.

## CLI

```bash
npx @reneturcios/exitprobe check_my_ip
npx @reneturcios/exitprobe lookup_ip '{"ip":"1.2.3.4"}'
npx @reneturcios/exitprobe --version
```

`check_my_ip` takes no argument; `lookup_ip` takes one JSON
argument string. Output is the tool's result text (the
upstream JSON profile). Exit codes: `0` on success, `1` on
a runtime error (including a validation or upstream
failure), `2` on a usage error.

Failures are reported plainly: a non-2xx upstream response
is `ipforai error: HTTP <status>`, an unreachable upstream
is `ipforai unreachable`, and a missing or empty `ip`
argument is `ip must be a non-empty string` — checked
before any request is made.

## MCP server

```bash
npx -y @reneturcios/exitprobe mcp
```

MCP client config:

```json
{
  "mcpServers": {
    "exitprobe": {
      "command": "npx",
      "args": ["-y", "@reneturcios/exitprobe", "mcp"]
    }
  }
}
```

## Docker

```bash
docker run -i ghcr.io/cloudcorprecords/exitprobe
docker run --rm ghcr.io/cloudcorprecords/exitprobe lookup_ip '{"ip":"1.2.3.4"}'
```

## Development

```bash
npm install
npm run build   # tsc -> dist/
npm test        # tsx --test test/*.test.ts (fake fetch only, no network)
npm run dev     # run the CLI from source
```

## License

MIT — Copyright (c) 2026 Rene Turcios
