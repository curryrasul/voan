<h1 align="center">VOAN</h1>
<p align="center">
    <img src="./images/voan-logo.jpeg" width="150">
</p>
<h4 align="center">ANonymous VOting on NEAR Protocol</h4>

___

<h2 align="center">Motivation</h2>

One of the key requirements for votings is **privacy**. Main motivation comes from experience of participating in DAO's: you cannot vote against the proposal, because you can offend someone. Anonymity would be a great option.

---

<h2 align="center">How it works</h2>

### Abstract
The verifier checks zkSNARK proof. If member is in the merkle tree he can make it right and everything will be fine.

### Tech stack
Programming languages: 
* Rust - Smart-contract, tests
* JS | React - WebUI
* NodeJS - Relayer
* Circom - zkSNARK circuits

Primitives:
* Groth16 - used for a zkp-side (arkworks-rs/groth16 + electron-labs/verifier & SnarkJS + Circom)
* Merkle Tree + MiMCSponge (fully implemented by our team)

### Tech explanation
The protocol consists of three parts:
* Smart-contract
* Client-side app
* Relayer

### Smart-contract
Smart-contract is implemented with Rust. 

### Client app
Client app is implemented with JS.

### Relayer

Relayer is implemented with NodeJS.

---

<h2 align="center">How to run</h2>

```bash
host-script.sh
client-script.sh
```
