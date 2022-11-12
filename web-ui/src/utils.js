import { connect, Contract, keyStores, WalletConnection, providers } from 'near-api-js'
import { getConfig } from './config'
import { buildMimcSponge } from 'circomlibjs'
import { randomBytes } from 'crypto'
/* global BigInt */

const nearConfig = getConfig('testnet')

export async function initContract() {
    const near = await connect(Object.assign({ keyStore: new keyStores.BrowserLocalStorageKeyStore() }, nearConfig))

    window.walletConnection = new WalletConnection(near)

    window.accountId = window.walletConnection.getAccountId()

    window.voanContract = await new Contract(window.walletConnection.account(), nearConfig.contractName, {
        viewMethods: ['get_proposal', 'get_signup_deadline', 'get_voting_deadline', 'get_cur_list', 'nullifiers', 'how_many_pos', 'get_threshold'],
        changeMethods: ['new_voting', 'sign_up'],
    })
}

export function logout() {
    window.walletConnection.signOut()
    window.location.replace(window.location.origin + window.location.pathname)
}

export function login() {
    window.walletConnection.requestSignIn(nearConfig.contractName)
}

export async function getTransactionResult(txhash) {
    const provider = new providers.JsonRpcProvider(nearConfig.nodeUrl);
    // Retrieve transaction result from the network
    const transaction = await provider.txStatus(txhash, 'unnused');

    return providers.getTransactionLastResult(transaction);
}

export async function new_voting(options) {
    const voteID = await window.voanContract.new_voting({ callbackUrl: 'http://localhost:3000/done', meta: options.proposal, args: options, gas: 300000000000000 })
    return voteID
}

export async function get_proposal(id) {
    const proposal = await window.voanContract.get_proposal({ id: id })
    return proposal
}

export async function get_signup_deadline(id) {
    const signup_deadline = await window.voanContract.get_signup_deadline({ id: id })
    return signup_deadline
}

export async function get_voting_deadline(id) {
    const voting_deadline = await window.voanContract.get_voting_deadline({ id: id })
    return voting_deadline
}

export async function get_cur_list(id) {
    const cur_list = await window.voanContract.get_cur_list({ id: id })
    return cur_list
}

export async function get_vote_count(id) {
    const nullifiers = await window.voanContract.nullifiers({ id: id })
    return nullifiers.length
}

export async function get_yes_count(id) {
    const pos_count = await window.voanContract.how_many_pos({ id: id })
    return pos_count
}

export async function get_threshold(id) {
    const threshold = await window.voanContract.get_threshold({ id: id })
    return threshold
}

export async function sign_up(id, commitment) {
    const position = await window.voanContract.sign_up({ id: id, commitment: commitment }, "300000000000000")
    return position
}

export async function getVoteData(id) {
    const options = {
        proposal: await get_proposal(id),
        signup_deadline: await get_signup_deadline(id),
        voting_deadline: await get_voting_deadline(id),
        threshold: await get_threshold(id),
        yes_count: await get_yes_count(id),
        vote_count: await get_vote_count(id),
        wait_list: await get_cur_list(id)
    }
    return options
}

export async function generateRegistrationParams() {
    let mimcSponge = await buildMimcSponge()

    let secret_bytes = randomBytes(31)
    let secret = await mimcSponge.F.toString(secret_bytes, 10)

    let nullifier_bytes = randomBytes(31)
    let nullifier = await mimcSponge.F.toString(nullifier_bytes, 10)

    let commitment_bytes = await mimcSponge.multiHash([BigInt(secret), BigInt(nullifier)], 0, 1)
    let commitment = await mimcSponge.F.toString(commitment_bytes, 10)

    return {
        secret: secret,
        nullifier: nullifier,
        commitment: commitment
    }
}

export function makeAndDownloadKeyFile(voteID, position) {
    let name = `voanVote${voteID}Keys`
    let opts = JSON.parse(window.localStorage.getItem(name))
    if (!opts) {
        console.log('Can`t find keys in local storage')
        return
    }
    opts.position = position
    window.localStorage.removeItem(name)
    const url = window.URL.createObjectURL(
        new Blob([JSON.stringify(opts)], {
            type: "text/plain;charset=utf-8"
        }),
    );
    let tmpLink = document.createElement('a')
    tmpLink.href = url
    tmpLink.setAttribute('download', name)
    tmpLink.click()
}