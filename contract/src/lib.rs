use electron_rs::verifier::near::*;
use mimc_sponge_rs::MimcSponge;

use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::serde::{Deserialize, Serialize};

use near_sdk::collections::UnorderedSet;

use near_sdk::near_bindgen;
use near_sdk::PanicOnDefault;

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Proposal {
    message: String,
}

#[derive(BorshSerialize, BorshDeserialize)]
pub enum VotingStatus {
    Active,
    Inactive,
}

#[near_bindgen]
#[derive(BorshSerialize, BorshDeserialize, PanicOnDefault)]
pub struct Contract {
    vkey: PreparedVerifyingKey,
    merkle_root: String,

    proposal: Proposal,

    deadline: u64,
    status: VotingStatus,
    number_of_voters: u32,

    votes_pos: u32,

    nullifiers: UnorderedSet<String>,
}

#[near_bindgen]
impl Contract {
    #[init]
    pub fn new(
        vkey: String,
        merkle_root: String,
        proposal: Proposal,
        deadline: u64,
        number_of_voters: u32,
    ) -> Self {
        assert!(
            !near_sdk::env::state_exists(),
            "The contract has already been initialized"
        );

        // Verification key parsing
        let vkey = parse_verification_key(vkey).expect("Cannot deserialize verification key");
        let vkey = get_prepared_verifying_key(vkey);

        let status = VotingStatus::Active;
        let votes_pos = 0;

        let nullifiers = UnorderedSet::new(b"a");

        Self {
            vkey,
            merkle_root,
            proposal,
            deadline,
            status,
            number_of_voters,
            votes_pos,
            nullifiers,
        }
    }

    pub fn vote(proof: String, pub_inputs: String) {
        // To check that status is active
        // To check that this is before the deadline

        // To check the correctness of zkproof:
        //     root in pub_inputs == root in the contract

        // To check that the nullifier from pub_inputs is not in the set
        todo!()
    }
}
