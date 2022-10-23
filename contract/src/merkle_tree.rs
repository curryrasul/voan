use crate::{fr_to_hex, hex_to_fr};

use mimc_sponge_rs::{str_to_fr, Fr, MimcSponge};

use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize)]
pub struct MerkleTree {
    leaves: Vec<String>,
    key: usize,
}

impl MerkleTree {
    /// Merkle Tree constructor
    pub fn new(depth: u8) -> Self {
        assert!(depth > 1, "Depth must be bigger than 1");
        let total_len = (1 << (depth + 1)) - 1;

        let mut leaves = Vec::with_capacity(total_len);

        // Initialize the Vector with default values.
        // If the depth is n => there are 2^n leaves
        // and 2^(n + 1) - 1 elements total
        leaves.resize(total_len, fr_to_hex(&Fr::default()));

        let key = total_len - (1 << depth);

        Self { leaves, key }
    }

    /// Function that inserts the leaf into the Merkle Tree
    pub fn insert(&mut self, leaf: &str) {
        let mut cur_pos = self.key;
        self.key += 1;

        let leaf = str_to_fr(leaf);
        self.leaves[cur_pos] = fr_to_hex(&leaf);

        let hasher = MimcSponge::default();
        while cur_pos != 0 {
            let arr = if cur_pos % 2 != 0 {
                [
                    hex_to_fr(self.leaves.get(cur_pos).unwrap()),
                    hex_to_fr(self.leaves.get(cur_pos + 1).unwrap()),
                ]
            } else {
                [
                    hex_to_fr(self.leaves.get(cur_pos - 1).unwrap()),
                    hex_to_fr(self.leaves.get(cur_pos).unwrap()),
                ]
            };

            cur_pos = (cur_pos - 1) / 2;

            let mimc_key = Fr::default();
            let output = fr_to_hex(&hasher.multi_hash(&arr, mimc_key, 1)[0]);
            self.leaves[cur_pos] = output;
        }
    }

    /// Function that returns the leaves of the Merkle Tree
    pub fn leaves(&self) -> Vec<String> {
        self.leaves.clone()
    }
}
