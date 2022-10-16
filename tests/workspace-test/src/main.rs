use near_units::parse_near;
use near_workspaces::{Account, AccountId};
use serde_json::json;

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
        .args_json(json!({ "voters_whitelist": voters_whitelist }))
        .transact()
        .await?;
    println!(
        "Deploy Transaction \nSuccess: {}\nGasBurnt: {}\n",
        deploy_status.is_success(),
        deploy_status.total_gas_burnt
    );

    // ---------------------------------------------------------------
    // Sign Up Test

    let (status, gas_burnt) = sign_up(&alice, contract.id(), "12345").await;
    println!(
        "Alice Sign Up Transaction \nSuccess: {}\nGasBurnt: {}\n",
        status, gas_burnt
    );

    let (status, gas_burnt) = sign_up(&bob, contract.id(), "12345").await;
    println!(
        "Bob Sign Up Transaction \nSuccess: {}\nGasBurnt: {}\n",
        status, gas_burnt
    );

    let (status, gas_burnt) = sign_up(&bob, contract.id(), "12345").await;
    println!(
        "Bob Sign Up Transaction (Must Fail) \nSuccess: {}\nGasBurnt: {}\n",
        status, gas_burnt
    );

    let (status, gas_burnt) = sign_up(&jordan, contract.id(), "12345").await;
    println!(
        "Jordan Sign Up Transaction \nSuccess: {}\nGasBurnt: {}\n",
        status, gas_burnt
    );

    // ---------------------------------------------------------------

    Ok(())
}

async fn create_sub(account: &Account, name: &str) -> Account {
    account
        .create_subaccount(name)
        .initial_balance(parse_near!("10 N"))
        .transact()
        .await
        .unwrap()
        .result
}

async fn sign_up(account: &Account, contract_id: &AccountId, commitment: &str) -> (bool, u64) {
    let output = account
        .call(contract_id, "sign_up")
        .args_json(json!({ "commitment": commitment }))
        .max_gas()
        .transact()
        .await
        .unwrap();

    (output.is_success(), output.total_gas_burnt)
}
