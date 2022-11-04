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
    vKeyPath: "/projects/voan/circuits/output/verification_key.json" // path to "verification_key.json"
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
    const nearConnection = await getNearConnection();
    const account = await nearConnection.account(nearConfig.accountId);
    const contract = new nearAPI.Contract(
            account, // the account object that is connecting
            "dev-1667582138320-42736429485907",
            {
                viewMethods: ["root", "nullifiers"], // view methods do not change state but usually return a value
                changeMethods: ["vote"], // change methods modify state
            });

    return contract;
};


const vote = async function (publicSignals, proof) {
    const contract = await getContract();

    const root = await rootVerify(publicSignals[1])
    if (await proofVerify(publicSignals, proof)){
        const res = await contract.vote(
            {"proof": JSON.stringify(proof), "pub_inputs": JSON.stringify(publicSignals)},
            "300000000000000", // attached GAS (optional)
        );
        console.log(res);
    }
};


async function proofVerify(publicSignals, proof) {
    // TO DO check vKeyPath 
    const vKey = JSON.parse(fs.readFileSync(homedir + nearConfig.vKeyPath));
    const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);

    console.log(res);

    if (res === true) {
        console.log("Verification OK");
    } else {
        console.log("Invalid proof");
    }

    return res;
};


const nullifierVerify = async function (nullifier) {
    const contract = await getContract();

    // get nullifier array from s-c
    const response = await contract.nullifiers();
    console.log("nullifier: " + response);
};  


const rootVerify = async function (root) {
    const contract = await getContract();

    // get root from s-c
    const response = await contract.root();
    if (root === response){
        console.log("roots same")
    }else{
        console.log("roots not same")
    }
    return response
};


const requestListener = function (req, res) {
    if (req.method == 'POST') {
        var body = '';
        req.on('data', function (data) {
            body += data;
            // JSON obj 
            const obj = JSON.parse(body);
            var publicSignals = obj["public"]
            const proof = obj["proof"][0]

            vote(publicSignals, proof);

            
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

