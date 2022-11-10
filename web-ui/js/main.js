const nearConfig = getConfig('testnet')
const { connect, keyStores, WalletConnection, Contract } = nearApi;

async function initContract() {
    const near = await connect(Object.assign({ deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() } }, nearConfig))
    window.walletConnection = new WalletConnection(near)
    window.accountId = window.walletConnection.getAccountId()
    window.voanContract = await new Contract(window.walletConnection.account(), nearConfig.contractName, {
        viewMethods: ['get_proposal', 'get_signup_deadline', 'get_voting_deadline', 'get_cur_list', 'nullifiers', 'how_many_pos', 'get_threshold'],
        changeMethods: ['new_voting'],
    })
}

function logout() {
    window.walletConnection.signOut()
    window.location.replace(window.location.origin + window.location.pathname)
}

function login() {
    window.walletConnection.requestSignIn(nearConfig.contractName)
}

async function new_voting(options) {
    const voteID = await window.voanContract.new_voting(options, "300000000000000")
    return voteID
}

async function get_proposal(id) {
    const proposal = await window.voanContract.get_proposal({ id: id })
    return proposal
}

async function get_signup_deadline(id) {
    const signup_deadline = await window.voanContract.get_signup_deadline({ id: id })
    return signup_deadline
}

async function get_voting_deadline(id) {
    const voting_deadline = await window.voanContract.get_voting_deadline({ id: id })
    return voting_deadline
}

async function get_cur_list(id) {
    const cur_list = await window.voanContract.get_cur_list({ id: id })
    return cur_list
}

async function get_vote_count(id) {
    const nullifiers = await window.voanContract.nullifiers({ id: id })
    return nullifiers.length
}

async function get_yes_count(id) {
    const pos_count = await window.voanContract.how_many_pos({ id: id })
    return pos_count
}

async function get_threshold(id) {
    const threshold = await window.voanContract.get_threshold({ id: id })
    return threshold
}

async function get_vote_data(id) {
    options = {}
    options.proposal = await get_proposal(id)
    options.signup_deadline = await get_signup_deadline(id)
    options.voting_deadline = await get_voting_deadline(id)
    options.curr_list = await get_cur_list(id)
    options.vote_count = await get_vote_count(id)
    options.yes_count = await get_yes_count(id)
    options.threshold = await get_threshold(id)
    return options
}

window.nearInitPromise = initContract().then(() => {
    if (window.walletConnection.isSignedIn()) {
        $('#account-name').text(window.walletConnection.account().accountId)
        $('#account-info').show();
    } else {
        $('#login').show();
    }
})

$('#login').on('click', () => {
    login()
})

$('#logout').on('click', () => {
    logout()
})

function openPopup(id) {
    $(`#${id}`).css('display', 'flex').animate({
        opacity: 1
    }, 200)
}
function closePopup(id) {
    $(`#${id}`).animate({
        opacity: 0
    }, 200, (e) => {
        $(`#${id}`).css('display', 'none')
    })
}

$('.open-popup').on('click', (elem) => {
    openPopup($(elem.target).attr('data-window'))
})
$('.close-popup').on('click', (elem) => {
    closePopup($(elem.target).attr('data-window'))
})