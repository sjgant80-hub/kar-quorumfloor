// kernel.mjs
// QuorumFloor — pure integer arithmetic quorum check.
//
// Convention:
//   total    = sum of all cast-vote weights, including abstentions.
//   decisive = yes + no (abstentions are present but do not count toward
//              clearing quorum).
//   clears   = decisive*100 >= thresholdPercent*total, computed entirely in
//              integers (no division, no floats, no drift).
//
// Deterministic tie-break rule: when decisive*100 === thresholdPercent*total
// exactly, quorum CLEARS (equality favors clearing). When no ballots were
// cast at all (total === 0), quorum never clears regardless of threshold —
// there is nothing present to break a tie with.

function isNonNegInt(n) {
  // Number.isSafeInteger (not just isInteger) so a weight beyond 2^53 — where JS doubles
  // stop being exact — is refused rather than silently rounded. This is what makes the
  // "integer-exact, no drift" claim true: out of the exact range we refuse, never guess.
  return typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
}

function isValidChoice(c) {
  return c === 'yes' || c === 'no' || c === 'abstain';
}

export function tally(votes) {
  if (!Array.isArray(votes)) {
    return { ok: false, why: 'votes must be an array' };
  }
  let yes = 0, no = 0, abstain = 0;
  for (let i = 0; i < votes.length; i++) {
    const v = votes[i];
    if (v === null || typeof v !== 'object') {
      return { ok: false, why: `vote at index ${i} must be an object` };
    }
    if (!isNonNegInt(v.weight)) {
      return { ok: false, why: `vote at index ${i} has invalid weight` };
    }
    if (!isValidChoice(v.choice)) {
      return { ok: false, why: `vote at index ${i} has invalid choice` };
    }
    if (v.choice === 'yes') yes += v.weight;
    else if (v.choice === 'no') no += v.weight;
    else abstain += v.weight;
  }
  return { ok: true, value: { yes, no, abstain, total: yes + no + abstain } };
}

export function quorumFloor(votes, thresholdPercent) {
  if (!isNonNegInt(thresholdPercent) || thresholdPercent > 100) {
    return { ok: false, why: 'thresholdPercent must be an integer between 0 and 100' };
  }
  const tallied = tally(votes);
  if (!tallied.ok) return tallied;
  const { yes, no, total } = tallied.value;
  const decisive = yes + no;
  // The cross-multiplied comparison is exact only while its terms stay within the safe-integer
  // range. If the summed total or either product would exceed it, refuse rather than drift.
  if (!Number.isSafeInteger(total) || !Number.isSafeInteger(decisive * 100) || !Number.isSafeInteger(thresholdPercent * total)) {
    return { ok: false, why: 'weights too large for an exact integer comparison' };
  }
  if (total === 0) {
    return { ok: true, value: { clears: false, margin: -thresholdPercent } };
  }
  const margin = decisive * 100 - thresholdPercent * total;
  return { ok: true, value: { clears: margin >= 0, margin } };
}
