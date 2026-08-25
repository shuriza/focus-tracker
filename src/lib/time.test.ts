import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  domainMatches,
  formatDuration,
  isTrackableUrl,
  lastNDates,
  normalizeDomain,
  todayISO,
} from "./time";

describe("normalizeDomain", () => {
  it("strips protocol, www, path, and port", () => {
    assert.equal(normalizeDomain("https://www.YouTube.com/watch?v=1"), "youtube.com");
    assert.equal(normalizeDomain("m.youtube.com:443/feed"), "m.youtube.com");
  });

  it("rejects local and empty hosts", () => {
    assert.equal(normalizeDomain("localhost"), "");
    assert.equal(normalizeDomain("127.0.0.1"), "");
    assert.equal(normalizeDomain(""), "");
  });
});

describe("domainMatches", () => {
  it("matches exact host and subdomains", () => {
    assert.equal(domainMatches("youtube.com", "youtube.com"), true);
    assert.equal(domainMatches("m.youtube.com", "youtube.com"), true);
    assert.equal(domainMatches("notyoutube.com", "youtube.com"), false);
  });
});

describe("isTrackableUrl", () => {
  it("allows http(s) public hosts only", () => {
    assert.equal(isTrackableUrl("https://x.com/home"), true);
    assert.equal(isTrackableUrl("chrome://extensions"), false);
    assert.equal(isTrackableUrl("http://localhost:3000"), false);
  });
});

describe("dates", () => {
  it("formats today and a 7-day window", () => {
    const now = new Date(2026, 7, 23);
    assert.equal(todayISO(now), "2026-08-23");
    assert.deepEqual(lastNDates(7, now), [
      "2026-08-17",
      "2026-08-18",
      "2026-08-19",
      "2026-08-20",
      "2026-08-21",
      "2026-08-22",
      "2026-08-23",
    ]);
    assert.equal(lastNDates(7, now).length, 7);
  });
});

describe("formatDuration", () => {
  it("renders hours and minutes in Indonesian units", () => {
    assert.equal(formatDuration(45), "45s");
    assert.equal(formatDuration(125), "2m 5s");
    assert.equal(formatDuration(3725), "1j 2m");
  });
});
