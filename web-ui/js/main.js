const nearConfig = getConfig('testnet')
const { connect, keyStores, WalletConnection, Contract } = nearApi;

async function initContract() {
    const near = await connect(Object.assign({ deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() } }, nearConfig))
    window.walletConnection = new WalletConnection(near)
    window.accountId = window.walletConnection.getAccountId()
    window.voanContract = await new Contract(window.walletConnection.account(), nearConfig.contractName, {
        viewMethods: [],
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

async function createVote(options) {
    const voteID = await window.voanContract.new_voting(options, "300000000000000")
    return voteID
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