import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/design-system.css';
import './styles/global.css';

// Force cache refresh
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
  });
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
