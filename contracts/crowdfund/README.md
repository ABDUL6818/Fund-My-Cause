# Crowdfund Smart Contract

This directory contains the Soroban smart contract for campaign creation, contributions, withdrawals, and refunds.

## Local Test Coverage Target
We enforce a minimum **85% line and branch coverage** target for `contracts/crowdfund`.

### Running Coverage Locally
To measure test coverage locally, use `cargo-tarpaulin`:

```bash
cargo tarpaulin --manifest-path contracts/crowdfund/Cargo.toml --out Html
```

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
