import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { EnhancedWalletConnector as WalletConnector } from '../Shared/EnhancedWalletConnector';
import '../../styles/design-system.css';
import './global-nav.css';

interface GlobalNavProps {
  currentPage: 'home' | 'tip' | 'infonomy' | 'bounties' | 'artists';
}

export const GlobalNav: React.FC<GlobalNavProps> = ({ currentPage }) => {
  return (
    <nav className="global-nav">
      <div className="nav-container container">
        <Link to="/" className="nav-logo">
          <h1><span className="mega-white">MEGA</span><span className="brand-accent">VIBE</span></h1>
        </Link>
        <div className="nav-links">
          <NavLink to="/tip" className={({ isActive }) => isActive || currentPage === 'tip' ? 'active' : ''}>
            💰 Live Tipping
          </NavLink>
          <NavLink to="/infonomy" className={({ isActive }) => isActive || currentPage === 'infonomy' ? 'active' : ''}>
            🧠 Knowledge Economy
          </NavLink>
          <NavLink to="/bounties" className={({ isActive }) => isActive || currentPage === 'bounties' ? 'active' : ''}>
            🎯 Bounty Marketplace
          </NavLink>
          <NavLink to="/talent" className={({ isActive }) => isActive || currentPage === 'artists' ? 'active' : ''}>
            🎭 Talent
          </NavLink>
        </div>
        <WalletConnector 
          onConnect={() => {}}
          onDisconnect={() => {}}
        />
      </div>
    </nav>
  );
};
