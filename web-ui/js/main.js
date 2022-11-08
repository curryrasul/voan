const nearConfig = getConfig('testnet')
const { connect, keyStores, WalletConnection, Contract } = nearApi;

async function initContract() {
    const near = await connect(Object.assign({ deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() } }, nearConfig))
    window.walletConnection = new WalletConnection(near)
    window.accountId = window.walletConnection.getAccountId()
    window.voanContract = await new Contract(window.walletConnection.account(), nearConfig.contractName, {
        viewMethods: [],
        changeMethods: [],
    })
}

function logout() {
    window.walletConnection.signOut()
    window.location.replace(window.location.origin + window.location.pathname)
}

function login() {
    window.walletConnection.requestSignIn(nearConfig.contractName)
}

window.nearInitPromise = initContract().then(() => {
    if (window.walletConnection.isSignedIn()) {
        $('#account-name').text(window.walletConnection.account().accountId)
        $('#account-info').show();
    } else {
        $('#login').show();
    }
})

$('#login').on("click", () => {
    login()
})

$('#logout').on("click", () => {
    logout()
})