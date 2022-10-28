use std::collections::HashSet;

use mimc_sponge_rs::str_to_fr;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::PanicOnDefault;
use near_sdk::{env, near_bindgen, AccountId};

use electron_rs::verifier::near::*;

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
    // Verifying Groth16 key
    vkey: PreparedVerifyingKey,
    // Positive votes
    votes_pos: u8,
}

#[near_bindgen]
impl Contract {
    /// Smart-contract constructor
    #[init]
    pub fn new(
        vkey: String,
        voters_whitelist: HashSet<AccountId>,
        signup_deadline: u64,
        voting_deadline: u64,
    ) -> Self {
        // Check if the contract is not already initialized
        assert!(
            !near_sdk::env::state_exists(),
            "The contract has already been initialized"
        );

        // Verification key parsing
        let vkey = parse_verification_key(vkey).expect("Cannot deserialize verification key");
        let vkey = get_prepared_verifying_key(vkey);

        // Construct the contract
        Self {
            merkle_tree: MerkleTree::new(3),
            voters_whitelist,
            signup_deadline,
            voting_deadline,
            nullifiers: HashSet::new(),
            vkey,
            votes_pos: 0,
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

    /// Vote function
    pub fn vote(&mut self, proof: String, pub_inputs: String) {
        // Deadline checks
        assert!(
            env::block_timestamp() > self.signup_deadline || self.voters_whitelist.is_empty(),
            "Registration is not completed yet"
        );
        assert!(
            env::block_timestamp() < self.voting_deadline,
            "Voting is finished"
        );

        let tmp: [String; 3] = serde_json::from_str(&pub_inputs).unwrap();

        // Nullifier check
        assert!(!self.nullifiers.contains(&tmp[0]), "Already voted");
        self.nullifiers.insert(tmp[0].clone());

        // Merkle Tree Root check
        assert_eq!(
            hex_to_fr(&self.merkle_tree.root()),
            str_to_fr(&tmp[1]),
            "Wrong public input: Root of the Merkle Tree"
        );

        // SNARK Proof check
        assert!(
            verify_proof(self.vkey.clone(), proof, pub_inputs).expect("Cannot verify the proof"),
            "Wrong proof"
        );

        // Vote
        let vote: u8 = tmp[2].parse().unwrap();
        if vote == 1 {
            self.votes_pos += 1;
        }
    }

    /// View function that returns Merkle Tree
    pub fn merkle_tree(&self) -> Vec<String> {
        self.merkle_tree.leaves()
    }
}
