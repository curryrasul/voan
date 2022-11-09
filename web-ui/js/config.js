const RAFFLE_CONTRACT = 'dev-1667755352527-99327939881892'
const DOMAIN = 'http://localhost'

function getConfig(env) {
    switch (env) {
        case 'production':
        case 'mainnet':
            return {
                networkId: 'mainnet',
                nodeUrl: 'https://rpc.mainnet.near.org',
                contractName: RAFFLE_CONTRACT,
                walletUrl: 'https://wallet.near.org',
                helperUrl: 'https://helper.mainnet.near.org',
                explorerUrl: 'https://explorer.mainnet.near.org',
            }
        case 'development':
        case 'testnet':
            return {
                networkId: 'testnet',
                nodeUrl: 'https://rpc.testnet.near.org',
                contractName: RAFFLE_CONTRACT,
                walletUrl: 'https://wallet.testnet.near.org',
                helperUrl: 'https://helper.testnet.near.org',
                explorerUrl: 'https://explorer.testnet.near.org',
            }
        case 'betanet':
            return {
                networkId: 'betanet',
                nodeUrl: 'https://rpc.betanet.near.org',
                contractName: RAFFLE_CONTRACT,
                walletUrl: 'https://wallet.betanet.near.org',
                helperUrl: 'https://helper.betanet.near.org',
                explorerUrl: 'https://explorer.betanet.near.org',
            }
        case 'local':
            return {
                networkId: 'local',
                nodeUrl: 'http://localhost:3030',
                keyPath: `${process.env.HOME}/.near/validator_key.json`,
                walletUrl: 'http://localhost:4000/wallet',
                contractName: RAFFLE_CONTRACT,
            }
        case 'test':
        case 'ci':
            return {
                networkId: 'shared-test',
                nodeUrl: 'https://rpc.ci-testnet.near.org',
                contractName: RAFFLE_CONTRACT,
                masterAccount: 'test.near',
            }
        case 'ci-betanet':
            return {
                networkId: 'shared-test-staging',
                nodeUrl: 'https://rpc.ci-betanet.near.org',
                contractName: RAFFLE_CONTRACT,
                masterAccount: 'test.near',
            }
        default:
            throw Error(`Unconfigured environment '${env}'. Can be configured in src/config.js.`)
    }
}