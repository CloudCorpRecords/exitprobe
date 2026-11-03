import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkMyIp, lookupIp, VERSION } from "../src/probe.js";
import type { FetchFn, ProbeDeps } from "../src/types.js";

/**
 * Every test runs against an injected fake fetch: no live
 * network, no live call is made.
 */

const PROFILE = JSON.stringify({
  ip: "1.2.3.4",
  location: { country: "US", city: "Exampleton" },
  asn: "AS64500 Example Networks",
  network_type: "residential",
  risk_level: "low",
  environment_score: 92,
  ai_services: { openai: true },
  report: "https://ipforai.cc/report/1.2.3.4",
});

type Reply = { status?: number; body: unknown };

function makeFetch(
  handler: (url: string) => Reply,
  captured: string[] = [],
): FetchFn {
  return async (url) => {
    captured.push(url);
    const r = handler(url);
    const status = r.status ?? 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => (typeof r.body === "string" ? r.body : JSON.stringify(r.body)),
    };
  };
}

const okFetch = (captured: string[] = []): FetchFn =>
  makeFetch(() => ({ body: PROFILE }), captured);

const throwingFetch: FetchFn = async () => {
  throw new Error("connection refused");
};

function deps(fetchFn: FetchFn, extra: Partial<ProbeDeps> = {}): ProbeDeps {
  return { fetchFn, ...extra };
}

async function expectError(promise: Promise<unknown>, message: string): Promise<void> {
  await assert.rejects(promise, (err: unknown) => {
    assert.equal(err instanceof Error ? err.message : String(err), message);
    return true;
  });
}

describe("VERSION", () => {
  it("is 0.1.0", () => {
    assert.equal(VERSION, "0.1.0");
  });
});

describe("check_my_ip", () => {
  it("returns the upstream JSON verbatim", async () => {
    assert.equal(await checkMyIp({}, deps(okFetch())), PROFILE);
  });

  it("calls GET /json on the default base URL", async () => {
    const captured: string[] = [];
    await checkMyIp({}, deps(okFetch(captured)));
    assert.deepEqual(captured, ["https://ipforai.cc/json"]);
  });

  it("uses an injectable base URL", async () => {
    const captured: string[] = [];
    await checkMyIp({}, deps(okFetch(captured), { baseUrl: "https://example.test/" }));
    assert.deepEqual(captured, ["https://example.test/json"]);
  });

  it("maps a non-2xx response to ipforai error: HTTP <status>", async () => {
    const fetchFn = makeFetch(() => ({ status: 503, body: "down" }));
    await expectError(checkMyIp({}, deps(fetchFn)), "ipforai error: HTTP 503");
  });

  it("maps a 404 to ipforai error: HTTP 404", async () => {
    const fetchFn = makeFetch(() => ({ status: 404, body: "nope" }));
    await expectError(checkMyIp({}, deps(fetchFn)), "ipforai error: HTTP 404");
  });

  it("maps a throwing fetch to ipforai unreachable", async () => {
    await expectError(checkMyIp({}, deps(throwingFetch)), "ipforai unreachable");
  });
});

describe("lookup_ip", () => {
  it("returns the upstream JSON verbatim", async () => {
    assert.equal(await lookupIp({ ip: "1.2.3.4" }, deps(okFetch())), PROFILE);
  });

  it("calls GET /json?ip=<ip>", async () => {
    const captured: string[] = [];
    await lookupIp({ ip: "1.2.3.4" }, deps(okFetch(captured)));
    assert.deepEqual(captured, ["https://ipforai.cc/json?ip=1.2.3.4"]);
  });

  it("URL-encodes an IPv6 address in the query", async () => {
    const captured: string[] = [];
    await lookupIp({ ip: "2001:db8::1" }, deps(okFetch(captured)));
    assert.deepEqual(captured, ["https://ipforai.cc/json?ip=2001%3Adb8%3A%3A1"]);
  });

  it("uses an injectable base URL", async () => {
    const captured: string[] = [];
    await lookupIp({ ip: "8.8.8.8" }, deps(okFetch(captured), { baseUrl: "https://example.test" }));
    assert.deepEqual(captured, ["https://example.test/json?ip=8.8.8.8"]);
  });

  it("maps a non-2xx response to ipforai error: HTTP <status>", async () => {
    const fetchFn = makeFetch(() => ({ status: 500, body: "boom" }));
    await expectError(lookupIp({ ip: "1.2.3.4" }, deps(fetchFn)), "ipforai error: HTTP 500");
  });

  it("maps a throwing fetch to ipforai unreachable", async () => {
    await expectError(lookupIp({ ip: "1.2.3.4" }, deps(throwingFetch)), "ipforai unreachable");
  });

  it("rejects an empty ip before any request", async () => {
    const captured: string[] = [];
    await expectError(
      lookupIp({ ip: "" }, deps(okFetch(captured))),
      "ip must be a non-empty string",
    );
    assert.deepEqual(captured, []);
  });

  it("rejects a missing ip before any request", async () => {
    const captured: string[] = [];
    await expectError(
      lookupIp({} as never, deps(okFetch(captured))),
      "ip must be a non-empty string",
    );
    assert.deepEqual(captured, []);
  });

  it("rejects a non-string ip before any request", async () => {
    const captured: string[] = [];
    await expectError(
      lookupIp({ ip: 42 } as never, deps(okFetch(captured))),
      "ip must be a non-empty string",
    );
    assert.deepEqual(captured, []);
  });

  it("rejects a null ip before any request", async () => {
    const captured: string[] = [];
    await expectError(
      lookupIp({ ip: null } as never, deps(okFetch(captured))),
      "ip must be a non-empty string",
    );
    assert.deepEqual(captured, []);
  });
});
