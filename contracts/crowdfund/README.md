# Crowdfund Smart Contract

This directory contains the Soroban smart contract for campaign creation, contributions, withdrawals, and refunds.

## Architecture & Storage Layout

The contract architecture (how `crowdfund`, `registry`, `qf` and `achievements` are split, what
each is responsible for, and how they interact) is documented in the ADR:

- [`docs/adr/0001-contract-architecture-and-storage-layout.md`](../../docs/adr/0001-contract-architecture-and-storage-layout.md)

### Storage keys (summary)

All persistent state is namespaced per contract; the crowdfund contract uses the following
`DataKey` variants (see `src/storage.rs` for the authoritative definitions):

| Key | Storage | Purpose |
| --- | --- | --- |
| `Admin` | instance | Contract admin address |
| `Token` | instance | Contribution token address |
| `Config` | instance | Campaign config (goal, deadline, min contribution, caps) |
| `CampaignState` | instance | Lifecycle state (active / succeeded / failed / withdrawn) |
| `TotalRaised` | instance | Aggregate contributed amount |
| `Contributor(Address)` | persistent | Per-contributor contributed amount |
| `ContributorCount` | instance | Number of distinct contributors |
| `Refunded(Address)` | persistent | Refund-claimed flag per contributor |
| `Paused` | instance | Emergency pause flag |

Instance storage is bumped on every entry point; persistent entries are bumped on access with the
TTL policy defined in the ADR. Keys are never reused for a different meaning — new state gets a
new variant.

### Upgrade policy

The contract is **not** self-upgrading. Upgrades are performed by deploying a new WASM and
migrating state through an admin-gated migration entry point, following the compatibility rules
in the ADR (append-only `DataKey` variants, no reordering, no removal of live keys). Any change to
the storage layout must update the ADR and the storage-key tests below.

### Tests validating the documented keys

- `src/storage.rs` unit tests assert each `DataKey` round-trips through `Env` storage.
- `src/test.rs` covers the read/write paths for `Config`, `Contributor`, `TotalRaised` and
  `Refunded`, and the pause/upgrade guards.

Run them with `cargo test --manifest-path contracts/crowdfund/Cargo.toml`.

## Local Test Coverage Target
=======
We enforce a minimum **85% line and branch coverage** target for `contracts/crowdfund`.

### Running Coverage Locally
To measure test coverage locally, use `cargo-tarpaulin`:

```bash
cargo tarpaulin --manifest-path contracts/crowdfund/Cargo.toml --out Html
```

## WASM Size Budget

The release build of the crowdfund contract is kept under a fixed size budget so that
unintentional growth (extra dependencies, debug formatting, unused code) is caught locally
before it reaches a release. The budget is defined in `scripts/check_wasm_size.py` and is
based on the current release build with a small amount of headroom.

### Checking the size locally

Build the contract and run the budget check with:

```bash
make contracts:size
```

This builds the crowdfund WASM in release mode, runs `scripts/check_wasm_size.py`, and
**fails** (non-zero exit) if the artifact exceeds the budget. Run it before opening a PR
that touches the contract.

### Updating the budget intentionally

If a change legitimately increases the contract size (e.g. a required new feature), update
the budget constant in `scripts/check_wasm_size.py` in the same PR and explain in the PR
description why the increase is necessary. Do not raise the budget just to make CI pass —
first look for ways to reduce the size (removing unused code, avoiding debug strings,
trimming dependencies).

## Linting

Run Clippy across the entire contracts workspace with all targets and features:

```bash
cargo clippy --workspace --all-targets --all-features
```

This command checks all contract crates (`crowdfund`, `achievements`, `registry`, `common`) including test code. Fix all warnings before submitting a PR. Use narrowly scoped `#[allow(...)]` attributes only when a warning is intentional, with an explanatory comment.

## Fuzz Testing

Fund-handling logic (contribution/withdrawal/refund amount validation) is fuzz-tested with
[`cargo-fuzz`](https://github.com/rust-fuzz/cargo-fuzz) against malformed and adversarial inputs.
The harness lives in `contracts/crowdfund/fuzz` and targets the pure validation functions in
`src/validation.rs`, exposed for fuzzing through the `fuzz_api` module (compiled only when the
`fuzz` feature is enabled) so the fuzz target doesn't need a full Soroban `Env`.

### Running fuzzing locally

```bash
cargo install cargo-fuzz   # one-time, requires a nightly toolchain
cd contracts/crowdfund/fuzz
cargo +nightly fuzz run fuzz_validation
```

To run for a bounded amount of time instead of indefinitely (useful for a quick local check):

```bash
cargo +nightly fuzz run fuzz_validation -- -max_total_time=60
```

### Seed corpus

The seed corpus lives in `contracts/crowdfund/fuzz/corpus/fuzz_validation/` and is derived from
the boundary values already exercised by the existing unit tests in `src/test.rs` /
`src/validation.rs` (zero/negative amounts, deadlines equal to "now", a typical goal/contribution
pair, and `i128::MAX`-adjacent values used to probe overflow handling). `cargo fuzz run` will grow
this corpus automatically as it discovers new interesting inputs — commit newly discovered
crashing inputs (minimized via `cargo fuzz tmin`) alongside their fix.

### Status

Running the harness against the seed corpus above did not turn up any panics; all inputs are
handled via typed `ContractError` returns (mainly `Overflow`, `InvalidGoal`, and
`BelowMinimum`/`ContributorCapExceeded`). If a future run finds a crash, add the minimized input
under `corpus/fuzz_validation/`, fix the underlying bug, and note it here.

### CI

Fuzzing is intentionally **not** run on every PR (it's non-deterministic and open-ended). A
scheduled, non-blocking job runs it periodically instead — see
`.github/workflows/fuzz.yml` — and reports findings without failing other CI checks.

## WASM size budget

Each release WASM must stay under the budget in `contracts/crowdfund/WASM_BUDGET_BYTES`
(currently 512000 bytes). Run `make contracts-size` (or `make size`) after a release build. It
fails when any contract is over the budget. CI runs the same check with the same file.
