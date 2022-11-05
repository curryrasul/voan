#! /usr/bin/bash

# ./host.sh [voters_whitelist] sign_up_deadline voting_deadline proposal
# sample: ./host.sh 'gaf.testnet, gafram.testnet, gafitulin.testnet' 11/10/2022 11/20/2022 

# # script dir
CUR_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# make array from given string
IFS=', ' read -r -a array <<< $1
voters_whitelist="\""
for element in "${array[@]}"
do
    voters_whitelist+=$element"\", \""
done
voters_whitelist=${voters_whitelist:0: -3}

sign_up_deadline=`date -d $2 +"%s%N"`
voting_deadline=`date -d $3 +"%s%N"`

# deploy contract in testnet -> returns response with dev_account_id
echo "Start 'near dev-deploy'"
deploy_res=`near dev-deploy contract/output/contract.wasm`
dev_contract_id=$(cat ${CUR_DIR}/neardev/dev-account) 
echo "Deploy done! AccountID: $dev_contract_id"

account_id=`/bin/echo $dev_contract_id | /usr/bin/md5sum | /bin/cut -f1 -d" "`

echo $account_id
near create-account $account_id --masterAccount $dev_contract_id

vKey=`(cat circuits/output/verification_key.json | tr '\r' ' ' |  tr '\n' ' ' | sed "s/[']/\\\'/g" | sed 's/\"/\\\\"/g' | sed 's/ \{3,\}/ /g' | sed 's/   / /g')`
new_res=`near call $dev_contract_id new "{\"vkey\": \"${vKey}\", \"voters_whitelist\": [${voters_whitelist}], \"signup_deadline\": ${sign_up_deadline}, \"voting_deadline\": ${voting_deadline}, \"proposal\": \"$4\"}" --accountId $dev_contract_id --gas 300000000000000`
echo $new_res

# sing_up (for test)
# near call $dev_contract_id sign_up '{"commitment": "10729347525792603772164347963849086559051560690254124440739516385410601008297"}' --accountId gaf.testnet --gas 300000000000000
# near call $dev_contract_id sign_up '{"commitment": "1372612331074684897004232928917419811333903327666705376570682269661965307485"}' --accountId gafram.testnet --gas 300000000000000
# near call $dev_contract_id sign_up '{"commitment": "3839913224381297467301343018794884337001320088646527189230328478687282966276"}' --accountId gafitulin.testnet --gas 300000000000000

# start relayer
node ${CUR_DIR}/relayer/relayer.js $account_id $dev_contract_id

