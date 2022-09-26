pragma circom 2.0.0;
include "./protocol.circom";

// to add public inputs for a relayer
component main { public [nullifier, root, candidateId] } = Mkt2Verifier(3);
