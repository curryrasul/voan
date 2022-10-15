use mimc_sponge_rs::{str_to_fr, MimcSponge};

use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::Vector;

#[derive(BorshSerialize, BorshDeserialize)]
pub struct MerkleTree {
    leaves: Vector<String>,
    key: u32,
}

impl MerkleTree {
    /// Merkle Tree constructor with near_sdk::collections::Vector
    pub fn new(depth: u8) -> Self {
        let mut leaves = Vector::new(b"m");

        // Initialize the Vector with default values.
        // If the depth is n => there are 2^n leaves
        // and 2^(n + 1) - 1 elements total
        for _ in 0..((1 << (depth + 1)) - 1) {
            let hex = str_to_fr("0").to_string();
            leaves.push(&hex[3..(hex.len() - 1)].to_string());
        }

        Self { leaves, key: 0 }
    }

    /// Function that inserts the leaf into the Merkle Tree
    pub fn insert(&mut self, leaf: &str) {
        let leaf = str_to_fr(leaf);

        self.key += 1;
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
        let hex = str_to_fr("0").to_string();
        println!("{}", &hex[3..(hex.len() - 1)].to_string());
    }
}
