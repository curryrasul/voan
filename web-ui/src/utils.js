import { connect, Contract, keyStores, WalletConnection, providers } from 'near-api-js'
import { getConfig } from './config'

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
    const voteID = await window.voanContract.new_voting({callbackUrl: 'http://localhost:3000/done', meta: options.proposal, args: options, gas: 300000000000000})
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

export async function get_vote_data(id) {
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