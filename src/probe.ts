/**
 * exitprobe core: exit-IP profiles from ipforai.cc.
 *
 * Two lookups, both returning the upstream JSON body verbatim
 * as the result text (the profile is the API's own shape:
 * location, ASN, network type — residential / ISP /
 * datacenter / proxy / Tor — access and routing type, risk
 * level, environment score, AI service availability, and a
 * link to the full report):
 *
 *   check_my_ip  -> GET /json
 *   lookup_ip    -> GET /json?ip=<ip>   (documented
 *                   reconstruction: the upstream README pins
 *                   the /json endpoint but not the
 *                   per-address lookup path)
 *
 * All upstream access goes through an injectable fetch; the
 * base URL defaults to https://ipforai.cc and is injectable
 * in the core. A non-2xx response is
 * `ipforai error: HTTP <status>` and a throwing fetch is
 * `ipforai unreachable`. Argument validation happens before
 * any request: lookup_ip's `ip` must be a non-empty string,
 * else `ip must be a non-empty string`.
 */
import type { CheckMyIpArgs, FetchFn, LookupIpArgs, ProbeDeps } from "./types.js";

export const VERSION = "0.1.0";

export const IPFORAI_BASE_URL = "https://ipforai.cc";

const defaultFetch: FetchFn = async (url, init) => {
  const res = await fetch(url, init);
  return { ok: res.ok, status: res.status, text: () => res.text() };
};

async function fetchProfile(deps: ProbeDeps, path: string): Promise<string> {
  const fetchFn = deps.fetchFn ?? defaultFetch;
  const base = (deps.baseUrl ?? IPFORAI_BASE_URL).replace(/\/+$/, "");
  let res;
  try {
    res = await fetchFn(`${base}${path}`);
  } catch {
    throw new Error("ipforai unreachable");
  }
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`ipforai error: HTTP ${res.status}`);
  }
  return res.text();
}

/** Profile of this machine's IPv4 / IPv6 exit. */
export async function checkMyIp(
  _args: CheckMyIpArgs = {},
  deps: ProbeDeps = {},
): Promise<string> {
  return fetchProfile(deps, "/json");
}

/** Profile of the given IPv4 or IPv6 address. */
export async function lookupIp(args: LookupIpArgs, deps: ProbeDeps = {}): Promise<string> {
  const raw = (args ?? {}) as unknown as Record<string, unknown>;
  const ip = raw.ip;
  if (typeof ip !== "string" || ip.length === 0) {
    throw new Error("ip must be a non-empty string");
  }
  return fetchProfile(deps, `/json?ip=${encodeURIComponent(ip)}`);
}
