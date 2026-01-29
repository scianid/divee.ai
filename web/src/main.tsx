import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'

// Add immediate console log to verify file is loaded
console.log('=== MAIN.TSX IS LOADING ===')

const rootElement = document.getElementById('root')
console.log('Root element found:', !!rootElement)

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>,
  )
  console.log('=== APP RENDERED ===')
} else {
  console.error('ERROR: Root element not found!')
}
