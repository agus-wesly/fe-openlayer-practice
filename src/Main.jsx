import React from 'react'
import ReactDOM from 'react-dom/client'
import MainPage from './pages/MainPage.jsx'

import './assets/index.css'
import Screenshot from './Screenshot.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 
    <MainPage />
    */}
    <Screenshot />
  </React.StrictMode>,
)
