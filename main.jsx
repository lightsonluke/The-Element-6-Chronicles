import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Register the service worker only in production so the app can be installed as a
// desktop/mobile app. In dev, a stale SW can cache old JS chunks and break React hooks
// (e.g. "Cannot read properties of null (reading 'useRef')").
if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// In dev, make sure no leftover service worker is serving stale cached assets.
if ('serviceWorker' in navigator && import.meta.env.DEV) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations()
      .then(regs => Promise.all(regs.map(r => r.unregister())))
      .then(() => {
        if ('caches' in window) {
          return caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
        }
      })
      .catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)