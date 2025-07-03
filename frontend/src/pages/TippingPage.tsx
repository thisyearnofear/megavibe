/**
 * TippingPage.tsx
 * 
 * Main page that integrates the tipping functionality into the application.
 * This serves as a demonstration of the service-oriented architecture
 * we've implemented for the MegaVibe platform.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TippingDemo from '../components/tipping/TippingDemo';
import { useTipping } from '../hooks/useTipping';
import { useEvents } from '../hooks/useEvents';
import './TippingPage.css';

const TippingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  // Use our hooks
  const { loadTipHistory, isProcessing: isTippingLoading } = useTipping(true); // Auto-refresh enabled
  const { fetchNearbyEvents, isLoading: isEventsLoading } = useEvents();
  
  useEffect(() => {
    // Initialize data
    const initPage = async () => {
      setIsLoading(true);
      
      try {
        // Load tips history
        await loadTipHistory();
        
        // Fetch nearby events (optional - enhances the demo experience)
        await fetchNearbyEvents(10); // 10km radius
      } catch (error) {
        console.error('Failed to initialize tipping page:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initPage();
  }, [loadTipHistory, fetchNearbyEvents]);
  
  // Render loading state if data is being fetched
  if (isLoading || isTippingLoading) {
    return (
      <div className="tipping-page loading">
        <div className="loading-spinner"></div>
        <p>Loading tipping data...</p>
      </div>
    );
  }
  
  return (
    <div className="tipping-page">
      <header className="page-header">
        <h1>MegaVibe Tipping</h1>
        <div className="header-actions">
          <button 
            className="back-button"
            onClick={() => navigate('/')}
          >
            ← Back to Home
          </button>
        </div>
      </header>
      
      <div className="page-content">
        <div className="content-wrapper">
          <div className="intro-section">
            <h2>Support Your Favorite Speakers</h2>
            <p>
              MegaVibe makes it easy to show appreciation for speakers at blockchain events.
              Send tips directly to speakers using USDC across multiple chains with our
              cross-chain tipping solution.
            </p>
          </div>
          
          {/* Integrate our TippingDemo component */}
          <TippingDemo />
        </div>
      </div>
      
      <footer className="page-footer">
        <div className="footer-content">
          <p>
            MegaVibe Tipping - Powered by MetaMask and Cross-Chain Infrastructure
          </p>
          <p className="disclaimer">
            This is a demonstration of the MegaVibe tipping system. No actual transactions
            are being made during this demo.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TippingPage;