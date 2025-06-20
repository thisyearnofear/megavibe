import React from 'react';
import '../../styles/design-system.css';
import './PageLayout.css';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ title, subtitle, children }) => {
  return (
    <div className="page-layout">
      <main className="page-main container">
        <div className="page-container">
          <header className="page-header">
            <h1 className="page-title heading-1 orange-black-gradient">{title}</h1>
            {subtitle && <p className="page-subtitle heading-2 orange-black-gradient-sub">{subtitle}</p>}
          </header>
          <div className="page-content">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
