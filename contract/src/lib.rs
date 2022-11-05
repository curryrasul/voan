use std::collections::HashSet;

use mimc_sponge_rs::str_to_fr;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::PanicOnDefault;
use near_sdk::{env, log, near_bindgen, AccountId};

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
    // Proposal message
    proposal: String,
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
        proposal: String,
    ) -> Self {
        // Check if the contract is not already initialized
        assert!(
            !near_sdk::env::state_exists(),
            "The contract has already been initialized"
        );

        // Maximum 8 accounts
        assert!(!voters_whitelist.is_empty() && voters_whitelist.len() <= 8);

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
            proposal,
        }
    }

    /// Function that insert the commitment into the Merkle Tree
    pub fn sign_up(&mut self, commitment: String) -> usize {
        // Check if it's before the deadline
        assert!(
            env::block_timestamp() < self.signup_deadline,
            "Registration is completed"
        );

        // Check if signer is in the whitelist
        // Remove him, so he cannot sign_up more
        let signer = env::signer_account_id();
        assert!(
            self.voters_whitelist.contains(&signer),
            "Signer not in the whitelist"
        );
        self.voters_whitelist.remove(&signer);

        // Insert the commitment into the Merkle Tree
        let pos = self.merkle_tree.insert(&commitment);

        log!(
            "Signer: {} inserts commitment: {} to position {}",
            signer,
            commitment,
            pos
        );

        pos
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

        let tmp: [String; 3] =
            serde_json::from_str(&pub_inputs).expect("Cannot deserialize pub_inputs");

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
        let vote: u8 = tmp[2].parse().expect("Cannot parse vote!");
        if vote == 1 {
            self.votes_pos += 1;
            log!("Votes_pos incremented! Votes_pos = {}", self.votes_pos);
        } else {
            log!("Voted against! Votes_pos not incremented");
        }
    }

    /// View function that returns Merkle Tree
    pub fn merkle_tree(&self) -> Vec<String> {
        self.merkle_tree.leaves()
    }

    /// View function that returns self.votes_pos
    pub fn how_many_pos(&self) -> u8 {
        self.votes_pos
    }

    /// View function that returns root of the Merkle Tree
    pub fn root(&self) -> String {
        self.merkle_tree.root().parse::<U256>().unwrap().to_string()
    }

    /// View function that returns siblings for the specified key
    pub fn siblings(&self, key: usize) -> Vec<String> {
        self.merkle_tree
            .get_siblings(key)
            .iter()
            .map(|s| s.parse::<U256>().unwrap().to_string())
            .rev()
            .collect()
    }

    /// View function that returns current nullifiers
    pub fn nullifiers(&self) -> HashSet<String> {
        self.nullifiers.clone()
    }

    /// View function that returns signup deadline
    pub fn get_signup_deadline(&self) -> u64 {
        self.signup_deadline
    }

    /// View function that returns voting deadline
    pub fn get_voting_deadline(&self) -> u64 {
        self.voting_deadline
    }

    /// View function, that returns proposal message
    pub fn get_proposal(&self) -> String {
        self.proposal.clone()
    }

    /// View function, that returns current whitelist
    pub fn get_cur_list(&self) -> HashSet<AccountId> {
        self.voters_whitelist.clone()
    }
}
