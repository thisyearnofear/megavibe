import React from 'react';
import '../../styles/design-system.css';

export const DesignTest: React.FC = () => {
  return (
    <div className="container section">
      <div className="text-center mb-2xl">
        <h1 className="font-display text-4xl text-primary mb-lg">
          Design System Test
        </h1>
        <p className="text-lg text-gray-600">Testing vinyl and sound wave animations</p>
      </div>

      {/* Test Vinyl Record */}
      <div className="card mb-xl">
        <div className="card-header">
          <h2 className="font-display text-2xl text-primary">Vinyl Record Test</h2>
        </div>
        <div className="card-body">
          <div className="flex justify-center items-center gap-xl">
            <div className="vinyl-record"></div>
            <div>
              <h3 className="font-display text-xl text-primary mb-sm">Now Playing</h3>
              <p className="text-gray-600">Test Song - Test Artist</p>
            </div>
          </div>
        </div>
      </div>

      {/* Test Sound Wave */}
      <div className="card mb-xl">
        <div className="card-header">
          <h2 className="font-display text-2xl text-primary">Sound Wave Test</h2>
        </div>
        <div className="card-body">
          <div className="flex justify-center items-center gap-xl">
            <div className="sound-wave">
              <div className="sound-wave-bar"></div>
              <div className="sound-wave-bar"></div>
              <div className="sound-wave-bar"></div>
              <div className="sound-wave-bar"></div>
              <div className="sound-wave-bar"></div>
            </div>
            <p className="text-gray-600">Sound waves should be animating</p>
          </div>
        </div>
      </div>

      {/* Test Status Indicator */}
      <div className="card mb-xl">
        <div className="card-header">
          <h2 className="font-display text-2xl text-primary">Status Indicator Test</h2>
        </div>
        <div className="card-body">
          <div className="flex justify-center items-center gap-xl">
            <div className="status-indicator status-live">
              <span>LIVE</span>
            </div>
            <p className="text-gray-600">Should have pulsing dot animation</p>
          </div>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="card mb-xl">
        <div className="card-header">
          <h2 className="font-display text-2xl text-primary">Button Tests</h2>
        </div>
        <div className="card-body">
          <div className="flex flex-wrap justify-center gap-md">
            <button className="btn btn-primary">Primary Button</button>
            <button className="btn btn-secondary">Secondary Button</button>
            <button className="btn btn-success">Success Button</button>
            <button className="btn btn-ghost">Ghost Button</button>
          </div>
        </div>
      </div>

      {/* Test MegaVibe Button Styles */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-display text-2xl text-primary">MegaVibe Button Test</h2>
        </div>
        <div className="card-body">
          <div className="flex justify-center">
            <div className="megavibe-button-container">
              <button className="megavibe-btn-enhanced">
                <div className="btn-content">
                  <span className="btn-text font-display">MEGA VIBE</span>
                </div>
              </button>
              <p className="button-subtext text-sm text-gray-600 text-center">
                Tap to identify the vibe
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Debug Info */}
      <div className="mt-2xl p-lg bg-light rounded-lg">
        <h3 className="font-display text-lg text-primary mb-md">CSS Variables Test</h3>
        <div className="grid grid-cols-2 gap-md text-sm">
          <div>
            <strong>Primary:</strong>
            <span style={{ color: 'var(--primary)' }}>var(--primary)</span>
          </div>
          <div>
            <strong>Secondary:</strong>
            <span style={{ backgroundColor: 'var(--secondary)', padding: '2px 8px', borderRadius: '4px' }}>var(--secondary)</span>
          </div>
          <div>
            <strong>Accent:</strong>
            <span style={{ color: 'var(--accent)' }}>var(--accent)</span>
          </div>
          <div>
            <strong>Success:</strong>
            <span style={{ color: 'var(--success)' }}>var(--success)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
