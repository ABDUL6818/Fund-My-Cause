#![cfg(test)]
#![allow(deprecated)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

fn deploy_and_init(env: &Env) -> (Address, RegistryContractClient) {
    let id = env.register_contract(None, RegistryContract);
    let client = RegistryContractClient::new(env, &id);
    let admin = Address::generate(env);
    env.mock_all_auths();
    client.initialize(&admin).unwrap();
    (admin, client)
}

#[test]
fn test_initialize_registry() {
    let env = Env::default();
    let (_admin, _client) = deploy_and_init(&env);
}

#[test]
fn test_initialize_twice_returns_error() {
    let env = Env::default();
    let (admin, client) = deploy_and_init(&env);
    let result = client.try_initialize(&admin);
    assert_eq!(result, Err(Ok(ContractError::AlreadyInitialized)));
}

#[test]
fn test_register_and_list() {
    let env = Env::default();
    let (_admin, client) = deploy_and_init(&env);
    let campaign = Address::generate(&env);

    client.register(&campaign).unwrap();

    let all = client.list(&0, &10);
    assert_eq!(all.len(), 1);
    assert_eq!(all.get(0).unwrap(), campaign);
}

#[test]
fn test_register_deduplicates() {
    let env = Env::default();
    let (_admin, client) = deploy_and_init(&env);
    let campaign = Address::generate(&env);

    client.register(&campaign).unwrap();
    client.register(&campaign).unwrap();

    assert_eq!(client.list(&0, &10).len(), 1);
}

#[test]
fn test_register_with_status_and_list_by_status() {
    let env = Env::default();
    let (_admin, client) = deploy_and_init(&env);
    let c1 = Address::generate(&env);
    let c2 = Address::generate(&env);

    client.register_with_status(&c1, &CampaignStatus::Active).unwrap();
    client.register_with_status(&c2, &CampaignStatus::Failed).unwrap();

    assert_eq!(client.list_by_status(&CampaignStatus::Active, &0, &10).len(), 1);
    assert_eq!(client.list_by_status(&CampaignStatus::Failed, &0, &10).len(), 1);
    assert_eq!(client.list_by_status(&CampaignStatus::Successful, &0, &10).len(), 0);
}

#[test]
fn test_register_with_category() {
    let env = Env::default();
    let (_admin, client) = deploy_and_init(&env);
    let c1 = Address::generate(&env);
    let c2 = Address::generate(&env);

    client.register_with_category(&c1, &0).unwrap();
    client.register_with_category(&c2, &1).unwrap();

    assert_eq!(client.get_campaigns_by_category(&0, &0, &10).len(), 1);
    assert_eq!(client.get_campaigns_by_category(&1, &0, &10).len(), 1);
}

#[test]
fn test_update_status_moves_campaign() {
    let env = Env::default();
    let (_admin, client) = deploy_and_init(&env);
    let campaign = Address::generate(&env);

    client.register_with_status(&campaign, &CampaignStatus::Active).unwrap();
    client.update_status(&campaign, &CampaignStatus::Active, &CampaignStatus::Successful).unwrap();

    assert_eq!(client.list_by_status(&CampaignStatus::Active, &0, &10).len(), 0);
    assert_eq!(client.list_by_status(&CampaignStatus::Successful, &0, &10).len(), 1);
    assert_eq!(client.list(&0, &10).len(), 1);
}

#[test]
fn test_update_status_not_found() {
    let env = Env::default();
    let (_admin, client) = deploy_and_init(&env);
    let unknown = Address::generate(&env);

    let result = client.try_update_status(&unknown, &CampaignStatus::Active, &CampaignStatus::Successful);
    assert_eq!(result, Err(Ok(ContractError::NotFound)));
}

#[test]
fn test_list_pagination() {
    let env = Env::default();
    let (_admin, client) = deploy_and_init(&env);

    for _ in 0..5 {
        client.register(&Address::generate(&env)).unwrap();
    }

    assert_eq!(client.list(&0, &3).len(), 3);
    assert_eq!(client.list(&3, &3).len(), 2);
    assert_eq!(client.list(&5, &3).len(), 0);
    assert_eq!(client.list(&0, &0).len(), 0);
}
