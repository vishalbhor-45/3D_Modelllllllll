import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Configure KTX2 loader before anything else loads
import './ktx2Setup.js'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
   </StrictMode>
)
