import './polyfills';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import { TipPage } from './components/TipPage';
import { KnowledgeFlywheelPage } from './components/Knowledge/KnowledgeFlywheelPage';
import { BountyMarketplacePage } from './components/Bounty/BountyMarketplacePage';
import { ArtistsPage as TalentPage } from './components/Artists/ArtistsPage';
import { NotFound } from './components/Shared/NotFound';
import { AppProviders } from './components/AppProviders';
import { GlobalNav } from './components/Navigation/GlobalNav';
import { MobileNav } from './components/Navigation/MobileNav';
import { useLocation } from 'react-router-dom';

// Component to handle navigation with current page detection
const AppWithNavigation: React.FC = () => {
  const location = useLocation();
  
  const getCurrentPage = (): 'home' | 'tip' | 'infonomy' | 'bounties' | 'talent' => {
    const path = location.pathname;
    if (path === '/tip') return 'tip';
    if (path === '/infonomy') return 'infonomy';
    if (path === '/bounties') return 'bounties';
    if (path === '/talent') return 'talent';
    return 'home';
  };

  return (
    <div className="app">
      <GlobalNav currentPage={getCurrentPage()} />
      <MobileNav />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/tip" element={<TipPage />} />
        <Route path="/infonomy" element={<KnowledgeFlywheelPage />} />
        <Route path="/bounties" element={<BountyMarketplacePage />} />
        <Route path="/talent" element={<TalentPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};
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

// Clear any cached modules
if (import.meta.hot) {
  import.meta.hot.accept();
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <AppProviders>
        <BrowserRouter>
          <AppWithNavigation />
        </BrowserRouter>
      </AppProviders>
    </React.StrictMode>
  );
}
