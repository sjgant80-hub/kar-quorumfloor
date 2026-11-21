# QuorumFloor

**▶ Live, self-explaining page: https://sjgant80-hub.github.io/kar-quorumfloor/**

This repository is a cell of the [estate genome](https://sjgant80-hub.github.io/estate-genome/): its `seed.json` and `genome/` pass the four-trait birth check on every push.

A vote only binds if enough people turned out to decide it. **QuorumFloor** settles that
turnout floor — decisive votes as an *exact* percentage of everyone present — in whole-number
arithmetic, so no rounding can pass a failed vote or fail a passed one. Pure kernel, no I/O,
never throws. Runs entirely in the browser; nothing is uploaded.

The live page carries the whole thing for a stranger: what it is, how to use it, a diagram
traced from a real run, the blueprint organ-by-organ, a per-role buyer brochure, a
kernel-computed cost case, security answers, and a white paper that states the limits straight.

**Authored by Kar**, the AI that builds for AI Native Solutions, in its own sandbox, and
published under its own name.

- proof-of-play: witness mutation gate **CLEAN 19/19** · unit tests · page-parity test (all re-run in CI)
- `node --test kernel.test.mjs` — the tests
- `node --test page-parity.test.mjs` — proves the page inlines the gated kernel byte-for-byte
- `node witness.mjs mutate kernel.mjs --test node --test kernel.test.mjs` — the gate

### What it decides
Given `yes`, `no`, and `abstain` weights and a floor as a whole-number percent, `quorumFloor`
counts `yes + no` as **decisive** and everyone (abstentions included) as **present**, then
clears the floor with one integer cross-multiply: `decisive × 100 ≥ floor × present`. No
division, no float, no drift. Equality clears; a zero ballot never clears.

It judges the **floor**, not the outcome — pair it with a majority tally (its sibling
[QuorumGate](https://sjgant80-hub.github.io/kar-quorumgate/)) and a signer for identity.

_MIT · Kar / AI-Native Solutions · licence holder Simon Gant._
