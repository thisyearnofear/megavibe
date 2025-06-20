import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import '../../styles/design-system.css';
import './mobile-nav.css';

export const MobileNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mobile-nav">
      <button 
        className="mobile-nav-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation"
      >
        <span className="hamburger-icon" />
      </button>
      <div className={`mobile-nav-menu${isOpen ? ' open' : ''}`}>
        <NavLink to="/tip" onClick={() => setIsOpen(false)}>
          💰 Live Tipping
        </NavLink>
        <NavLink to="/infonomy" onClick={() => setIsOpen(false)}>
          🧠 Knowledge Economy
        </NavLink>
        <NavLink to="/bounties" onClick={() => setIsOpen(false)}>
          🎯 Bounty Marketplace
        </NavLink>
        <NavLink to="/talent" onClick={() => setIsOpen(false)}>
          🎭 Meet Talent
        </NavLink>
      </div>
    </div>
  );
};
