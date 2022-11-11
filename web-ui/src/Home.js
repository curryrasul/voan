import 'regenerator-runtime/runtime'
import React from 'react'
import './global.css'

export default function Home() {
    const [voteID, setVoteID] = React.useState('')

    let changeHandler = (event) => {
        if (/^[0-9]*$/.test(event.target.value)) {
            setVoteID(event.target.value)
        }
    }
    const underform = window.walletConnection.isSignedIn() ?
        <p>Or you can <a className="open-popup text-button" data-window="create-vote-dialog" href="/create">create</a> your own vote</p> :
        <p>Or you can login your near account to create your own vote</p>

    let findButton = voteID === '' ?
        <button disabled>ENTER</button> :
        <a href={"/vote/" + (+voteID)}><button>ENTER</button></a>

    return (
        <>
            <main className="wrapper">
                <div className="content">
                    <p>To view or participate in a vote, you can search for it by its ID:</p>
                    <div className="form">
                        <label data-hover="ID of vote that you want to find">Vote ID</label>
                        <input type="text" placeholder="Vote ID" value={voteID} onChange={changeHandler}></input>
                        {findButton}
                    </div>
                    {underform}
                </div>
            </main>
        </>
    )
}

// function DonePopup(options) {
//     return (
//         <main id="creating-done" class="pop-up-wrapper">
//             <div class="pop-up">
//                 <div class="close-popup" data-window="creating-done">&#10006</div>
//                 <h2>Vote is created</h2>
//                 <div class="form">
//                     <div>Your vote is created with ID <span id="created-vote-id"></span>.</div>
//                     {/* <div id="created-vote-link">Link to your vote:<br></br><a href="{DOMAIN}"></a></div> */}
//                     <div id="created-link-share">
//                         Share:
//                         {/* <a class="tg-link" href=""></a> */}
//                     </div>
//                 </div>
//             </div>
//         </main>
//     )
// }
