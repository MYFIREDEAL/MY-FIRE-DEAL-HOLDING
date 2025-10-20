import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import MyFireDealApp from './App.jsx'
import { supabase } from './supabaseClient'

console.log('✅ Supabase connecté :', supabase)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MyFireDealApp />
  </React.StrictMode>,
)
