import './polyfills';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import { TipPage } from './components/TipPage';
import { KnowledgeFlywheelPage } from './components/Knowledge/KnowledgeFlywheelPage';
import { BountyMarketplacePage } from './components/Bounty/BountyMarketplacePage';
import { AppProviders } from './components/AppProviders';
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
      <AppProviders>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/tip" element={<TipPage />} />
            <Route path="/infonomy" element={<KnowledgeFlywheelPage />} />
            <Route path="/bounties" element={<BountyMarketplacePage />} />
          </Routes>
        </BrowserRouter>
      </AppProviders>
    </React.StrictMode>
  );
}
