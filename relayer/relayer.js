const nearAPI = require('near-api-js');
const http = require('node:http');
const fs = require("fs");
const homedir = require("os").homedir();
const snarkjs = require("snarkjs");


const serverConfig = {
    hostname: '127.0.0.1',
    port: 3000
};


const { dirname } = require('path');
const appDir = dirname(__dirname);


const nearConfig = {
    networkId: "testnet",
    accountId: process.argv[2], // first command line argunet is accountId
    contractId: process.argv[3], // second command line argument is contractId
    keyPath: `/.near-credentials/testnet/${process.argv[2]}.json`,
    vKeyPath: appDir + "/circuits/output/verification_key.json" // path to "verification_key.json"
};


const getKeyStore = async function () {
    const credentials = JSON.parse(fs.readFileSync(homedir + nearConfig.keyPath));
    const myKeyStore = new nearAPI.keyStores.InMemoryKeyStore();
    myKeyStore.setKey(nearConfig.networkId, nearConfig.accountId, nearAPI.KeyPair.fromString(credentials.private_key));
    return myKeyStore;

    // const myKeyStore = new nearAPI.keyStores.InMemoryKeyStore();
    // // creates a public / private key pair using the provided private key
    // const keyPair = nearAPI.KeyPair.fromRandom("Ed25519");
    // // adds the keyPair you created to keyStore
    // await myKeyStore.setKey("testnet", nearConfig.accountId, keyPair);
    // return myKeyStore;
};


const getNearConnection = async function () {
    const nearConnectionConfig = {
        networkId: nearConfig.networkId,
        keyStore: await getKeyStore(), 
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
            nearConfig.contractId,
            {
                viewMethods: ["root", "nullifiers", "get_voting_deadline", "how_many_pos", "get_threshold"], // view methods do not change state but usually return a value
                changeMethods: ["vote"], // change methods modify state
            });

    return contract;
};


const vote = async function (id, publicSignals, proof) {
    const contract = await getContract();

    // Merkle Tree root comparison result
    if (await rootVerify(id, publicSignals[1])){
        // snark proof verification result
        if (await proofVerify(publicSignals, proof)){
            // check presence of nullifier
            if (await nullifierVerify(id, publicSignals[0])){
                if (await deadlineVerify(id)){
                    if (await thresholdVerify(id)){
                        const res = await contract.vote(
                            {"id": parseInt(id), "proof": JSON.stringify(proof), "pub_inputs": JSON.stringify(publicSignals)},
                            "300000000000000", // attached GAS (optional)
                        );
                        console.log(res);
                        return res;
                    }else{
                        console.log("Voting Closed");
                        return "Voting Closed";
                    }
                }else{
                    console.log("Voting deadline");
                    return "Voting deadline";
                }
            }else{
                console.log("Already voted");
                return "Already voted";
            }
        }else{
            console.log("Wrong proof"); 
            return "Wrong proof";
        }
    }else{
        console.log("Wrong public input: Root of the Merkle Tree");
        return "Wrong public input: Root of the Merkle Tree";
    }
};


const proofVerify = async function (publicSignals, proof) {
    const vKey = JSON.parse(fs.readFileSync(nearConfig.vKeyPath));
    const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);

    return res;
};


const nullifierVerify = async function (id, nullifier) {
    const contract = await getContract();

    // get nullifier array from s-c
    const nullifiers = await contract.nullifiers({"id": parseInt(id)});
    for (const null_pair of Object.entries(nullifiers)) {
        if (null_pair[1] === nullifier){
            return false;
        }
    }
    return true;
};  


const rootVerify = async function (id, root) {
    const contract = await getContract();

    // get root from s-c
    const response = await contract.root({"id": parseInt(id)});

    return (root === response)
};


const deadlineVerify = async function (id) {
    const contract = await getContract();

    const deadlineResponse = await contract.get_voting_deadline({"id": parseInt(id)});
    const hrTime = process.hrtime();
    
    return (hrTime[0] * 10000000000000 + hrTime[1] < deadlineResponse)
};


const thresholdVerify = async function (id) {
    const contract = await getContract();

    const threshold = await contract.get_threshold({"id": parseInt(id)});
    const pos = await contract.how_many_pos({"id": parseInt(id)});

    return (pos < threshold)
}


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
            const id = obj["id"]
            const publicSignals = obj["public"];
            const proof = obj["proof"][0];

            const res_message = await vote(id, publicSignals, proof);

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