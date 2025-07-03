import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import App from './App';
import { TipPage } from './components/TipPage';
import TippingPage from './pages/TippingPage';
import { KnowledgeFlywheelPage } from './components/Knowledge/KnowledgeFlywheelPage';
import { BountyMarketplacePage } from './components/Bounty/BountyMarketplacePage';
import { SubmissionsPage } from './pages/Bounty/SubmissionsPage';
import { TalentPage } from './components/Talent/TalentPage';
import { ReputationDashboard } from './components/Reputation/ReputationDashboard';
import { AdminPage } from './components/Admin/AdminPage';
import { FarcasterTest } from './components/Test/FarcasterTest';
import { AuthDemo } from './components/Auth/AuthDemo';
import { NotFound } from './components/Shared/NotFound';
import { AppProviders } from './components/AppProviders';
// Updated navigation components
import { IconNav } from './components/Navigation/IconNav';
import { OnboardingFlow } from './components/Onboarding/OnboardingFlow';
import { SecurityValidator } from './utils/securityValidation';
import './styles/design-system.css';
import './styles/global.css';

const AppWithNavigation: React.FC = () => {
  const location = useLocation();

  // Run security validation on app start
  useEffect(() => {
    SecurityValidator.runSecurityCheck();
  }, []);

  return (
    <div className="app">
      <IconNav />
      <OnboardingFlow />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/tip" element={<TipPage />} />
        <Route path="/tipping" element={<TippingPage />} />
        <Route path="/infonomy" element={<KnowledgeFlywheelPage />} />
        <Route path="/bounties" element={<BountyMarketplacePage />} />
        <Route path="/bounties/:bountyId/submissions" element={<SubmissionsPage />} />
        <Route path="/reputation" element={<ReputationDashboard />} />
        <Route path="/talent" element={<TalentPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/auth-demo" element={<AuthDemo />} />
        <Route path="/test-farcaster" element={<FarcasterTest />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

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
