import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { SaunaDataProvider } from './contexts/SaunaDataContext'
import './index.css'
import snapshotUrl from './data/saunas-prebuilt.json?url'

const rootEl = document.getElementById('root')

// Keep prerendered content visible while loading the separately cached snapshot.
// JSON data no longer has to be parsed as part of the JavaScript bundle.
async function bootstrap() {
  let initialSaunas
  try {
    const response = await fetch(snapshotUrl, { signal: AbortSignal.timeout(15000) })
    if (!response.ok) throw new Error(`Snapshot HTTP ${response.status}`)
    initialSaunas = await response.json()
    if (!Array.isArray(initialSaunas)) throw new Error('Invalid sauna snapshot')
  } catch (error) {
    console.error('Snapshot unavailable; falling back to live data:', error)
    initialSaunas = null
  }
  rootEl.innerHTML = ''

  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <HelmetProvider>
        <BrowserRouter>
          <AuthProvider>
            <SaunaDataProvider initialSaunas={initialSaunas}>
              <App />
            </SaunaDataProvider>
          </AuthProvider>
        </BrowserRouter>
      </HelmetProvider>
    </React.StrictMode>,
  )

}

bootstrap()
