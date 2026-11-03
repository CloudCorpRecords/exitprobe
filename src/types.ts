/**
 * exitprobe types.
 *
 * Two tools for profiling exit IP addresses through
 * ipforai.cc. Every tool answers with a single text string:
 * the upstream JSON profile verbatim on success. External
 * access goes through an injectable fetch so tests never
 * touch the live network.
 */

export interface CheckMyIpArgs {
  // No arguments.
}

export interface LookupIpArgs {
  ip: string;
}

/** The minimal slice of a fetch Response this client relies on. */
export interface FetchResponseLike {
  ok: boolean;
  status: number;
  text(): Promise<string>;
}

/** Injectable fetch, so tests never touch the live network. */
export type FetchFn = (
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
) => Promise<FetchResponseLike>;

/** Runtime dependencies for the core, all injectable in tests. */
export interface ProbeDeps {
  /** Fetch implementation. Defaults to the global fetch. */
  fetchFn?: FetchFn;
  /** ipforai base URL. Defaults to https://ipforai.cc. */
  baseUrl?: string;
}
