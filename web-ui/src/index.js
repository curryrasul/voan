import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initContract } from './utils'

//temp solution of issue
//https://github.com/near/near-api-js/issues/757
import { Buffer } from 'buffer'
window.Buffer = Buffer

window.nearInitPromise = initContract()
    .then(() => {
        const root = ReactDOM.createRoot(document.getElementById('root'))
        root.render(<App />)
    })
    .catch(console.error)