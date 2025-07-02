import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AuthButton } from '../Auth/AuthButton';
import './IconNav.css';

// Icon components (using emoji for now, can be replaced with proper icons)
const TipIcon = () => <span className="nav-icon">💰</span>;
const BountyIcon = () => <span className="nav-icon">🎯</span>;
const ReputationIcon = () => <span className="nav-icon">🏆</span>;
const EventIcon = () => <span className="nav-icon">🎭</span>;
const MenuIcon = () => <span className="nav-icon">☰</span>;
const CloseIcon = () => <span className="nav-icon">✕</span>;

interface NavItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
  description?: string;
}

const navItems: NavItem[] = [
  { 
    id: 'tip', 
    label: 'Live Tipping', 
    shortLabel: 'Tip',
    icon: <TipIcon />, 
    path: '/tip',
    description: 'Send cross-chain tips to speakers'
  },
  { 
    id: 'bounties', 
    label: 'Bounty Marketplace', 
    shortLabel: 'Bounties',
    icon: <BountyIcon />, 
    path: '/bounties',
    description: 'Earn rewards for content creation'
  },
  { 
    id: 'reputation', 
    label: 'Reputation Dashboard', 
    shortLabel: 'Reputation',
    icon: <ReputationIcon />, 
    path: '/reputation',
    description: 'Track your onchain reputation'
  },
  { 
    id: 'events', 
    label: 'Events & Talent', 
    shortLabel: 'Events',
    icon: <EventIcon />, 
    path: '/talent',
    description: 'Discover events and speakers'
  }
];

export const IconNav: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="icon-nav">
      <div className="nav-container">
        {/* Logo */}
        <Link to="/" className="nav-logo" onClick={closeMobileMenu}>
          <div className="logo-content">
            <span className="logo-icon">🎭</span>
            <div className="logo-text">
              <span className="logo-mega">MEGA</span>
              <span className="logo-vibe">VIBE</span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="nav-links desktop-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={`nav-link ${isActiveRoute(item.path) ? 'active' : ''}`}
              title={item.description}
            >
              {item.icon}
              <span className="nav-label">{item.shortLabel}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </NavLink>
          ))}
        </div>

        {/* Auth Button */}
        <div className="nav-auth">
          <AuthButton variant="primary" showReputation={true} />
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-nav-overlay" onClick={closeMobileMenu}>
          <div className="mobile-nav-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-header">
              <h3>Navigation</h3>
              <button onClick={closeMobileMenu} className="close-btn">
                <CloseIcon />
              </button>
            </div>
            
            <div className="mobile-nav-links">
              {navItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={`mobile-nav-link ${isActiveRoute(item.path) ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <div className="mobile-link-content">
                    {item.icon}
                    <div className="mobile-link-text">
                      <span className="mobile-link-label">{item.label}</span>
                      <span className="mobile-link-description">{item.description}</span>
                    </div>
                    {item.badge && <span className="nav-badge">{item.badge}</span>}
                  </div>
                </NavLink>
              ))}
            </div>

            <div className="mobile-nav-footer">
              <AuthButton variant="primary" showReputation={true} />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
