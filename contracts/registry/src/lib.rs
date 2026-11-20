//! # Fund-My-Cause Registry Contract
//!
//! A lightweight Soroban contract that maintains a deduplicated, paginated list
//! of all deployed [`CrowdfundContract`] campaign addresses on the Stellar network.
//!
//! ## Access Control
//!
//! | Function | Authorization required |
//! |---|---|
//! | `initialize` | `admin.require_auth()` — one-time setup |
//! | `register` | `campaign_id.require_auth()` — campaign signs its own registration |
//! | `register_with_category` | `campaign_id.require_auth()` |
//! | `register_with_status` | `campaign_id.require_auth()` |
//! | `update_status` | stored admin `require_auth()` |
//! | `list` / `list_by_status` / `get_campaigns_by_category` | public read — no auth |
//!
//! ## Storage
//!
//! All campaign addresses are stored in a single instance-storage entry under
//! the `CMPLIST` key as a `Vec<Address>`. Deduplication is enforced on write.
//! The admin address is stored under `ADMIN` and set once during `initialize`.
//!
//! Status and category indexes are stored under typed `RegDataKey` enum keys
//! so that u32 category/status values cannot alias the flat `KEY_ADMIN` or
//! `KEY_CAMPAIGNS` symbols.
//!
//! ## Module layout
//!
//! The contract's public entry points (below) are thin delegating wrappers —
//! this file owns the single `#[contractimpl]` block (Soroban generates one
//! `RegistryContractClient` per contract, so the callable surface must stay
//! in one place), plus the storage keys and small helpers shared by both:
//! - [`admin`] — every function that mutates registry state: the two
//!   admin-gated ones (`initialize`, `update_status`) and the three
//!   campaign-self-authorized registration entry points.
//! - [`lookup`] — the three public, read-only, unauthenticated queries.

#![no_std]
// The SDK deprecated `Events::publish` in favour of the `#[contractevent]` macro.
// Migrating changes how events are encoded on the wire, so it is a behaviour change
// for every off-chain consumer, not a lint cleanup, and is tracked separately.
#![allow(deprecated)]

mod admin;
pub mod errors;
mod events;
mod lookup;

pub use errors::ContractError;

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol, Vec};

// ── Storage keys ──────────────────────────────────────────────────────────────

/// Instance storage key for the list of registered campaign contract addresses.
pub(crate) const KEY_CAMPAIGNS: Symbol = symbol_short!("CMPLIST");

/// Instance storage key for the admin address set during `initialize`.
pub(crate) const KEY_ADMIN: Symbol = symbol_short!("ADMIN");

// ── Types ─────────────────────────────────────────────────────────────────────

/// Campaign status values mirrored from the crowdfund contract for filtering.
///
/// The registry stores a caller-supplied status tag alongside each campaign so
/// that `list_by_status` can filter without cross-contract calls.
/// Status values must be kept in sync by the registrant (typically the deploy script).
///
/// | value | meaning      |
/// |-------|--------------|
/// |  0    | Active       |
/// |  1    | Successful   |
/// |  2    | Failed       |
/// |  3    | Cancelled    |
#[contracttype]
#[derive(Clone, Copy, PartialEq, Debug)]
pub enum CampaignStatus {
    Active = 0,
    Successful = 1,
    Failed = 2,
    Cancelled = 3,
}

/// Typed storage key variants for indexed campaign lists.
///
/// Using `#[contracttype]` enum keys instead of raw strings or Symbol constants
/// prevents u32 category/status values from aliasing the flat `KEY_ADMIN` or
/// `KEY_CAMPAIGNS` symbols, since Soroban encodes enum variants with a type tag.
#[contracttype]
pub(crate) enum RegDataKey {
    /// Paginated list of campaign addresses for a given numeric category id.
    CategoryList(u32),
    /// List of campaign addresses for a given status (maps to CampaignStatus discriminant).
    StatusList(u32),
}

// ── Shared helpers ────────────────────────────────────────────────────────────

/// Returns `Err(NotInitialized)` if `initialize` has not been called yet.
pub(crate) fn require_initialized(env: &Env) -> Result<(), ContractError> {
    if !env.storage().instance().has(&KEY_ADMIN) {
        return Err(ContractError::NotInitialized);
    }
    Ok(())
}

