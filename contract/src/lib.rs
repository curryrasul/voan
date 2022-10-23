use std::collections::HashSet;

use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::PanicOnDefault;
use near_sdk::{env, near_bindgen, AccountId};

mod merkle_tree;
use merkle_tree::MerkleTree;

mod utils;
use utils::*;

// --------------------------------------------------------------------
// Useful structs and impls

/// Status of voting
#[derive(BorshSerialize, BorshDeserialize, PartialEq, Eq, Debug)]
pub enum Status {
    SignUp,
    Voting,
    Inactive,
}

// --------------------------------------------------------------------
// Smart-contract

#[near_bindgen]
#[derive(BorshSerialize, BorshDeserialize, PanicOnDefault)]
pub struct Contract {
    // Merkle tree
    merkle_tree: MerkleTree,
    // Whitelist of voters
    voters_whitelist: HashSet<AccountId>,
    // Status of voting
    status: Status,
    // Deadline for sign up
    signup_deadline: u64,
    // Deadline for voting
    voting_deadline: u64,
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
            status: Status::SignUp,
            signup_deadline,
            voting_deadline,
        }
    }

    /// Function that insert the commitment into the Merkle Tree
    pub fn sign_up(&mut self, commitment: String) {
        // Check if status is SignUp
        assert_eq!(self.status, Status::SignUp, "Sign Up is finished");

        // Check if signer is in the whitelist
        // Remove him, so he cannot sign_up more
        let signer = env::signer_account_id();
        assert!(self.voters_whitelist.contains(&signer));
        self.voters_whitelist.remove(&signer);

        // Insert the commitment into the Merkle Tree
        self.merkle_tree.insert(&commitment);

        // If everyone signed up change the status to Voting
        if self.voters_whitelist.is_empty() {
            self.status = Status::Voting;
        }
    }

    /// Helper function to change status to Voting
    pub fn start_voting(&mut self) {
        assert_eq!(self.status, Status::SignUp, "Cannot change the status");
        assert!(
            env::block_timestamp() > self.signup_deadline,
            "Not a deadline yet"
        );

        self.status = Status::Voting;
    }

    /// Helper function to change status to Inactive
    pub fn finish_voting(&mut self) {
        assert_eq!(self.status, Status::Voting, "Cannot change the status");
        assert!(
            env::block_timestamp() > self.voting_deadline,
            "Not a deadline yet"
        );

        self.status = Status::Inactive;
    }

    /// View function that returns Merkle Tree
    pub fn merkle_tree(&self) -> Vec<String> {
        self.merkle_tree.leaves()
    }
}
