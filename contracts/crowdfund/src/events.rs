//! Crowdfund Event Helpers
//!
//! This module re-exports shared event helpers for the crowdfund contract.
//! All event emission should use these helpers for consistency.

pub use common::events::{EventEmitter, topics};

/// Re-export for backward compatibility
pub use topics as Topics;

/// Crowdfund-specific event helpers
pub struct CrowdfundEvents;

impl CrowdfundEvents {
    /// Emit campaign initialized event
    pub fn campaign_initialized(
        env: &soroban_sdk::Env,
        campaign_id: u64,
        creator: soroban_sdk::Address,
        goal: i128,
    ) {
        EventEmitter::campaign_initialized(env, campaign_id, creator, goal);
    }

    /// Emit contribution made event
    pub fn contribution_made(
        env: &soroban_sdk::Env,
        campaign_id: u64,
        contributor: soroban_sdk::Address,
        amount: i128,
    ) {
        EventEmitter::contribution_made(env, campaign_id, contributor, amount);
    }

    /// Emit funds withdrawn event
    pub fn funds_withdrawn(
        env: &soroban_sdk::Env,
        campaign_id: u64,
        recipient: soroban_sdk::Address,
        amount: i128,
    ) {
        EventEmitter::funds_withdrawn(env, campaign_id, recipient, amount);
    }

    /// Emit refund issued event
    pub fn refund_issued(
        env: &soroban_sdk::Env,
        campaign_id: u64,
        contributor: soroban_sdk::Address,
        amount: i128,
    ) {
        EventEmitter::refund_issued(env, campaign_id, contributor, amount);
    }

    /// Emit campaign cancelled event
    pub fn campaign_cancelled(
        env: &soroban_sdk::Env,
        campaign_id: u64,
        cancelled_by: soroban_sdk::Address,
    ) {
        EventEmitter::campaign_cancelled(env, campaign_id, cancelled_by);
    }

    /// Emit campaign paused event
    pub fn campaign_paused(
        env: &soroban_sdk::Env,
        campaign_id: u64,
        paused_by: soroban_sdk::Address,
    ) {
        EventEmitter::campaign_paused(env, campaign_id, paused_by);
    }

    /// Emit campaign resumed event
    pub fn campaign_resumed(
        env: &soroban_sdk::Env,
        campaign_id: u64,
        resumed_by: soroban_sdk::Address,
    ) {
        EventEmitter::campaign_resumed(env, campaign_id, resumed_by);
    }

    /// Emit milestone added event
    pub fn milestone_added(
        env: &soroban_sdk::Env,
        campaign_id: u64,
        milestone_id: u64,
        title: soroban_sdk::String,
        amount: i128,
    ) {
        EventEmitter::milestone_added(env, campaign_id, milestone_id, title, amount);
    }

    /// Emit milestone verified event
    pub fn milestone_verified(
        env: &soroban_sdk::Env,
        campaign_id: u64,
        milestone_id: u64,
        verifier: soroban_sdk::Address,
    ) {
        EventEmitter::milestone_verified(env, campaign_id, milestone_id, verifier);
    }

    /// Emit milestone released event
    pub fn milestone_released(
        env: &soroban_sdk::Env,
        campaign_id: u64,
        milestone_id: u64,
        recipient: soroban_sdk::Address,
        amount: i128,
    ) {
        EventEmitter::milestone_released(env, campaign_id, milestone_id, recipient, amount);
    }
}
