use crate::*;
use std::collections::HashSet;

#[derive(BorshSerialize, BorshDeserialize, PartialEq, Eq, Debug)]
pub(crate) enum Status {
    Open,
    Close,
}

#[derive(BorshSerialize, BorshDeserialize)]
pub(crate) struct Voting {
    // Merkle tree
    pub(crate) merkle_tree: MerkleTree,
    // Whitelist of voters
    pub(crate) voters_whitelist: HashSet<AccountId>,
    // Deadline for sign up
    pub(crate) signup_deadline: u64,
    // Deadline for voting
    pub(crate) voting_deadline: u64,
    // Nullifiers HashSet to prevent the double-vote
    pub(crate) nullifiers: HashSet<String>,
    // Positive votes
    pub(crate) votes_pos: u8,
    // Proposal message
    pub(crate) proposal: String,
    // Voting Status
    pub(crate) status: Status,
    // Voting threshold
    pub(crate) threshold: u8,
}

impl Voting {
    pub fn new(
        voters_whitelist: HashSet<AccountId>,
        threshold: u8,
        signup_deadline: u64,
        voting_deadline: u64,
        proposal: String,
    ) -> Self {
        let num_of_participants = voters_whitelist.len();
        assert!(
            (1..=8).contains(&num_of_participants),
            "Minumum 1 & Maximum 8 participants"
        );
        assert!(
            threshold > 0 && threshold as usize <= num_of_participants,
            "Threshold have to be bigger than 0 and lower or equal to number of participants"
        );

        Self {
            merkle_tree: MerkleTree::new(3),
            voters_whitelist,
            signup_deadline,
            voting_deadline,
            nullifiers: HashSet::new(),
            votes_pos: 0,
            proposal,
            threshold,
            status: Status::Open,
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
}
