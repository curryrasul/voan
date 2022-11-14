import 'regenerator-runtime/runtime'
import React from 'react'
import './global.css'
import {toast} from 'react-toastify'

export default function Home() {
    const [voteID, setVoteID] = React.useState('')

    let changeHandler = (event) => {
        if (/^[0-9]*$/.test(event.target.value)) {
            setVoteID(event.target.value)
        }
    }

    let goToVote = () => {
        if (voteID === ''){
            toast.error('Enter voteID first')
            return
        }
        let tmpLink = document.createElement('a')
        tmpLink.href = '/vote/' + (+voteID)
        tmpLink.click()
    }

    let enterHandler = (event) => {
        if (event.key === "Enter") {
            goToVote()
        }
    }

    const underform = window.walletConnection.isSignedIn() ?
        <p>Or you can <a className="open-popup text-button" data-window="create-vote-dialog" href="/create">create</a> your own vote</p> :
        <p>Or you can login your near account to create your own vote</p>

    let findButton = <button className="button" onClick={goToVote}>ENTER</button>

    return (
        <>
            <main className="wrapper">
                <div className="content">
                    <p>To view or participate in a vote, you can search for it by its ID:</p>
                    <div className="form">
                        <label data-hover="ID of vote that you want to find">Vote ID</label>
                        <input type="text" placeholder="Vote ID" value={voteID} onChange={changeHandler} onKeyUp={enterHandler}></input>
                        {findButton}
                    </div>
                    {underform}
                </div>
            </main>
        </>
    )
}