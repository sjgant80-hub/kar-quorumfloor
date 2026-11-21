// QuorumFloor as a cell of the estate genome: its judge (the kernel's own whole-number check), its lane and its health.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { judge, inLane, health } from './genome/cell.mjs';

const seed = JSON.parse(readFileSync(new URL('./seed.json', import.meta.url), 'utf8'));
const b = (yes, no, abstain) => [{ weight: yes, choice: 'yes' }, { weight: no, choice: 'no' }, { weight: abstain, choice: 'abstain' }];
const TIE = b(40, 10, 50), SHORT = b(20, 10, 70);

test('judge: the seed cases — the exact tie clears, the short ballot claimed as cleared does not', async () => {
  assert.equal(await judge(seed.judge.cases.good), 'verified');
  assert.equal(await judge(seed.judge.cases.bad), 'unverified');
  assert.deepEqual(seed.judge.cases.good.votes, TIE);
  assert.deepEqual(seed.judge.cases.bad.votes, SHORT);
});

test('judge: clears and margin must both agree with the kernel', async () => {
  assert.equal(await judge({ votes: TIE, thresholdPercent: 50, clears: true, margin: 0 }), 'verified');
  assert.equal(await judge({ votes: TIE, thresholdPercent: 50, clears: false, margin: 0 }), 'unverified');
  assert.equal(await judge({ votes: TIE, thresholdPercent: 50, clears: true, margin: 1 }), 'unverified');
  assert.equal(await judge({ votes: SHORT, thresholdPercent: 50, clears: false, margin: -2000 }), 'verified');
  assert.equal(await judge({ votes: SHORT, thresholdPercent: 50, clears: true, margin: -2000 }), 'unverified');
  assert.equal(await judge({ votes: SHORT, thresholdPercent: 50, clears: false, margin: 2000 }), 'unverified');
  // 29 of 100: a float spreadsheet computes 28.999999999999996% and fails it; the whole-number check clears it exactly
  assert.equal(await judge({ votes: b(29, 0, 71), thresholdPercent: 29, clears: true, margin: 0 }), 'verified');
  assert.equal(await judge({ votes: b(29, 0, 71), thresholdPercent: 29, clears: false, margin: 0 }), 'unverified');
  // the empty ballot never clears
  assert.equal(await judge({ votes: [], thresholdPercent: 30, clears: false, margin: -30 }), 'verified');
});

test('judge: anything that is not a settleable ballot with a claim is refused', async () => {
  for (const bad of [null, undefined, 'x', 5, {}, [], { votes: TIE }, { votes: 'x', thresholdPercent: 50, clears: true, margin: 0 },
    { votes: TIE, thresholdPercent: 150, clears: true, margin: 0 }, { votes: [{ weight: -5, choice: 'yes' }], thresholdPercent: 50, clears: true, margin: 0 },
    { votes: TIE, thresholdPercent: 50, margin: 0 }, { votes: TIE, thresholdPercent: 50, clears: 'yes', margin: 0 },
    { votes: TIE, thresholdPercent: 50, clears: true }, { votes: TIE, thresholdPercent: 50, clears: true, margin: 0.5 },
    { votes: TIE, thresholdPercent: 50, clears: true, margin: '0' }]) {
    assert.equal(await judge(bad), 'refused', String(JSON.stringify(bad)));
  }
});

test('lane: a ballot the kernel can settle is in lane; a request to declare the result is not', async () => {
  assert.equal(await inLane(seed.boundary.inLane), true);
  assert.equal(await inLane(seed.boundary.outOfLane), false);
  assert.equal(await inLane({ votes: [], thresholdPercent: 0 }), true);
  for (const bad of [null, undefined, 'x', 5, {}, [], () => {}, { votes: TIE }, { votes: 'x', thresholdPercent: 50 },
    { votes: TIE, thresholdPercent: 101 }, { votes: [{ weight: 5, choice: 'maybe' }], thresholdPercent: 50 }, { thresholdPercent: 50 }]) {
    assert.equal(await inLane(bad), false, String(JSON.stringify(bad)));
  }
});

test('health says what QuorumFloor cannot measure from inside its repository', async () => {
  assert.deepEqual(await health(), { used: null, dependedOn: null, lastEarned: null });
});
