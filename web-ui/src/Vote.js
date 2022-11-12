import 'regenerator-runtime/runtime'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import { getVoteData, generateRegistrationParams, getTransactionResult, makeAndDownloadKeyFile, sign_up } from './utils'
import './global.css'
import moment from 'moment';
import Placeholder from './Placeholder';
// const hash = require("circomlibjs").mimcsponge.multiHash;

export default function Vote({ match }) {
    const voteStatusDict = ['REGISTRATION', 'VOTING', 'ENDED']
    const voteID = parseInt(useParams().id)

    const [voteData, setVoteData] = useState({})
    const [voteStatus, setVoteStatus] = useState(0)
    const [timeLeft, setTimeLeft] = useState({})
    const [buttonLoading, setButtonLoading] = useState(false)

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const txhash = urlParams.get("transactionHashes")
        if (txhash !== null) {
            getTransactionResult(txhash).then((position) => {
                makeAndDownloadKeyFile(voteID, position)
                window.location.assign(`/vote/${voteID}`)
            })
        }
    }, [voteID])

    useEffect(() => {
        getVoteData(voteID).then((voteData) => {
            setVoteData(voteData)
        }, (error) => {
            setVoteData({ error: error })
            console.log(error)
        })
    }, [voteID])

    useEffect(() => {
        if (!voteData.error) {
            if (moment().isBefore(moment.unix(voteData.signup_deadline / 1000000000)) && voteData.wait_list.length) {
                setVoteStatus(0)
                return
            }
            if (moment().isBefore(moment.unix(voteData.voting_deadline / 1000000000)) && voteData.yes_count < voteData.threshold) {
                setVoteStatus(1)
                return
            }
            setVoteStatus(2)
        }
    }, [voteData])

    useEffect(() => {
        if (voteStatus === 2) {
            setTimeLeft('')
            return
        }

        let add_zeros = (number) => ('0' + number).slice(-2)
        let refresh_date = (date) => {
            let duration = moment.duration(date.diff(moment()))
            setTimeLeft(`${add_zeros(Math.floor(duration.asHours()))}:${add_zeros(duration.minutes())}:${add_zeros(duration.seconds())}`)
        }

        let deadline = voteStatus === 0 ? voteData.signup_deadline : voteData.voting_deadline
        let date = moment.unix(deadline / 1000000000)
        refresh_date(date)
        const interval = setInterval(() => refresh_date(date), 1000)

        return () => clearInterval(interval)
    }, [voteStatus, voteData])

    let register = () => {
        setButtonLoading(true)
        generateRegistrationParams().then((opts) => {
            window.localStorage.setItem(`voanVote${voteID}Keys`, JSON.stringify({ secret: opts.secret, nullifier: opts.nullifier }))
            sign_up(voteID, opts.commitment).then((position) => {
                makeAndDownloadKeyFile(voteID, position)
                setButtonLoading(false)
            })
        })
    }

    let voteCardPhase = voteStatusDict[voteStatus]

    let registerButton = (voteData.wait_list && voteData.wait_list.includes(window.walletConnection.account().accountId)) ?
        <button className={"vote-registration dark" + (buttonLoading ? ' loading' : '')} onClick={register} disabled={buttonLoading}>REGISTER</button> : <></>

    let voteCardSide = voteStatus === 0 ?
        <div className="vote-card-side">
            <div className="vote-card-side-header">Waiting accounts:</div>
            <WaitingList members={voteData.wait_list} />
            {registerButton}
        </div> : <></>

    let content = voteData.error ?
        <WrongVote /> :
        !voteData.proposal ?
            <Placeholder /> :
            <>
                <div className="vote-card">
                    <div className="vote-card-main">
                        <div className="vote-card-header">
                            <h1 className="vote-card-id">Vote #{voteID}</h1>
                            <div className="vote-card-status">
                                <span>{voteCardPhase}</span><br />
                                <span>{timeLeft}</span>
                            </div>
                        </div>
                        <div className="vote-card-proposal">{voteData.proposal}</div>
                        <div className="vote-card-results">
                            <div className={"vote-card-votes"} data-answer="0">
                                <div className="vote-card-icon no"></div>
                                <div className="vote-card-count">{voteData.vote_count - voteData.yes_count}</div>
                            </div>
                            <div className={"vote-card-votes"} data-answer="1">
                                <div className="vote-card-count">{voteData.yes_count}</div>
                                <div className="vote-card-icon yes"></div>
                            </div>
                        </div>
                    </div>
                    {voteCardSide}
                </div>
            </>

    return (
        <main className="wrapper">
            <div className="content">
                {content}
            </div>
        </main>
    )
}

function WaitingList(props) {
    let content = []
    for (let i = 0; i < props.members.length; i++) {
        content.push(<WaitingMember key={props.members[i]} name={props.members[i]} />)
    }
    return (
        <div>
            {content}
        </div>
    )

}

function WaitingMember(props) {
    return (
        <div>{props.name}</div>
    )
}

function WrongVote() {
    return (
        <div className="wrong-vote">THIS VOTE NOT FOUND :(<br /><a href="/">GO BACK</a></div>
    )
}