import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { SaunaDataProvider } from './contexts/SaunaDataContext'
import './index.css'

const rootEl = document.getElementById('root')

// Prerendered HTML is served to crawlers for SEO, but React hydration against
// it trips over react-router v7's location handling. Instead of hydrating, we
// throw away the prerendered DOM and mount fresh. Crawlers still read the
// prerendered HTML (that's the SEO win); real users see a brief flash while
// React rerenders identical content.
rootEl.innerHTML = ''

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <SaunaDataProvider>
            <App />
          </SaunaDataProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)
