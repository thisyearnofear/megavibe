import React from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '../Layout/PageLayout';

export const NotFound: React.FC = () => {
  return (
    <PageLayout
      title="Page Not Found"
      subtitle="The page you're looking for doesn't exist.">
      <div style={{ 
        textAlign: 'center', 
        padding: 'var(--space-4xl) var(--space-lg)',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-lg)' }}>
          🎵
        </div>
        <h2 style={{ 
          fontSize: 'var(--font-size-3xl)', 
          marginBottom: 'var(--space-md)',
          color: 'var(--primary)'
        }}>
          Oops! Wrong Beat
        </h2>
        <p style={{ 
          fontSize: 'var(--font-size-lg)', 
          color: 'var(--gray-600)',
          marginBottom: 'var(--space-xl)',
          lineHeight: 'var(--line-height-relaxed)'
        }}>
          Looks like this page got lost in the mix. Let's get you back to the main stage.
        </p>
        
        <div style={{ 
          display: 'flex', 
          gap: 'var(--space-md)', 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link to="/" className="btn btn-primary">
            🏠 Back to Home
          </Link>
          <Link to="/tip" className="btn btn-outline">
            💰 Start Tipping
          </Link>
        </div>
      </div>
    </PageLayout>
  );
};

export default NotFound;
