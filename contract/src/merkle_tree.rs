#[derive(BorshSerialize, BorshDeserialize)]
pub struct MerkleTree {
    depth: u8,
    leaves: Vector<String>,
    key: u32,
}
