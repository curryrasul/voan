import 'regenerator-runtime/runtime'
import React, { useEffect, useState } from 'react'
import './global.css'

import { DOMAIN } from './config'
import { getTransactionResult } from './utils'
import Placeholder from './Placeholder'

export default function Done() {
    const [voteID, setVoteID] = useState(-1)
    const [proposal, setProposal] = useState('')

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const txhash = urlParams.get("transactionHashes")
        const signMeta = urlParams.get('signMeta')
        const voteIDParam = urlParams.get('voteID')

        if (signMeta !== null) {
            setProposal(signMeta)
        }

        if (txhash !== null) {
            getTransactionResult(txhash).then((result) => {
                setVoteID(result)
            })
        } else if (voteIDParam !== null) {
            setVoteID(voteIDParam)
        } else {
            window.location.assign('/')
        }
    }, [])

    let voteURL = DOMAIN + "/vote/" + voteID
    let tgLink = `https://t.me/share/url?url=${voteURL}&text=Vote ${voteID}: ${proposal}`

    let content = voteID === -1 ?
        <Placeholder /> :
        <div className="creating-done">
            <a className="back-button" href="/">❮ Back</a>
            <h2>Vote is created</h2>
            <div className="form">
                <div>Your vote is created with ID #{voteID}.</div>
                <div className="created-vote-link">Link to your vote:<br /><a href={"/vote/" + voteID}>{voteURL}</a></div>
                <div className="created-link-share">
                    Share:
                    <a className="tg-link" href={tgLink}>.</a>
                </div>
            </div>
        </div>

    return (
        <main className="wrapper">
            <div className="content">
                {content}
            </div>
        </main>
    )
}