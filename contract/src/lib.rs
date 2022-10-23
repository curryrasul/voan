use std::collections::HashSet;

use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::PanicOnDefault;
use near_sdk::{env, near_bindgen, AccountId};

mod merkle_tree;
use merkle_tree::MerkleTree;

mod utils;
use utils::*;

// --------------------------------------------------------------------
// Smart-contract

#[near_bindgen]
#[derive(BorshSerialize, BorshDeserialize, PanicOnDefault)]
pub struct Contract {
    // Merkle tree
    merkle_tree: MerkleTree,
    // Whitelist of voters
    voters_whitelist: HashSet<AccountId>,
    // Deadline for sign up
    signup_deadline: u64,
    // Deadline for voting
    voting_deadline: u64,
    // Nullifiers HashSet to prevent the double-vote
    nullifiers: HashSet<String>,
    // Positive votes
    positive_votes: u32,
}

#[near_bindgen]
impl Contract {
    /// Smart-contract constructor
    #[init]
    pub fn new(
        voters_whitelist: HashSet<AccountId>,
        signup_deadline: u64,
        voting_deadline: u64,
    ) -> Self {
        // Check if the contract is not already initialized
        assert!(
            !near_sdk::env::state_exists(),
            "The contract has already been initialized"
        );

        // Construct the contract
        Self {
            merkle_tree: MerkleTree::new(depth(voters_whitelist.len())),
            voters_whitelist,
            signup_deadline,
            voting_deadline,
            nullifiers: HashSet::new(),
            positive_votes: 0,
        }
    }

    /// Function that insert the commitment into the Merkle Tree
    pub fn sign_up(&mut self, commitment: String) {
        // Check if it's before the deadline
        assert!(
            env::block_timestamp() < self.signup_deadline,
            "Registration is completed"
        );

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
