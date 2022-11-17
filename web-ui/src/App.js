import './global.css';

import 'regenerator-runtime/runtime'
import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { login, logout } from './utils'
import Home from './Home';
import Create from './Create';
import Vote from './Vote';
import Done from './Done';
import { ToastContainer } from 'react-toastify'

export default function App() {

    return (
        // use React Fragment, <>, to avoid wrapping elements in unnecessary divs
        <BrowserRouter>
            <Header />
            <ToastContainer autoClose={3000} />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<Create />} />
                <Route path="/done" element={<Done />} />
                <Route path="/vote/:id" element={<Vote />} />
                <Route path="*" element={<PageNotFound />} />
            </Routes>
            <Footer />
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
            <button className="button logout" onClick={logout}>LOG OUT</button>
        </div> :
        <button className="button" onClick={login}>LOG IN</button>;
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

function Footer() {
    return (
        <footer>
            <div className="wrapper">
                <div className="icons-license">
                    Loading icons from: <a href="https://loading.io/">loading.io</a>
                </div>
            </div>
        </footer>
    )
}

function PageNotFound() {
    return (
        <main className="wrapper">
            <div className="content">
                <div className="wrong-page">PAGE NOT FOUND :(<br /><a href="/">GO BACK</a></div>
            </div>
        </main>
    )
}