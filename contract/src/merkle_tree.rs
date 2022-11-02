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

        // Calculate Merkle Tree
        let hasher = MimcSponge::default();
        let mimc_key = Fr::default();
        for i in (0..key).rev() {
            let first = hex_to_fr(&leaves[2 * i + 1]);
            let second = hex_to_fr(&leaves[2 * i + 2]);
            leaves[i] = fr_to_hex(&hasher.multi_hash(&[first, second], mimc_key, 1)[0]);
        }

        Self { leaves, key }
    }

    /// Function that inserts the leaf into the Merkle Tree
    pub(crate) fn insert(&mut self, leaf: &str) {
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
    pub(crate) fn leaves(&self) -> Vec<String> {
        self.leaves.clone()
    }

    /// Return root of merkle tree
    pub(crate) fn root(&self) -> String {
        self.leaves[0].clone()
    }

    /// Return siblings for the specified key
    pub(crate) fn get_siblings(&self, key: usize) -> Vec<String> {
        let mut key = key + 7;
        assert!(key < 15, "No such key in Merkle Tree");

        let mut siblings = vec![];

        while key != 0 {
            if key % 2 == 0 {
                siblings.push(self.leaves[key - 1].clone());
            } else {
                siblings.push(self.leaves[key + 1].clone());
            }
            key = (key - 1) / 2;
        }

        siblings
    }
}
