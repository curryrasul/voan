pragma circom 2.0.0;
include "./protocol.circom";

component main { public [nullifier, root, vote] } = Mkt2Verifier(3);
