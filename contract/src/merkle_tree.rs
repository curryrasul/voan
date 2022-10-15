use crate::{fr_to_hex, hex_to_fr};

use mimc_sponge_rs::{str_to_fr, Fr, MimcSponge};

use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::Vector;

#[derive(BorshSerialize, BorshDeserialize)]
pub struct MerkleTree {
    leaves: Vector<String>,
    key: u64,
}

impl MerkleTree {
    /// Merkle Tree constructor with near_sdk::collections::Vector
    pub fn new(depth: u8) -> Self {
        assert!(depth > 1, "Depth must be bigger than 1");

        let mut leaves = Vector::new(b"m");

        // Initialize the Vector with default values.
        // If the depth is n => there are 2^n leaves
        // and 2^(n + 1) - 1 elements total
        let total = (1 << (depth + 1)) - 1;
        for _ in 0..total {
            leaves.push(&fr_to_hex(&Fr::default()));
        }

        let key = total - (1 << depth);

        Self { leaves, key }
    }

    /// Function that inserts the leaf into the Merkle Tree
    pub fn insert(&mut self, leaf: &str) {
        let mut cur_pos = self.key;
        self.key += 1;

        let leaf = str_to_fr(leaf);
        self.leaves.replace(cur_pos, &fr_to_hex(&leaf));

        let hasher = MimcSponge::default();
        while cur_pos != 0 {
            let arr = if cur_pos % 2 != 0 {
                [
                    hex_to_fr(&self.leaves.get(cur_pos).unwrap()),
                    hex_to_fr(&self.leaves.get(cur_pos + 1).unwrap()),
                ]
            } else {
                [
                    hex_to_fr(&self.leaves.get(cur_pos - 1).unwrap()),
                    hex_to_fr(&self.leaves.get(cur_pos).unwrap()),
                ]
            };

            cur_pos = (cur_pos - 1) / 2;

            let mimc_key = Fr::default();
            let output = fr_to_hex(&hasher.multi_hash(&arr, mimc_key, 1)[0]);
            self.leaves.replace(cur_pos, &output);
        }
    }

    /// Function that returns the leaves of the Merkle Tree
    pub fn leaves(&self) -> Vec<String> {
        self.leaves.to_vec()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn temper() {
        let hex1 = str_to_fr("10").to_string();
        let hex1 = &hex1[3..(hex1.len() - 1)].to_string();
        let fr1 = hex_to_fr(hex1);

        let hex2 = str_to_fr("20").to_string();
        let hex2 = &hex2[3..(hex2.len() - 1)].to_string();
        let fr2 = hex_to_fr(hex2);

        let hasher = MimcSponge::default();
        let key = str_to_fr("0");

        let res1 = hasher.multi_hash(&[fr1, fr2], key, 1)[0];

        let fr1 = str_to_fr("10");
        let fr2 = str_to_fr("20");

        let res2 = hasher.multi_hash(&[fr1, fr2], key, 1)[0];

        assert_eq!(res1, res2);
    }
}
