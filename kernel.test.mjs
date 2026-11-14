import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as K from './kernel.mjs';

test('clears comfortably above threshold', () => {
  const votes = [
    { weight: 60, choice: 'yes' },
    { weight: 10, choice: 'no' },
    { weight: 30, choice: 'abstain' },
  ];
  const result = K.quorumFloor(votes, 50);
  assert.deepStrictEqual(result, { ok: true, value: { clears: true, margin: 2000 } });
});

test('exact tie at threshold clears (deterministic tie-break)', () => {
  const votes = [
    { weight: 40, choice: 'yes' },
    { weight: 10, choice: 'no' },
    { weight: 50, choice: 'abstain' },
  ];
  const result = K.quorumFloor(votes, 50);
  assert.deepStrictEqual(result, { ok: true, value: { clears: true, margin: 0 } });
});

test('falls short of threshold', () => {
  const votes = [
    { weight: 20, choice: 'yes' },
    { weight: 10, choice: 'no' },
    { weight: 70, choice: 'abstain' },
  ];
  const result = K.quorumFloor(votes, 50);
  assert.deepStrictEqual(result, { ok: true, value: { clears: false, margin: -2000 } });
});

test('all abstentions never clear a nonzero threshold', () => {
  const votes = [{ weight: 100, choice: 'abstain' }];
  const result = K.quorumFloor(votes, 10);
  assert.deepStrictEqual(result, { ok: true, value: { clears: false, margin: -1000 } });
});

test('no ballots cast never clears, regardless of threshold', () => {
  const result = K.quorumFloor([], 30);
  assert.deepStrictEqual(result, { ok: true, value: { clears: false, margin: -30 } });
});

test('malformed input returns ok:false instead of throwing', () => {
  assert.deepStrictEqual(K.quorumFloor('not-an-array', 50), {
    ok: false,
    why: 'votes must be an array',
  });
  assert.deepStrictEqual(K.quorumFloor([{ weight: -5, choice: 'yes' }], 50), {
    ok: false,
    why: 'vote at index 0 has invalid weight',
  });
  assert.deepStrictEqual(K.quorumFloor([{ weight: 5, choice: 'maybe' }], 50), {
    ok: false,
    why: 'vote at index 0 has invalid choice',
  });
  assert.deepStrictEqual(K.quorumFloor([], 150), {
    ok: false,
    why: 'thresholdPercent must be an integer between 0 and 100',
  });
});

test('zero weight is a valid non-negative integer (boundary at n >= 0)', () => {
  const votes = [
    { weight: 0, choice: 'yes' },
    { weight: 100, choice: 'no' },
  ];
  const result = K.quorumFloor(votes, 50);
  // weight:0 must be ACCEPTED as valid, not rejected — pins n >= 0, not n > 0.
  assert.deepStrictEqual(result, { ok: true, value: { clears: true, margin: 5000 } });
});

test('thresholdPercent of exactly 100 is valid, not out-of-range', () => {
  const votes = [{ weight: 100, choice: 'yes' }];
  const result = K.quorumFloor(votes, 100);
  // 100 must be ACCEPTED (boundary is > 100, not >= 100) and must clear exactly.
  assert.deepStrictEqual(result, { ok: true, value: { clears: true, margin: 0 } });
});

test('a null entry in votes is refused as "must be an object", never thrown', () => {
  // typeof null === 'object', so this must be caught by the v === null check
  // specifically (an && here would let null fall through into v.weight and throw).
  assert.deepStrictEqual(K.quorumFloor([null], 50), {
    ok: false,
    why: 'vote at index 0 must be an object',
  });
});

test('a weight beyond the safe-integer range is refused, not silently rounded', () => {
  // 2^53 is where JS doubles stop being exact. isSafeInteger must refuse it.
  assert.deepStrictEqual(K.quorumFloor([{ weight: Number.MAX_SAFE_INTEGER + 1, choice: 'yes' }], 50), {
    ok: false,
    why: 'vote at index 0 has invalid weight',
  });
  // a large weight that is safe end-to-end (9e13; *100 = 9e15, still a safe integer) is accepted
  assert.equal(K.quorumFloor([{ weight: 90000000000000, choice: 'yes' }], 0).ok, true);
});

test('safe weights whose product overflows refuse rather than drift (decisive*100 term)', () => {
  // total = 1e14 is safe, but decisive*100 = 1e16 exceeds MAX_SAFE_INTEGER (~9.007e15).
  assert.deepStrictEqual(K.quorumFloor([{ weight: 100000000000000, choice: 'yes' }], 50), {
    ok: false,
    why: 'weights too large for an exact integer comparison',
  });
});

test('safe weights whose threshold product overflows refuse (thresholdPercent*total term)', () => {
  // all abstain: decisive = 0 (so decisive*100 is safe), but 50 * total = 50 * 5e14 = 2.5e16 overflows.
  assert.deepStrictEqual(K.quorumFloor([{ weight: 500000000000000, choice: 'abstain' }], 50), {
    ok: false,
    why: 'weights too large for an exact integer comparison',
  });
});

test('a summed total beyond the safe range refuses (total term)', () => {
  // two individually-safe weights (5e15 each) sum to 1e16, which is not a safe integer.
  assert.deepStrictEqual(K.quorumFloor([{ weight: 5000000000000000, choice: 'yes' }, { weight: 5000000000000000, choice: 'abstain' }], 50), {
    ok: false,
    why: 'weights too large for an exact integer comparison',
  });
});

test('ordinary large-but-safe weights still clear normally (guard does not false-trigger)', () => {
  const r = K.quorumFloor([{ weight: 1000000, choice: 'yes' }, { weight: 1000000, choice: 'abstain' }], 50);
  assert.deepStrictEqual(r, { ok: true, value: { clears: true, margin: 0 } });
});
