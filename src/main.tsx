import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Set dark theme as default
document.documentElement.classList.add('dark')

createRoot(document.getElementById("root")!).render(<App />);
