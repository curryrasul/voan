import 'regenerator-runtime/runtime'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import { getVoteData, generateRegistrationParams, getTransactionResult, makeAndDownloadKeyFile, sendVoteToRelayer, sign_up } from './utils'
import './global.css'
import moment from 'moment';
import Placeholder from './Placeholder';
import { toast } from 'react-toastify'
// const hash = require("circomlibjs").mimcsponge.multiHash;

export default function Vote({ match }) {
    const voteStatusDict = ['REGISTRATION', 'VOTING', 'ENDED']
    const voteID = parseInt(useParams().id)

    const [voteData, setVoteData] = useState({})
    const [voteStatus, setVoteStatus] = useState(0)
    const [timeLeft, setTimeLeft] = useState({})
    const [buttonLoading, setButtonLoading] = useState(false)
    const [answer, setAnswer] = useState('')
    const [file, setFile] = useState({})

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const txhash = urlParams.get("transactionHashes")
        if (txhash !== null) {
            getTransactionResult(txhash).then((key) => {
                makeAndDownloadKeyFile(voteID, key)
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
            if (moment().isBefore(moment.unix(voteData.voting_deadline / 1000000000)) && voteData.yes_count < voteData.threshold && voteData.vote_count < voteData.num_participants) {
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

        let add_zeros = (number) => number < 10 ? '0' + number : number
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
        console.log('register')
        generateRegistrationParams().then((opts) => {
            window.localStorage.setItem(`voanVote${voteID}Keys`, JSON.stringify({ secret: opts.secret, nullifier: opts.nullifier }))
            sign_up(voteID, opts.commitment).then((key) => {
                makeAndDownloadKeyFile(voteID, key)
                setButtonLoading(false)
                window.location.assign(`/vote/${voteID}`)
            })
        })
    }

    let chooseVote = (event) => {
        if (voteStatus === 1) {
            setAnswer(event.currentTarget.dataset.answer)
        }
    }

    let makeVote = () => {
        setButtonLoading(true)
        const reader = new FileReader()
        reader.onload = async (e) => {
            let opts
            try {
                opts = JSON.parse(e.target.result)
            } catch (err) {
                toast.error('Wrong file. Please choose another!')
                setButtonLoading(false)
                return
            }
            console.log(opts)
            if (!opts.hasOwnProperty('key') || !opts.hasOwnProperty('secret') || !opts.hasOwnProperty('nullifier')) {
                toast.error('Wrong file. Please choose another!')
                setButtonLoading(false)
                return
            }
            sendVoteToRelayer(voteID, opts, answer).then((response) => {
                setButtonLoading(false)
                if (response.status === 200) {
                    toast.success('Your vote approved!')
                    setTimeout(() => window.location.reload(), 3000)
                } else {
                    toast.error('Error! ' + response.statusText)
                    console.log(response.statusText)
                    setButtonLoading(false)
                }
            }, (error) => {
                toast.error(error.message + "Try another file.")
                setButtonLoading(false)
            })
        };
        reader.readAsText(file)
    }

    let fileChange = (event) => {
        if (event.target.files.length === 0) {
            return
        }
        setFile(event.target.files[0])
    }


    let voteForm = voteStatus === 1 && answer !== '' ?
        <div className="vote-form">
            <input type='file' id="keyFile" className="file-input" onChange={fileChange}></input>
            <label htmlFor="keyFile" className="file-input-label" data-hover="Select file with your secret, nullifier and key">{file.name ? file.name : 'Click to select KeyFile'}</label>
            <button className={"button vote-make dark" + (buttonLoading ? ' loading' : '')} onClick={makeVote} disabled={!file.name || buttonLoading}>Vote</button>
        </div> :
        <></>

    let voteCardPhase = voteStatusDict[voteStatus]

    let registerButton = (voteData.wait_list && voteData.wait_list.includes(window.walletConnection.account().accountId)) ?
        <button className={"button vote-registration dark" + (buttonLoading ? ' loading' : '')} onClick={register} disabled={buttonLoading}>REGISTER</button> : <></>

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
                            <div className={"vote-card-votes" + (answer === "0" ? ' selected' : '')} data-answer="0" onClick={chooseVote}>
                                <div className="vote-card-icon no">✖</div>
                                <div className="vote-card-count">{voteData.vote_count - voteData.yes_count}</div>
                            </div>
                            <div className={"vote-card-votes" + (answer === "1" ? ' selected' : '')} data-answer="1" onClick={chooseVote}>
                                <div className="vote-card-count">{voteData.yes_count}</div>
                                <div className="vote-card-icon yes">✔</div>
                            </div>
                        </div>
                    </div>
                    {voteCardSide}
                </div>
                {voteForm}
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
        <div className="wrong-page">THIS VOTE NOT FOUND :(<br /><a href="/">GO BACK</a></div>
    )
}