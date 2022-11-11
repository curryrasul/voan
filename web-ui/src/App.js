import './global.css';

import 'regenerator-runtime/runtime'
import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { login, logout } from './utils'
import Home from './Home';
import Create from './Create';
import Vote from './Vote';
import Done from './Done';

export default function App() {

    return (
        // use React Fragment, <>, to avoid wrapping elements in unnecessary divs
        <BrowserRouter>
            <Header />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<Create />} />
                <Route path="/done" element={<Done />} />
                <Route path="/vote/:id" element={<Vote />} />
            </Routes>
        </BrowserRouter>
    )


}

function Header() {
    const [AccountId, setAccountId] = useState('')

    useEffect(
        () => {
            window.nearInitPromise.then(() => {
                if (window.walletConnection.isSignedIn()) {
                    setAccountId(window.walletConnection.account().accountId)
                }
            })
        },
        []
    )

    const nearAccount = window.walletConnection.isSignedIn() ?
        <div className="account-info">
            <div>{AccountId}</div>
            <button className="logout" onClick={logout}>LOG OUT</button>
        </div> :
        <button onClick={login}>LOG IN</button>;
    return (
        <header>
            <div className="wrapper">
                <div className="logo"><a href="/">VOAN</a></div>
                <div className="near-account">
                    {nearAccount}
                </div>
            </div>
        </header>
    )
}