/// Returns a sub-slice of `src` starting at `offset` with at most `limit` items.
pub(crate) fn paginate(env: &Env, src: &Vec<Address>, offset: u32, limit: u32) -> Vec<Address> {
    let total = src.len();
    if offset >= total {
        return Vec::new(env);
    }
    let end = offset.saturating_add(limit).min(total);
    let mut out = Vec::new(env);
    let mut i = offset;
    while i < end {
        if let Some(addr) = src.get(i) {
            out.push_back(addr);
        }
        i += 1;
    }
    out
}

// ── Contract ──────────────────────────────────────────────────────────────────

/// The Fund-My-Cause registry contract.
///
/// Maintains a deduplicated, append-only list of all deployed campaign contract
/// addresses. Provides paginated read access for frontends and indexers.
/// Every state-mutating function enforces caller authentication via
/// `require_auth()` and returns `Result<_, ContractError>`.
#[contract]
pub struct RegistryContract;

#[contractimpl]
impl RegistryContract {
    // ── Admin / lifecycle ─────────────────────────────────────────────────────

    /// Initialises the registry and sets the admin address.
    ///
    /// Must be called exactly once immediately after contract deployment.
    /// Subsequent calls return [`ContractError::AlreadyInitialized`].
    ///
    /// # Authorization
    ///
    /// `admin.require_auth()` — the admin must sign the initialisation transaction.
    ///
    /// # Errors
    ///
    /// - [`ContractError::AlreadyInitialized`] if the contract has already been initialised.
    pub fn initialize(env: Env, admin: Address) -> Result<(), ContractError> {
        admin::initialize(env, admin)
    }

    // ── Registration entry-points ─────────────────────────────────────────────

    /// Registers a campaign contract address in the registry.
    ///
    /// If the address is already registered the call succeeds without emitting a
    /// duplicate event.
    ///
    /// # Authorization
    ///
    /// `campaign_id.require_auth()` — the campaign contract must sign.
    ///
    /// # Errors
    ///
    /// - [`ContractError::NotInitialized`] if `initialize` has not been called.
    pub fn register(env: Env, campaign_id: Address) -> Result<(), ContractError> {
        admin::register(env, campaign_id)
    }

    /// Registers a campaign together with its numeric category id.
    ///
    /// # Authorization
    ///
    /// `campaign_id.require_auth()` — the campaign contract must sign.
    ///
    /// # Errors
    ///
    /// - [`ContractError::NotInitialized`] if `initialize` has not been called.
    pub fn register_with_category(
        env: Env,
        campaign_id: Address,
        category_id: u32,
    ) -> Result<(), ContractError> {
        admin::register_with_category(env, campaign_id, category_id)
    }

    /// Registers a campaign with a status tag for status-based filtering.
    ///
    /// # Authorization
    ///
    /// `campaign_id.require_auth()` — the campaign contract must sign.
    ///
    /// # Errors
    ///
    /// - [`ContractError::NotInitialized`] if `initialize` has not been called.
    pub fn register_with_status(
        env: Env,
        campaign_id: Address,
        status: CampaignStatus,
    ) -> Result<(), ContractError> {
        admin::register_with_status(env, campaign_id, status)
    }

    /// Updates the status tag for a registered campaign.
    ///
    /// Removes `campaign_id` from its old status list and adds it to the new one.
    ///
    /// # Authorization
    ///
    /// Only the stored admin address may call this function.
    ///
    /// # Errors
    ///
    /// - [`ContractError::NotInitialized`] if `initialize` has not been called.
    /// - [`ContractError::NotFound`] if `campaign_id` is not in the global registry.
    pub fn update_status(
        env: Env,
        campaign_id: Address,
        old_status: CampaignStatus,
        new_status: CampaignStatus,
    ) -> Result<(), ContractError> {
        admin::update_status(env, campaign_id, old_status, new_status)
    }

    // ── Read-only queries (no auth required) ──────────────────────────────────

    /// Returns a paginated slice of registered campaign contract addresses.
    pub fn list(env: Env, offset: u32, limit: u32) -> Vec<Address> {
        lookup::list(env, offset, limit)
    }

    /// Returns a paginated slice of campaigns filtered by status.
    pub fn list_by_status(
        env: Env,
        status: CampaignStatus,
        offset: u32,
        limit: u32,
    ) -> Vec<Address> {
        lookup::list_by_status(env, status, offset, limit)
    }

    /// Returns a paginated slice of campaign addresses filtered by category.
    pub fn get_campaigns_by_category(
        env: Env,
        category_id: u32,
        offset: u32,
        limit: u32,
    ) -> Vec<Address> {
        lookup::get_campaigns_by_category(env, category_id, offset, limit)
    }
}

#[cfg(test)]
mod tests;
