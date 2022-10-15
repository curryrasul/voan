use std::collections::HashSet;

use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::PanicOnDefault;
use near_sdk::{env, near_bindgen, AccountId};

mod merkle_tree;
use merkle_tree::MerkleTree;

mod utils;
use utils::*;

#[near_bindgen]
#[derive(BorshSerialize, BorshDeserialize, PanicOnDefault)]
pub struct Contract {
    merkle_tree: MerkleTree,
    voters_whitelist: HashSet<AccountId>,
}

#[near_bindgen]
impl Contract {
    /// Smart-contract constructor
    #[init]
    pub fn new(voters_whitelist: HashSet<AccountId>) -> Self {
        // Check if the contract is not already initialized
        assert!(
            !near_sdk::env::state_exists(),
            "The contract has already been initialized"
        );

        // Construct the construct
        Self {
            merkle_tree: MerkleTree::new(depth(voters_whitelist.len())),
            voters_whitelist,
        }
    }

    /// Function that insert the commitment into the Merkle Tree
    pub fn sign_up(&mut self, commitment: String) {
        // Check if signer is in the whitelist
        // Remove him, so he cannot sign_up more
        let signer = env::signer_account_id();
        assert!(self.voters_whitelist.contains(&signer));
        self.voters_whitelist.remove(&signer);

        // Insert the commitment into the Merkle Tree
        self.merkle_tree.insert(&commitment);
    }

    /// View function that returns Merkle Tree
    pub fn merkle_tree(&self) -> Vec<String> {
        self.merkle_tree.leaves()
    }
}
