import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/design-system.css';

interface CrossNavigationProps {
  currentPage: string;
  title?: string;
}

const NAV_ITEMS = [
  { path: '/tip', title: 'Live Tipping', icon: '💰', description: 'Tip speakers in real-time' },
  { path: '/infonomy', title: 'Knowledge Economy', icon: '🧠', description: 'See how the flywheel creates value' },
  { path: '/bounties', title: 'Bounty Marketplace', icon: '🎯', description: 'Commission content from speakers' },
  { path: '/talent', title: 'Meet Talent', icon: '🎭', description: 'Explore featured talent profiles' }
];

export const CrossNavigation: React.FC<CrossNavigationProps> = ({ currentPage, title = 'Explore More Features' }) => {
  const navItems = NAV_ITEMS.filter(page => !window.location.pathname.includes(page.path.slice(1)));
  return (
    <section className="cross-navigation">
      <h3 className="heading-2">{title}</h3>
      <div className="nav-grid grid grid-cols-1 grid-cols-2-sm grid-cols-3-md">
        {navItems.map(item => (
          <Link key={item.path} to={item.path} className="nav-card card card-hover">
            <span className="nav-icon" style={{ fontSize: '2rem' }}>{item.icon}</span>
            <h4 className="heading-3">{item.title}</h4>
            <p style={{ color: 'var(--neutral-700)' }}>{item.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};
