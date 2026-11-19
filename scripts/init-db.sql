-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    goal_amount DECIMAL(15,2) NOT NULL,
    raised_amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create donations table
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    transaction_hash VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexer state table
CREATE TABLE IF NOT EXISTS indexer_state (
    id SERIAL PRIMARY KEY,
    last_processed_ledger BIGINT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial state
INSERT INTO indexer_state (last_processed_ledger) VALUES (0) ON CONFLICT DO NOTHING;

-- Create indexes
--
-- Query optimization notes (#1685)
-- --------------------------------
-- Profiling evidence (EXPLAIN ANALYZE on representative data):
--   * Campaign detail page: donations filtered by campaign_id and ordered by
--     created_at -> sequential scan + sort on donations.
--   * Donation lookup by transaction_hash -> sequential scan on donations.
--   * Campaign listing filtered by status and ordered by created_at ->
--     sequential scan + sort on campaigns.
--   * "My campaigns" page filtered by user_id and ordered by created_at ->
--     sequential scan + sort on campaigns.
-- The composite indexes below let Postgres satisfy the filter and the
-- ordering from a single index, removing the explicit sort step.
--
-- All indexes use IF NOT EXISTS so this script remains idempotent.
--
-- Rollback:
--   DROP INDEX IF EXISTS idx_campaigns_user_id;
--   DROP INDEX IF EXISTS idx_campaigns_user_id_created_at;
--   DROP INDEX IF EXISTS idx_campaigns_status_created_at;
--   DROP INDEX IF EXISTS idx_donations_campaign_id;
--   DROP INDEX IF EXISTS idx_donations_campaign_id_created_at;
--   DROP INDEX IF EXISTS idx_donations_user_id;
--   DROP INDEX IF EXISTS idx_donations_transaction_hash;
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id_created_at ON campaigns(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_status_created_at ON campaigns(status, created_at);
CREATE INDEX IF NOT EXISTS idx_donations_campaign_id ON donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_campaign_id_created_at ON donations(campaign_id, created_at);
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_transaction_hash ON donations(transaction_hash);
