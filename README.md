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
As everything on blockchains is visible to others (f.e. you cannot send tokens to your friends privately) it is impossible to build apps with privacy on modern blockchains (NEAR Protocol, Ethereum) without the help of other primitives. The thing that helps us to build such apps is *zk-cryptography*: it allows us to prove that we know some information, without revealing this information, for example: for some publicly-known number `c`, I can prove that I know factors `a` and `b` (without revealing them), such that `a * b = c`. Thus, we can prove that we belong to a certain set without revealing who we are (that is also called proof of set membership) ... and that actually the key mechanism of voting. Let's divide the vote into several stages:

1. Voting creation/initialization
2. Voting itself

In the first step, host of a voting sets the rules: proposal, deadlines, jury list/whitelist, etc. The main thing here is the whitelist. This whitelist contains public keys of participants of a voting. 

In the second step participants can vote, and they can do that by proving the knowledge of a private key that matches their public key and that this exact public key is in the whitelist. 
By that participant didn't reveal himself and really was able to prove that he has the right to vote (if a person were not on the whitelist, he would not be able to create such evidence).

There are few problems here and some you might noticed yourself:

1. Participant can vote more than once
2. Participant will reveal himself if he calls the transaction from his publicly known address/account

Let's discuss second problem first. As already said, if a participant calls vote-transaction from his address, he reveals himself. One of the solutions that can come to mind to create new account and vote from it. But in blockchains you have to pay a GAS fee. So, you need to top up the balance of a new account, but if you do that it will be easy to establish a connection between a publicly known account and a new one. Seems impossible now ... But, actually we can delegate the transaction call to a separate person - *relayer*. So, we'll create proof that 


### Tech explanation
The protocol consists of three parts:
* Smart-contract
* Client-side app
* Relayer

### Tech stack
Programming languages: 
* Rust - Smart-contract, tests
* JS | React - WebUI
* NodeJS - Relayer
* Circom - zkSNARK circuits

Primitives:
* Groth16 - used for a zkp-side (arkworks-rs/groth16 + electron-labs/verifier & SnarkJS + Circom)
* Merkle Tree + MiMCSponge (fully implemented by our team)

**Smart-contract**

Smart-contract is implemented with Rust. 

**Client app**

Client app is implemented with JS.

**Relayer**

Relayer is implemented with NodeJS.
