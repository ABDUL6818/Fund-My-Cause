//! # Campaign Metadata Functions
//!
//! This module owns the mutable descriptive state of a campaign: title, description,
//! social links and the anchored IPFS CID. Every metadata update appends a versioned
//! snapshot (issue #423) so the full edit history stays auditable on-chain.

use soroban_sdk::{Address, Env, String, Vec};

use crate::{
    errors::ContractError,
    helpers::require_auth_creator,
    storage::{
        metadata_field_key, MetadataField, KEY_CREATOR, KEY_STATUS, TTL_PERSISTENT_ENTRY,
    },
    types::{
        EventIpfsCidUpdated, EventMetadataUpdated, EventMetadataVersioned, MetadataVersion, Status,
    },
    validation::validate_string_length,
    CrowdfundContract,
};

/// Updates campaign metadata (title, description, social links).
pub(crate) fn update_metadata(
    env: Env,
    title: Option<String>,
    description: Option<String>,
    social_links: Option<Vec<String>>,
) -> Result<(), ContractError> {
    let inst = env.storage().instance();
    let status: Status = inst.get(&KEY_STATUS).unwrap();
    if status != Status::Active {
        return Err(ContractError::NotActive);
    }
    require_auth_creator(&env)?;

    let updated_title = title.is_some();
    let updated_description = description.is_some();
    let updated_social = social_links.is_some();

    // Validate and capture effective values for the version snapshot.
    // Using `if let Some(ref ...)` borrows without moving, letting us clone
    // here and then move the Option into the storage writes below.
    let title_key = metadata_field_key(MetadataField::Title);
    let desc_key = metadata_field_key(MetadataField::Description);
    let social_key = metadata_field_key(MetadataField::SocialLinks);
    let meta_hist_key = metadata_field_key(MetadataField::History);

    let effective_title: String = if let Some(ref t) = title {
        validate_string_length(t, 64)?;
        t.clone()
    } else {
        inst.get(&title_key)
            .unwrap_or_else(|| String::from_str(&env, ""))
    };
    let effective_desc: String = if let Some(ref d) = description {
        validate_string_length(d, 512)?;
        d.clone()
    } else {
        inst.get(&desc_key)
            .unwrap_or_else(|| String::from_str(&env, ""))
    };

    if let Some(t) = title {
        inst.set(&title_key, &t);
    }
    if let Some(d) = description {
        inst.set(&desc_key, &d);
    }
    if let Some(l) = social_links {
        inst.set(&social_key, &l);
    }

    // Issue #423: store a versioned metadata snapshot
    let now = env.ledger().timestamp();
    let mut meta_hist: Vec<MetadataVersion> = env
        .storage()
        .persistent()
        .get(&meta_hist_key)
        .unwrap_or_else(|| Vec::new(&env));
    let version = meta_hist.len();
    meta_hist.push_back(MetadataVersion {
        version,
        title: effective_title,
        description: effective_desc,
        timestamp: now,
    });
    env.storage().persistent().set(&meta_hist_key, &meta_hist);
    env.storage().persistent().extend_ttl(
        &meta_hist_key,
        TTL_PERSISTENT_ENTRY,
        TTL_PERSISTENT_ENTRY,
    );

    env.events().publish(
        ("campaign", "metadata_updated"),
        EventMetadataUpdated {
            updated_title,
            updated_description,
            updated_social_links: updated_social,
        },
    );
    env.events().publish(
        ("campaign", "metadata_versioned"),
        EventMetadataVersioned {
            version,
            timestamp: now,
        },
    );

    // Re-index campaign after metadata update
    CrowdfundContract::index_campaign(env)?;

    Ok(())
}

/// Anchors an IPFS content identifier (CID) on-chain for the campaign.
pub(crate) fn update_ipfs_cid(env: Env, cid: String) -> Result<(), ContractError> {
    let inst = env.storage().instance();
    let status: Status = inst.get(&KEY_STATUS).unwrap();
    if status != Status::Active {
        return Err(ContractError::NotActive);
    }
    require_auth_creator(&env)?;
    let creator: Address = inst.get(&KEY_CREATOR).unwrap();
    creator.require_auth();
    let ipfs_key = metadata_field_key(MetadataField::IpfsCid);

    // Validate CID length: v0 (base58 "Qm…", len 46) or v1 (base32 "bafy…", len >= 59).
    // Byte-level prefix inspection is intentionally omitted: Soroban `String`
    // does not expose content access without an exact-length copy buffer, so we
    // validate the well-known CID lengths instead.
    let len = cid.len();
    let is_v0 = len == 46;
    let is_v1 = len >= 59;
    if !is_v0 && !is_v1 {
        return Err(ContractError::InvalidInput);
    }

    inst.set(&ipfs_key, &cid);
    let now = env.ledger().timestamp();
    env.events().publish(
        ("campaign", "ipfs_cid_updated"),
        EventIpfsCidUpdated {
            cid,
            timestamp: now,
        },
    );
    Ok(())
}

/// Returns the stored IPFS CID for this campaign, if one has been set.
pub(crate) fn get_ipfs_cid(env: Env) -> Option<String> {
    env.storage()
        .instance()
        .get(&metadata_field_key(MetadataField::IpfsCid))
}

/// Returns the full metadata version history for this campaign.
pub(crate) fn get_metadata_history(env: Env) -> Vec<MetadataVersion> {
    env.storage()
        .persistent()
        .get(&metadata_field_key(MetadataField::History))
        .unwrap_or_else(|| Vec::new(&env))
}
