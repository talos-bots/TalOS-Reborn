import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.scss'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import 'flowbite';
import { ThemeProvider } from '@mui/material';
import { theme } from './theme.ts';
import { HelmetProvider } from 'react-helmet-async';
import { UserProvider } from './components/shared/auth-provider/index.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <ThemeProvider theme={theme}>
        <UserProvider>
          <App />
        </UserProvider>
      </ThemeProvider>
    </HelmetProvider>
  </React.StrictMode>,
)
