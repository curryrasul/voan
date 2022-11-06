use mimc_sponge_rs::str_to_fr;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::UnorderedMap;
use near_sdk::{env, log, near_bindgen, AccountId, PanicOnDefault};

use std::collections::HashSet;

use electron_rs::verifier::near::*;

mod merkle_tree;
use merkle_tree::MerkleTree;

mod utils;
use utils::*;

mod voting;
use voting::*;

// --------------------------------------------------------------------
// Smart-contract

#[near_bindgen]
#[derive(BorshSerialize, BorshDeserialize, PanicOnDefault)]
pub struct Contract {
    // Vkey for Groth16 Verification
    vkey: PreparedVerifyingKey,
    // All votings
    votings: UnorderedMap<ID, Voting>,
    // Next voting ID
    next_id: ID,
}

#[near_bindgen]
impl Contract {
    // ---------------- CORE FUNCTIONS ----------------

    /// Smart-contract constructor
    #[init]
    pub fn new(vkey: String) -> Self {
        // Check if the contract is not already initialized
        assert!(
            !near_sdk::env::state_exists(),
            "The contract has already been initialized"
        );

        // Verification key parsing
        let vkey = parse_verification_key(vkey).expect("Cannot deserialize verification key");
        let vkey = get_prepared_verifying_key(vkey);

        log!("Contract is initialized");

        Self {
            vkey,
            votings: UnorderedMap::new(b"a"),
            next_id: 0,
        }
    }

    /// Creates new voting and returns its ID
    pub fn new_voting(
        &mut self,
        voters_whitelist: HashSet<AccountId>,
        signup_deadline: u64,
        voting_deadline: u64,
        proposal: String,
    ) -> ID {
        todo!()
    }

    /// Signs up to the specified voting
    pub fn sign_up(&mut self, id: ID, commitment: String) -> usize {
        todo!()
    }

    /// Votes in the specified voting
    pub fn vote(&mut self, id: ID, proof: String, pub_inputs: String) {
        todo!()
    }

    // ---------------- VIEW FUNCTIONS ----------------

    /// View function that returns Merkle Tree
    pub fn merkle_tree(&self, id: ID) -> Vec<String> {
        todo!()
    }

    /// View function that returns self.votes_pos
    pub fn how_many_pos(&self, id: ID) -> u8 {
        todo!()
    }

    /// View function that returns root of the Merkle Tree
    pub fn root(&self, id: ID) -> String {
        todo!()
    }

    /// View function that returns siblings for the specified key
    pub fn siblings(&self, id: ID, key: usize) -> Vec<String> {
        todo!()
    }

    /// View function that returns current nullifiers
    pub fn nullifiers(&self, id: ID) -> HashSet<String> {
        todo!()
    }

    /// View function that returns signup deadline
    pub fn get_signup_deadline(&self, id: ID) -> u64 {
        todo!()
    }

    /// View function that returns voting deadline
    pub fn get_voting_deadline(&self, id: ID) -> u64 {
        todo!()
    }

    /// View function, that returns proposal message
    pub fn get_proposal(&self, id: ID) -> String {
        todo!()
    }

    /// View function, that returns current whitelist
    pub fn get_cur_list(&self, id: ID) -> HashSet<AccountId> {
        todo!()
    }
}
