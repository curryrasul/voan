const nearAPI = require('near-api-js');
const http = require('node:http');
const qs = require('querystring');
const fs = require("fs");
const homedir = require("os").homedir();
const snarkjs = require("snarkjs");


const serverConfig = {
    hostname: '127.0.0.1',
    port: 3000
};


const nearConfig = {
    networkId: "testnet",
    accountId: process.argv[2], // second command line argument is accountId
    keyPath: process.argv[3], // third command line argument is keyPath
};


const getKeyStore = function () {
    const credentials = JSON.parse(fs.readFileSync(homedir + nearConfig.keyPath));
    const myKeyStore = new nearAPI.keyStores.InMemoryKeyStore();
    myKeyStore.setKey(nearConfig.networkId, nearConfig.accountId, nearAPI.KeyPair.fromString(credentials.private_key));
    return myKeyStore;
};


const getNearConnection = async function () {
    const nearConnectionConfig = {
        networkId: nearConfig.networkId,
        keyStore: getKeyStore(), 
        nodeUrl: "https://rpc.testnet.near.org",
        walletUrl: "https://wallet.testnet.near.org",
        helperUrl: "https://helper.testnet.near.org",
        explorerUrl: "https://explorer.testnet.near.org",
    };

    const nearConnection = await nearAPI.connect(nearConnectionConfig);

    return nearConnection;
};


const getContract = async function () {
    const account = await nearConnection.account(nearConfig.accountId);
    const contract = new nearAPI.Contract(
            account, // the account object that is connecting
            nearConfig.accountId,
            {
                viewMethods: [], // view methods do not change state but usually return a value
                changeMethods: [], // change methods modify state
            });
    return contract;
};


const verify = async function () {

};


const requestListener = function (req, res) {
    if (req.method == 'POST') {
        var body = '';
        req.on('data', function (data) {
            body += data;
            // JSON obj 
            const obj = JSON.parse(body);
            

            // Too much POST data, kill the connection!
            if (body.length > 1e6)
                req.connection.destroy();
        });
    }
};


const main = async () => {
    const server = http.createServer(requestListener);
    server.listen(serverConfig.port, serverConfig.hostname, () => {
        console.log(`Relayer is running on http://${serverConfig.hostname}:${serverConfig.port}`);
    });
};

main()

