use mimc_sponge_rs::{str_to_fr, Fr, MimcSponge};
use near_units::parse_near;
use near_workspaces::{Account, AccountId};
use serde_json::json;

mod utils;
use utils::*;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    use std::collections::HashSet;

    // ---------------------------------------------------------------
    // Initialization and SubAccount creation

    let worker = near_workspaces::sandbox().await?;
    println!("Sandbox Initialized\n");

    let root = worker.root_account()?;
    println!("Root account of the Sandbox is {}\n", root.id());

    let alice = create_sub(&root, "alice").await;
    let bob = create_sub(&root, "bob").await;
    let jordan = create_sub(&root, "jordan").await;

    println!(
        "SubAccounts: [{}, {}, {}] created\n",
        alice.id(),
        bob.id(),
        jordan.id()
    );

    // ---------------------------------------------------------------
    // Deploy and constructor call

    let voters_whitelist: HashSet<&AccountId> = vec![alice.id(), bob.id(), jordan.id()]
        .into_iter()
        .collect();

    let wasm = std::fs::read("../../contract/output/contract.wasm").unwrap();
    let contract = worker.dev_deploy(&wasm).await?;
    let deploy_status = contract
        .call("new")
        .max_gas()
        .args_json(json!({ "voters_whitelist": voters_whitelist,
            "signup_deadline": u64::MAX,
            "voting_deadline" : u64::MAX
        }))
        .transact()
        .await?;

    println!(
        "Deploy Transaction \nSuccess: {}\nGasBurnt: {}\n",
        deploy_status.is_success(),
        deploy_status.total_gas_burnt
    );

    // ---------------------------------------------------------------
    // Sign Up Test

    let alice_commitment = "1234567";
    let bob_commitment = "7654321";
    let jordan_commitment = "9999999";

    let (status, gas_burnt) = sign_up(&alice, contract.id(), alice_commitment).await;
    println!(
        "Alice Sign Up Transaction \nSuccess: {}\nGasBurnt: {}\n",
        status, gas_burnt
    );

    let (status, gas_burnt) = sign_up(&bob, contract.id(), bob_commitment).await;
    println!(
        "Bob Sign Up Transaction \nSuccess: {}\nGasBurnt: {}\n",
        status, gas_burnt
    );

    let (status, gas_burnt) = sign_up(&bob, contract.id(), "12345").await;
    println!(
        "Bob Sign Up Transaction (Must Fail) \nSuccess: {}\nGasBurnt: {}\n",
        status, gas_burnt
    );

    let (status, gas_burnt) = sign_up(&jordan, contract.id(), jordan_commitment).await;
    println!(
        "Jordan Sign Up Transaction \nSuccess: {}\nGasBurnt: {}\n",
        status, gas_burnt
    );

    // ---------------------------------------------------------------
    // Merkle Tree Test

    // Final Merkle Tree
    let out = contract
        .call("merkle_tree")
        .view()
        .await?
        .json::<Vec<String>>()
        .unwrap();

    let hasher = MimcSponge::default();
    let key = str_to_fr("0");

    let alice_commitment = str_to_fr("1234567");
    let bob_commitment = str_to_fr("7654321");
    let jordan_commitment = str_to_fr("9999999");

    // First two leaves
    let first_first = [alice_commitment, bob_commitment];
    // Second two leaves
    let second_second = [jordan_commitment, Fr::default()];
    // Hash of first two leaves
    let first = hasher.multi_hash(&first_first, key, 1)[0];
    // Hash of second two leaves
    let second = hasher.multi_hash(&second_second, key, 1)[0];
    // Root of Merkle Tree
    let root = hasher.multi_hash(&[first, second], key, 1)[0];

    assert_eq!(fr_to_hex(&alice_commitment), out[3]);
    assert_eq!(fr_to_hex(&bob_commitment), out[4]);
    assert_eq!(fr_to_hex(&jordan_commitment), out[5]);
    assert_eq!(fr_to_hex(&first), out[1]);
    assert_eq!(fr_to_hex(&second), out[2]);
    assert_eq!(fr_to_hex(&root), out[0]);

    println!("Merkle Tree test is fine\n");

    Ok(())
}
