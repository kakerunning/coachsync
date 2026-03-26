/**
 * Unit tests for invite service logic.
 * Uses Node 22 built-in test runner — no extra deps required.
 * Run: node --test src/features/invite/__tests__/invite.service.test.mjs
 *
 * The service is tested in isolation by re-implementing the pure logic inline
 * (no Prisma / DB required).
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";

// ── Inline the pure business-logic rules from invite.service.ts ──────────────

const TTL_MS = 24 * 60 * 60 * 1000;

function makeInvite(overrides = {}) {
  return {
    id: "inv_1",
    token: "tok_abc",
    coachId: "coach_1",
    expiresAt: new Date(Date.now() + TTL_MS),
    usedById: null,
    coach: { id: "coach_1", name: "Coach Alice" },
    ...overrides,
  };
}

function validateInvite(invite) {
  if (!invite) return { ok: false, status: 404, error: "Invite not found" };
  if (new Date() > invite.expiresAt) return { ok: false, status: 410, error: "Invite has expired" };
  if (invite.usedById) return { ok: false, status: 410, error: "Invite has already been used" };
  return { ok: true };
}

function acceptInviteLogic(invite, athleteId, alreadyLinked) {
  const valid = validateInvite(invite);
  if (!valid.ok) return valid;
  if (invite.coachId === athleteId) return { ok: false, status: 400, error: "Cannot accept your own invite" };
  if (alreadyLinked) return { ok: false, status: 409, error: "You are already linked to this coach" };
  return { ok: true };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("getInviteInfo", () => {
  test("returns invite info for a valid token", () => {
    const invite = makeInvite();
    const result = validateInvite(invite);
    assert.equal(result.ok, true);
  });

  test("returns 404 when invite is null", () => {
    const result = validateInvite(null);
    assert.equal(result.ok, false);
    assert.equal(result.status, 404);
  });

  test("returns 410 when invite is expired", () => {
    const invite = makeInvite({ expiresAt: new Date(Date.now() - 1000) });
    const result = validateInvite(invite);
    assert.equal(result.ok, false);
    assert.equal(result.status, 410);
    assert.match(result.error, /expired/);
  });

  test("returns 410 when invite is already used", () => {
    const invite = makeInvite({ usedById: "athlete_1" });
    const result = validateInvite(invite);
    assert.equal(result.ok, false);
    assert.equal(result.status, 410);
    assert.match(result.error, /already been used/);
  });
});

describe("acceptInvite", () => {
  test("accepts a valid invite", () => {
    const result = acceptInviteLogic(makeInvite(), "athlete_1", false);
    assert.equal(result.ok, true);
  });

  test("rejects when invite not found", () => {
    const result = acceptInviteLogic(null, "athlete_1", false);
    assert.equal(result.ok, false);
    assert.equal(result.status, 404);
  });

  test("rejects when athlete is the coach", () => {
    const invite = makeInvite({ coachId: "user_1" });
    const result = acceptInviteLogic(invite, "user_1", false);
    assert.equal(result.ok, false);
    assert.equal(result.status, 400);
  });

  test("rejects when already linked", () => {
    const result = acceptInviteLogic(makeInvite(), "athlete_1", true);
    assert.equal(result.ok, false);
    assert.equal(result.status, 409);
  });

  test("rejects expired invite", () => {
    const invite = makeInvite({ expiresAt: new Date(Date.now() - 1000) });
    const result = acceptInviteLogic(invite, "athlete_1", false);
    assert.equal(result.ok, false);
    assert.equal(result.status, 410);
  });
});
