#![allow(clippy::assign_op_pattern)]

use crate::*;
use uint::construct_uint;

construct_uint! {
    pub struct U256(4);
}

pub async fn create_sub(account: &Account, name: &str) -> Account {
    account
        .create_subaccount(name)
        .initial_balance(parse_near!("10 N"))
        .transact()
        .await
        .unwrap()
        .result
}

pub async fn sign_up(account: &Account, contract_id: &AccountId, commitment: &str) -> (bool, u64) {
    let output = account
        .call(contract_id, "sign_up")
        .args_json(json!({ "commitment": commitment }))
        .max_gas()
        .transact()
        .await
        .unwrap();

    (output.is_success(), output.total_gas_burnt)
}

/// Helper function, that converts Fr to hex
pub fn fr_to_hex(hex: &Fr) -> String {
    let hex = hex.to_string();
    hex[3..(hex.len() - 1)].to_string()
}
