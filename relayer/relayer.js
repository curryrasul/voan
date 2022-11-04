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
            "dev-1667590812807-84629299206142",
            {
                viewMethods: ["root", "nullifiers"], // view methods do not change state but usually return a value
                changeMethods: ["vote"], // change methods modify state
            });

    return contract;
};


const vote = async function (publicSignals, proof) {
    const contract = await getContract();

    // Merkle Tree root comparison result
    if (await rootVerify(publicSignals[1])){
        // snark proof verification result
        if (await proofVerify(publicSignals, proof)){
            // check presence of nullifier
            if (await nullifierVerify(publicSignals[0])){
                const res = await contract.vote(
                    {"proof": JSON.stringify(proof), "pub_inputs": JSON.stringify(publicSignals)},
                    "300000000000000", // attached GAS (optional)
                );
                console.log(res);
                return res
            }else{
                console.log("Already voted");
                return "Already voted"
            }
        }else{
            console.log("Wrong proof"); 
            return "Wrong proof"
        }
    }else{
        console.log("Wrong public input: Root of the Merkle Tree");
        return "Wrong public input: Root of the Merkle Tree"
    }
};


const proofVerify = async function (publicSignals, proof) {
    // TO DO check vKeyPath 
    const vKey = JSON.parse(fs.readFileSync(homedir + nearConfig.vKeyPath));
    const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);

    return res;
};


const nullifierVerify = async function (nullifier) {
    const contract = await getContract();

    // get nullifier array from s-c
    const nullifiers = await contract.nullifiers();
    for (const null_pair of Object.entries(nullifiers)) {
        if (null_pair[1] === nullifier){
            return false
        }
    }
    return true
};  


const rootVerify = async function (root) {
    const contract = await getContract();

    // get root from s-c
    const response = await contract.root();
    return (root === response)
};


const requestListener = function (req, res) {
    if (req.method == 'POST') {
        var body = '';
        req.on('data', function (data) {
            body += data;
            
            // Too much POST data, kill the connection!
            if (body.length > 1e6)
                req.connection.destroy();
        });
        req.on('end', async function (data){
            // JSON obj 
            const obj = JSON.parse(body);
            const publicSignals = obj["public"]
            const proof = obj["proof"][0]

            const res_message = await vote(publicSignals, proof);

            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(`{"message": ` + res_message + `}`);     
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

