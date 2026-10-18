import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { TRPCProvider } from '@/providers/trpc'
import { LanguageProvider } from '@/i18n'

createRoot(document.getElementById('root')!).render(
  <TRPCProvider>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </TRPCProvider>,
)
