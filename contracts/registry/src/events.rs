//! Registry event helpers.
//!
//! All event emission goes through [`common::EventEmitter`] so that the
//! registry shares the same topic constants and routing infrastructure used
//! by the crowdfund and achievements contracts. Off-chain consumers (indexer,
//! webhooks) can parse registry events through the same code path.

use common::{topics, EventEmitter};

/// Thin wrappers over `common::EventEmitter` for registry-specific events.
pub(crate) struct RegistryEvents;

impl RegistryEvents {
    /// Emit `reg_init` — registry was initialised with a new admin.
    pub(crate) fn initialized(env: &soroban_sdk::Env, admin: soroban_sdk::Address) {
        EventEmitter::registry_initialized(env, admin);
    }

    /// Emit `reg_proj` — a campaign was added to the global registry list.
    ///
    /// Uses `topics::REGISTRY_PROJECT_REGISTERED` so the indexer can handle
    /// campaign registration events alongside project events via the same
    /// topic filter.
    pub(crate) fn campaign_registered(
        env: &soroban_sdk::Env,
        campaign_id: soroban_sdk::Address,
    ) {
        EventEmitter::emit(
            env,
            topics::REGISTRY_PROJECT_REGISTERED,
            (campaign_id, env.ledger().timestamp()),
        );
    }
}
