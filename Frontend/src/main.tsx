// StrictMode enables additional development checks for common React mistakes.
import { StrictMode } from 'react'
// createRoot connects the React component tree to an element in index.html.
import { createRoot } from 'react-dom/client'
// App is the top-level component; index.css loads Tailwind and global styles.
import App from './App'
import './index.css'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

// The ! tells TypeScript that #root definitely exists. It is defined in
// index.html. render then places the App component inside that element.
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AuthProvider>
            <ProtectedRoute>
                <App />
            </ProtectedRoute>
        </AuthProvider>
    </StrictMode>
    )
