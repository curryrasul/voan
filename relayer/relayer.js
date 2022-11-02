const nearAPI = require('near-api-js');
const http = require('node:http');
const qs = require('querystring');
const fs = require("fs");
const homedir = require("os").homedir();


const serverConfig = {
    hostname: '127.0.0.1',
    port: 3000
};


const nearConfig = {
    ACCOUNT_ID: process.argv[2], // second command line argument is accountId
    KEY_PATH: process.argv[3],
};


const getKeyStore = function () {
    const credentials = JSON.parse(fs.readFileSync(homedir + nearConfig.KEY_PATH));
    const myKeyStore = new keyStores.InMemoryKeyStore();
    myKeyStore.setKey(nearConnectionConfig.networkId, nearConfig.ACCOUNT_ID, KeyPair.fromString(credentials.private_key));
    return myKeyStore;
};


const getNearConnection = async function () {
    const nearConnectionConfig = {
        networkId: "testnet",
        keyStore: getKeyStore(), // first create a key store 
        nodeUrl: "https://rpc.testnet.near.org",
        walletUrl: "https://wallet.testnet.near.org",
        helperUrl: "https://helper.testnet.near.org",
        explorerUrl: "https://explorer.testnet.near.org",
    };

    const nearConnection = await nearAPI.connect(nearConnectionConfig);

    return nearConnection;
};


const requestListener = function (req, res) {
    if (req.method == 'POST') {
        var body = '';

        req.on('data', function (data) {
            body += data;
            
            console.log(body)

            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (body.length > 1e6)
                req.connection.destroy();
        });

        req.on('end', function () {
            var post = qs.parse(body);
            // use post['blah'], etc.
        });
    }
};


const main = async () => {

    const nearConnection = await getNearConnection()



    // const server = http.createServer(requestListener);
    // server.listen(serverConfig.port, serverConfig.hostname, () => {
    //     console.log(`Relayer is running on http://${serverConfig.hostname}:${serverConfig.port}`);
    // });
}   

main()

