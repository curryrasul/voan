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
        threshold: u8,
        signup_deadline: u64,
        voting_deadline: u64,
        proposal: String,
    ) -> ID {
        let key = self.next_id;
        let voting = Voting::new(
            voters_whitelist,
            threshold,
            signup_deadline,
            voting_deadline,
            proposal,
        );
        self.votings.insert(&self.next_id, &voting);

        log!("New voting with ID: {} was created", key);

        self.next_id += 1;

        key
    }

    /// Signs up to the specified voting
    pub fn sign_up(&mut self, id: ID, commitment: String) -> usize {
        let mut voting = self.votings.get(&id).expect(ID_ERR);

        assert_eq!(voting.status, Status::Open, "Voting is closed");

        let key = voting.sign_up(commitment);
        self.votings.insert(&id, &voting);

        key
    }

    /// Votes in the specified voting
    pub fn vote(&mut self, id: ID, proof: String, pub_inputs: String) {
        let mut voting = self.votings.get(&id).expect(ID_ERR);

        assert_eq!(voting.status, Status::Open, "Voting is closed");

        // Deadline checks
        assert!(
            env::block_timestamp() > voting.signup_deadline || voting.voters_whitelist.is_empty(),
            "Registration is not completed yet"
        );

        assert!(
            env::block_timestamp() < voting.voting_deadline,
            "Voting is finished"
        );

        let tmp: [String; 3] =
            serde_json::from_str(&pub_inputs).expect("Cannot deserialize pub_inputs");

        // Nullifier check
        assert!(!voting.nullifiers.contains(&tmp[0]), "Already voted");
        voting.nullifiers.insert(tmp[0].clone());

        // Merkle Tree Root check
        assert_eq!(
            hex_to_fr(&voting.merkle_tree.root()),
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
            voting.votes_pos += 1;
            log!("Votes_pos incremented! Votes_pos = {}", voting.votes_pos);
        } else {
            log!("Voted against! Votes_pos not incremented");
        }

        if voting.votes_pos == voting.threshold {
            voting.status = Status::Close;
            log!("Voting {} is closed", id);
        }

        self.votings.insert(&id, &voting);
    }

    // ---------------- VIEW FUNCTIONS ----------------

    /// View function that returns Merkle Tree
    pub fn merkle_tree(&self, id: ID) -> Vec<String> {
        self.votings.get(&id).expect(ID_ERR).merkle_tree.leaves()
    }

    /// View function that returns self.votes_pos
    pub fn how_many_pos(&self, id: ID) -> u8 {
        self.votings.get(&id).expect(ID_ERR).votes_pos
    }

    /// View function that returns self.threshold
    pub fn get_threshold(&self, id: ID) -> u8 {
        self.votings.get(&id).expect(ID_ERR).threshold
    }

    /// View function that returns root of the Merkle Tree
    pub fn root(&self, id: ID) -> String {
        self.votings
            .get(&id)
            .expect(ID_ERR)
            .merkle_tree
            .root()
            .parse::<U256>()
            .unwrap()
            .to_string()
    }

    /// View function that returns siblings for the specified key
    pub fn siblings(&self, id: ID, key: usize) -> Vec<String> {
        self.votings
            .get(&id)
            .expect(ID_ERR)
            .merkle_tree
            .get_siblings(key)
            .iter()
            .map(|s| s.parse::<U256>().unwrap().to_string())
            .rev()
            .collect()
    }

    /// View function that returns current nullifiers
    pub fn nullifiers(&self, id: ID) -> HashSet<String> {
        self.votings.get(&id).expect(ID_ERR).nullifiers
    }

    /// View function that returns signup deadline
    pub fn get_signup_deadline(&self, id: ID) -> u64 {
        self.votings.get(&id).expect(ID_ERR).signup_deadline
    }

    /// View function that returns voting deadline
    pub fn get_voting_deadline(&self, id: ID) -> u64 {
        self.votings.get(&id).expect(ID_ERR).voting_deadline
    }

    /// View function, that returns proposal message
    pub fn get_proposal(&self, id: ID) -> String {
        self.votings.get(&id).expect(ID_ERR).proposal
    }

    /// View function, that returns current whitelist
    pub fn get_cur_list(&self, id: ID) -> HashSet<AccountId> {
        self.votings.get(&id).expect(ID_ERR).voters_whitelist
    }
}
