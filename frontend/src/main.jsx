import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { installFetchInterceptor } from './services/fetchInterceptor'

// Instalar interceptor de autenticación Bearer para toda la aplicación
installFetchInterceptor()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
