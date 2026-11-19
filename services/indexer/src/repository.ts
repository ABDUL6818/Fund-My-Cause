/**
 * Repository interfaces for indexer data access (#898).
 *
 * Handlers depend on these interfaces rather than on `EventStore` directly.
 * This decouples business logic from the storage layer and makes handlers
 * independently testable via a mock implementation.
 *
 * Covered domains:
 *  - EventRepository  – generic contract-event access
 *  - CampaignRepository  – campaign-scoped event queries
 *  - ContributionRepository – contribution-event queries
 *
 * The current backing store is the in-memory EventStore.  Switching to a
 * durable store in the future only requires a new class that satisfies these
 * interfaces — handler code is unaffected.
 *
 * Index expectations (#1685):
 *  - `queryByContract` must be backed by an index on `(contract_id, id DESC)`
 *    so it never performs a full scan of the event table.
 *  - `queryByType` must be backed by an index on `(type, id DESC)`.
 *  - `getAllEvents` relies on the primary key / `id DESC` ordering.
 *  - `getEventsByCampaign` and `getContributionsForCampaign` are expected to
 *    be served by the composite index on `(contract_id, type, id DESC)`.
 * Implementations that cannot satisfy these guarantees must document the
 * fallback and the reason in their own doc comments.
 */

import type { IndexerEvent } from "./rpc-client.js";

// ---------------------------------------------------------------------------
// EventRepository
// ---------------------------------------------------------------------------

/**
 * Generic access to the raw indexed event stream.
 *
 * This is the primary interface for anything that needs to query events by
 * contract or by type without any domain-level interpretation.
 */
export interface EventRepository {
  /** Persist a batch of events (idempotent: duplicate IDs are ignored). */
  addEvents(events: IndexerEvent[]): void;

  /**
   * Query events by contract address, newest first.
   * Index-backed by `(contract_id, id DESC)` — must not scan the full table.
   */
  queryByContract(contractId: string, limit?: number): IndexerEvent[];

  /**
   * Query events by event type, newest first.
   * Index-backed by `(type, id DESC)` — must not scan the full table.
   */
  queryByType(type: string, limit?: number): IndexerEvent[];

  /**
   * Return up to `limit` most recent events across all contracts.
   * Served by the primary key ordering (`id DESC`).
   */
  getAllEvents(limit?: number): IndexerEvent[];

  /** Total number of events currently stored. */
  getCount(): number;
}

// ---------------------------------------------------------------------------
// CampaignRepository
// ---------------------------------------------------------------------------

/**
 * Domain-level access to campaign-related events.
 *
 * Handlers that display campaign state or activity use this interface so
 * they are not coupled to how campaign events are stored or keyed.
 */
export interface CampaignRepository {
  /**
   * Return recent events for a specific campaign contract.
   * Index-backed by `(contract_id, type, id DESC)` — must not scan the full
   * table.
   * @param campaignId Soroban contract address of the campaign.
   * @param limit      Maximum number of events to return (default 100).
   */
  getEventsByCampaign(campaignId: string, limit?: number): IndexerEvent[];
}

// ---------------------------------------------------------------------------
// ContributionRepository
// ---------------------------------------------------------------------------

/**
 * Domain-level access to contribution events.
 */
export interface ContributionRepository {
  /**
   * Return recent contribution events (type "Contribute") for a campaign.
   * Index-backed by `(contract_id, type, id DESC)` — must not scan the full
   * table.
   * @param campaignId  Soroban contract address of the campaign.
   * @param limit       Maximum number of events to return (default 100).
   */
  getContributionsForCampaign(campaignId: string, limit?: number): IndexerEvent[];
}
