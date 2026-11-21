// cell.mjs — QuorumFloor's three answers for the birth check (seed.json, genome/).
//
// judge  QuorumFloor's own whole-number check (kernel.mjs, quorumFloor). A claimed result for a ballot (does it clear
//        its turnout floor, and by what exact margin) is verified when the kernel gives the same clears and the same
//        margin; unverified when it does not. The birth check's cases are the kernel's own test ballots: the exact tie
//        at 50% clears with margin 0 (equality clears); the ballot that falls short, claimed as cleared, does not.
//        Refused when the input is not a ballot the kernel can settle exactly, or the claim is not a clears flag and a
//        whole-number margin.
// lane   a ballot the kernel can settle exactly (the kernel says ok). A request to declare or act on the result is
//        out of lane and goes to Kar: QuorumFloor settles the arithmetic, people declare the result.
import { quorumFloor } from '../kernel.mjs';

const isObj = (v) => v !== null && typeof v === 'object';

export async function judge(input) {
  if (!(await inLane(input)) || typeof input.clears !== 'boolean' || !Number.isSafeInteger(input.margin)) return 'refused';
  const r = quorumFloor(input.votes, input.thresholdPercent).value;
  return r.clears === input.clears && r.margin === input.margin ? 'verified' : 'unverified';
}

export async function inLane(input) {
  return isObj(input) && quorumFloor(input.votes, input.thresholdPercent).ok === true;
}

// health: QuorumFloor cannot see its page's visitors or its callers from inside the repository, so it says so
export async function health() {
  return { used: null, dependedOn: null, lastEarned: null };
}
