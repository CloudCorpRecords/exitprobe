# Changelog

## 0.1.0 (2026-10-27)

- Initial release: two MCP tools and matching CLI subcommands
  for profiling exit IP addresses — `check_my_ip` (profile of
  this machine's exit) and `lookup_ip` (profile of a given
  IPv4 or IPv6 address).
- A successful call returns the upstream ipforai.cc JSON
  profile verbatim, covering location, ASN, network type,
  risk level, environment score and AI service availability.
- Upstream failures surface as `ipforai error: HTTP <status>`
  and a throwing fetch as `ipforai unreachable`; `lookup_ip`
  validates its `ip` argument before any request.
