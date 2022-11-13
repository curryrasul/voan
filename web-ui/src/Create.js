import 'regenerator-runtime/runtime'
import React, { useEffect, useState } from 'react'
import moment from 'moment'
import './global.css'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { new_voting } from './utils'

export default function Create() {
    let currDate = moment()
    const [proposal, setProposal] = useState('')
    const [signupDeadline, setSignupDeadline] = useState(currDate.add(1, 'h').format('YYYY-MM-DDTHH:mm'))
    const [votingDeadline, setVotingDeadline] = useState(currDate.add(1, 'h').format('YYYY-MM-DDTHH:mm'))
    const [threshold, setThreshold] = useState(0)
    const [memberName, setMemberName] = useState('')
    const [whitelist, setWhitelist] = useState([])
    const [buttonLoading, setButtonLoading] = useState(false)

    useEffect(() => {
        if (threshold === 0 && whitelist.length !== 0) setThreshold(1)
        if (threshold > whitelist.length) {
            setThreshold(whitelist.length)
        }
    }, [threshold, whitelist])

    let handleChange = (event) => {
        switch (event.target.name) {
            case 'proposal':
                setProposal(event.target.value);
                break
            case 'signup-deadline':
                if (moment(event.target.value).isAfter(moment())) {
                    setSignupDeadline(event.target.value);
                    if (moment(votingDeadline).isBefore(moment(event.target.value))) {
                        setVotingDeadline(moment(event.target.value).add(1, 'h').format('YYYY-MM-DDTHH:mm'))
                        toast(`Voting deadline was automaticaly set to 1 hour after sign up`);
                    }
                } else {
                    toast(`Sign-up deadline must be after now!`);
                }
                break
            case 'voting-deadline':
                if (moment(event.target.value).isAfter(moment(signupDeadline))) {
                    setVotingDeadline(event.target.value);
                } else {
                    toast(`Voting deadline must be after sign-up deadline!`);
                }
                break
            case 'threshold':
                if (event.target.value > 0 && event.target.value <= whitelist.length) {
                    setThreshold(+event.target.value);
                } else{
                    toast(`Threshold must be positive number <= whitelist length!`);
                }
                break
            case 'member-name':
                setMemberName(event.target.value.replace(/\s/g, ''));
                break
            default: break;
        }
    }

    let enterHandler = (event) => {
        if (event.key === "Enter") {
            addMember()
        }
    }

    let addMember = () => {
        if (whitelist.length >= 8) {
            toast.error("Whitelist is full!");
            return
        }
        if (whitelist.includes(memberName)){
            toast.error(`${memberName} is already in whitelist!`);
            return
        }
        setWhitelist(previousWhitelist => {
            return [...previousWhitelist, memberName]
        })
        setMemberName('')
    }

    let deleteMember = (event) => {
        setWhitelist(whitelist.filter(item => item !== event.currentTarget.dataset.member))
    }

    let createVote = (event) => {
        setButtonLoading(true)
        if (proposal === ''){
            toast.error(`Proposal must not be empty!`);
            setButtonLoading(false)
            return
        } 
        if (whitelist.length === 0 || whitelist.length > 8){
            toast.error(`Whitelist must contain 1 to 8 members!`);
            setButtonLoading(false)
            return
        }
        if(threshold === 0 || threshold > whitelist.length){
            toast.error(`Threshold must be positive number <= whitelist length!`);
            setButtonLoading(false)
            return
        }
        if(moment(signupDeadline).isBefore(moment())){
            toast.error(`Sign-Up deadline must be in future!`);
            setButtonLoading(false)
            return
        }
        if(moment(votingDeadline).isBefore(moment(signupDeadline))) {
            toast.error(`Voting deadline must be after Sign-up deadline!`);
            setButtonLoading(false)
            return
        }
        let options = {
            proposal: proposal.trim(),
            voters_whitelist: whitelist,
            threshold: threshold,
            signup_deadline: moment(signupDeadline).unix() * 1000000000,
            voting_deadline: moment(votingDeadline).unix() * 1000000000,
        }
        console.log(options)
        new_voting(options).then((res) => {
            window.location.assign(`/done?voteID=${res}&signMeta=${proposal}`)
        })
    }

    const createButton = window.walletConnection.isSignedIn() ?
        <button className={"button dark" + (buttonLoading ? ' loading' : '')} onClick={createVote} disabled={buttonLoading}>Create vote</button> :
        <button className="button dark" disabled>You need to login first</button>
    return (
        <main className="wrapper">
            <div className="create-vote">
                <a className="back-button" href="/">{'◀'}</a>
                <h2>Create your own vote</h2>
                <div className="form">
                    <label data-hover="Proposal of voting">Proposal</label>
                    <textarea name="proposal" type="text" placeholder="Proposal" rows="5" value={proposal} onChange={handleChange}></textarea>
                    <div className="form-line">
                        <label className="col-50" data-hover="Time, until users can sign up on vote">Sign up deadline</label>
                        <label className="col-50" data-hover="Time, until users can vote">Voting deadline</label>
                        <label className="col-25" data-hover="Count of positive votes, needed to end vote">Threshold</label>
                    </div>
                    <div className="form-line">
                        <input className="col-50" name="signup-deadline" type="datetime-local" value={signupDeadline} onChange={handleChange}></input>
                        <input className="col-50" name="voting-deadline" type="datetime-local" value={votingDeadline} onChange={handleChange}></input>
                        <input className="col-25" name="threshold" type="number" value={threshold} onChange={handleChange}></input>
                    </div>
                    <label data-hover="List of users, who can vote">Voters whitelist</label>
                    <Whitelist whitelist={whitelist} deleteFunc={deleteMember}></Whitelist>
                    <div className="form-line">
                        <input name="member-name" type="text" placeholder="Add to whitelist" value={memberName} onChange={handleChange} onKeyUp={enterHandler}></input>
                        <div className="add-member" onClick={addMember}>+</div>
                    </div>
                    {createButton}
                </div>
            </div>
        </main>
    )
}

function Whitelist(props) {
    let content = []
    for (let i = 0; i < props.whitelist.length; i++) {
        content.push(<WhitelistMember key={props.whitelist[i]} name={props.whitelist[i]} deleteFunc={props.deleteFunc}></WhitelistMember>)
    }
    return (
        <div className="whitelist">
            {content}
        </div>
    )
}

function WhitelistMember(props) {
    return (
        <div className="whitelist-member">
            <div className="whitelist-member-name">{props.name}</div>
            <div className="delete-member" data-member={props.name} onClick={props.deleteFunc}>-</div>
        </div>
    )
}