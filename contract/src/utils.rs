#![allow(clippy::assign_op_pattern)]

use mimc_sponge_rs::{str_to_fr, Fr};
use uint::construct_uint;

construct_uint! {
    pub(crate) struct U256(4);
}

// /// Helper function that tells what's the depth of the
// /// tree must be
// pub(crate) fn depth(num: usize) -> u8 {
//     let mut res = 0;
//     let mut temp_num = 1;
//     while temp_num < num {
//         temp_num *= 2;
//         res += 1;
//     }
//     res
// }

/// Helper function, that converts hex to Fr
pub(crate) fn hex_to_fr(hex: &str) -> Fr {
    let n = hex.parse::<U256>().unwrap().to_string();
    str_to_fr(&n)
}

/// Helper function, that converts Fr to hex
pub(crate) fn fr_to_hex(hex: &Fr) -> String {
    let hex = hex.to_string();
    hex[3..(hex.len() - 1)].to_string()
}
