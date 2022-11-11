import 'regenerator-runtime/runtime'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import { get_vote_data } from './utils'
import './global.css'
import moment from 'moment';
import Placeholder from './Placeholder';

export default function Vote({ match }) {
    const voteStatusDict = ['REGISTRATION', 'VOTING', 'ENDED']
    const voteID = parseInt(useParams().id)

    const [voteData, setVoteData] = useState({})
    const [voteStatus, setVoteStatus] = useState(0)
    const [timeLeft, setTimeLeft] = useState({})

    useEffect(() => {
        get_vote_data(voteID).then((voteData) => {
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
        let deadline = voteStatus === 0 ? voteData.signup_deadline : voteData.voting_deadline
        let date = moment.unix(deadline / 1000000000)
        const interval = setInterval(() => {
            let duration = moment.duration(date.diff(moment()))
            setTimeLeft(`${add_zeros(Math.floor(duration.asHours()))}:${add_zeros(duration.minutes())}:${add_zeros(duration.seconds())}`)
        }, 1000)

        return () => clearInterval(interval)
    }, [voteStatus, voteData])

    let voteCardPhase = voteStatusDict[voteStatus]

    let registerButton = (voteData.wait_list && voteData.wait_list.includes(window.walletConnection.account().accountId)) ? 
        <button id="vote-registration">REGISTER</button> : <></>

    let voteCardSide = voteStatus === 0 ?
        <div id="vote-card-side">
            <div className="vote-card-side-header">Waiting accounts:</div>
            <WaitingList members={voteData.wait_list}/>
            {registerButton}
        </div> : <></>

    let content = voteData.error ?
        <WrongVote /> :
        !voteData.proposal ?
            <Placeholder /> :
            <div id="vote-card">
                <div className="vote-card-main">
                    <div className="vote-card-header">
                        <h1 id="vote-card-id">Vote #{voteID}</h1>
                        <div className="vote-card-status">
                            <span id="vote-card-phase">{voteCardPhase}</span><br />
                            <span id="vote-card-deadline">{timeLeft}</span>
                        </div>
                    </div>
                    <div id="vote-card-proposal">{voteData.proposal}</div>
                    <div className="vote-card-results">
                        <div className="vote-card-votes" data-answer="no">
                            <div className="vote-card-icon no"></div>
                            <div className="vote-card-count" id="no">{voteData.vote_count - voteData.yes_count}</div>
                        </div>
                        <div className="vote-card-votes" data-answer="yes">
                            <div className="vote-card-count" id="yes">{voteData.yes_count}</div>
                            <div className="vote-card-icon yes"></div>
                        </div>
                    </div>
                </div>
                {voteCardSide}
            </div>

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
        <div id="waiting-list">
            {content}
        </div>
    )

}

function WaitingMember(props) {
    return (
        <div className="waiting-member">{props.name}</div>
    )
}

function WrongVote() {
    return (
        <div id="wrong-vote">THIS VOTE NOT FOUND :(<br /><a href="/">GO BACK</a></div>
    )
}