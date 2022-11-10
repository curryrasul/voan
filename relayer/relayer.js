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
                        await contract.vote(
                            {"id": id, "proof": JSON.stringify(proof), "pub_inputs": JSON.stringify(publicSignals)},
                            "300000000000000", // attached GAS (optional)
                        );
                        const res = "Vote passed!!!"
                        return [res, true];
                    }else{
                        console.log("Voting Closed");
                        return ["Voting Closed", false];
                    }
                }else{
                    console.log("Voting deadline");
                    return ["Voting deadline", false];
                }
            }else{
                console.log("Already voted");
                return ["Already voted", false];
            }
        }else{
            console.log("Wrong proof"); 
            return ["Wrong proof", false];
        }
    }else{
        console.log("Wrong public input: Root of the Merkle Tree");
        return ["Wrong public input: Root of the Merkle Tree", false];
    }
};


const proofVerify = async function (publicSignals, proof) {
    var res = false
    try{
        const vKey = JSON.parse(fs.readFileSync(nearConfig.vKeyPath));
        res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    }catch (err){
        console.log("proofVerify:" + err)
    }
    return res;
};


const nullifierVerify = async function (id, nullifier) {
    const contract = await getContract();

    // get nullifier array from s-c
    const nullifiers = await contract.nullifiers({"id": id});
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
    const response = await contract.root({"id": id});

    return (root === response)
};


const deadlineVerify = async function (id) {
    const contract = await getContract();

    const deadlineResponse = await contract.get_voting_deadline({"id": id});
    const hrTime = process.hrtime();
    
    return (hrTime[0] * 10000000000000 + hrTime[1] < deadlineResponse)
};


const thresholdVerify = async function (id) {
    const contract = await getContract();

    const threshold = await contract.get_threshold({"id": id});
    const pos = await contract.how_many_pos({"id": id});

    return (pos < threshold)
}


const requestListener = function (req, res) {
    res.setHeader("Content-Type", "application/json");
    if (req.method == 'POST') {
        var body = '';
        req.on('data', function (data) {
            body += data;
            
            // Too much POST data, kill the connection!
            if (body.length > 1e6)
                req.connection.destroy();
        });
        req.on('end', async function (){
            // JSON obj 
            try {
                const obj = JSON.parse(body);
                const id = parseInt(obj["id"]);
                if (!Number.isInteger(id)){
                    res.writeHead(400);
                    res.end(`{"message": "Id is not Int"}`);
                    return 0;  
                }
                const publicSignals = obj["public"];
                const proof = obj["proof"][0];

                const [res_message, status_flag] = await vote(id, publicSignals, proof);
                if (status_flag){
                    res.writeHead(200);
                    res.end(`{"message": ` + res_message + `}`);  
                }else{
                    res.writeHead(400);
                    res.end(`{"message": ` + res_message + `}`);  
                }
            } catch (err) {
                console.log("requestListener: " + err);
                res.writeHead(400);
                res.end(`{"message": "Incorrect JSON"}`);   
            } 
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