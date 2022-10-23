pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/switcher.circom";
include "../node_modules/circomlib/circuits/mimcsponge.circom";

template Mkt2VerifierLevel() {
    signal input sibling;
    signal input low;
    signal input selector;
    signal output root;

    component sw = Switcher();
    component hash = MiMCSponge(2, 220, 1);   

    sw.sel <== selector;
    sw.L <== low;
    sw.R <== sibling;

    hash.ins[0] <== sw.outL;
    hash.ins[1] <== sw.outR;
    hash.k <== 0;

    root <== hash.outs[0];
}

// There are 2^nLevels leaves in the Mkt
template Mkt2Verifier(nLevels) {
    // Private inputs
    signal input key;
    signal input secret;
    signal input siblings[nLevels];

    // Public inputs
    signal input nullifier;
    signal input root;

    // Public input to constraint relayer & argument to vote function
    // 1 | 0
    signal input vote;

    component n2b = Num2Bits(nLevels);
    component levels[nLevels];

    component hashV = MiMCSponge(2, 220, 1);
    
    hashV.ins[0] <== secret;
    hashV.ins[1] <== nullifier;
    hashV.k <== 0;

    n2b.in <== key;

    for (var i = nLevels - 1; i >= 0; i--) {
        levels[i] = Mkt2VerifierLevel();
        levels[i].sibling <== siblings[i];
        levels[i].selector <== n2b.out[i];
        if (i == nLevels - 1) {
            levels[i].low <== hashV.outs[0];
        } else {
            levels[i].low <== levels[i + 1].root;
        }
    }

    root === levels[0].root;
}
