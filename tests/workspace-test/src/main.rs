use near_units::parse_near;
use near_workspaces::{Account, AccountId};
use serde_json::json;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    use std::collections::HashSet;

    // Sandbox initialization
    let worker = near_workspaces::sandbox().await?;
    println!("Sandbox Initialized\n");

    // Root account
    let root = worker.root_account()?;
    println!("Root account of the Sandbox is {}\n", root.id());

    // SubAccount creation
    let alice = create_sub(&root, "alice").await;
    let bob = create_sub(&root, "bob").await;
    let jordan = create_sub(&root, "jordan").await;

    println!(
        "SubAccounts: [{}, {}, {}] created\n",
        alice.id(),
        bob.id(),
        jordan.id()
    );

    let voters_whitelist: HashSet<&AccountId> = vec![alice.id(), bob.id(), jordan.id()]
        .into_iter()
        .collect();

    let wasm = std::fs::read("../../contract/output/contract.wasm").unwrap();
    let contract = worker.dev_deploy(&wasm).await?;
    let outcome = contract
        .call("new")
        .args_json(json!({ "voters_whitelist": voters_whitelist }))
        .transact()
        .await?;

    println!("{:#?}", outcome);

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
