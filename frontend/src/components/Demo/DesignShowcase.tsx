import React, { useState } from 'react';
import '../../styles/design-system.css';

export const DesignShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState('colors');

  return (
    <div className="container section">
      <div className="text-center mb-2xl">
        <h1 className="font-display text-6xl text-primary mb-lg">
          MEGA<span style={{ color: 'var(--accent)' }}>VIBE</span>
        </h1>
        <p className="text-xl text-gray-600">Modern Design System Showcase</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center mb-2xl">
        <div className="nav-tabs">
          {['colors', 'typography', 'components', 'buttons'].map((tab) => (
            <button
              key={tab}
              className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Colors Section */}
      {activeTab === 'colors' && (
        <div className="card">
          <div className="card-header">
            <h2 className="font-display text-2xl">Color Palette</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-4 gap-lg mb-xl">
              <div className="flex flex-col items-center gap-sm">
                <div className="w-16 h-16 rounded-lg bg-primary"></div>
                <span className="text-sm font-medium">Primary</span>
                <code className="text-xs text-gray-500">#1a0f0a</code>
              </div>
              <div className="flex flex-col items-center gap-sm">
                <div className="w-16 h-16 rounded-lg bg-secondary"></div>
                <span className="text-sm font-medium">Secondary</span>
                <code className="text-xs text-gray-500">#f5e6d3</code>
              </div>
              <div className="flex flex-col items-center gap-sm">
                <div className="w-16 h-16 rounded-lg bg-accent"></div>
                <span className="text-sm font-medium">Accent</span>
                <code className="text-xs text-gray-500">#ff6b35</code>
              </div>
              <div className="flex flex-col items-center gap-sm">
                <div className="w-16 h-16 rounded-lg bg-success"></div>
                <span className="text-sm font-medium">Success</span>
                <code className="text-xs text-gray-500">#69e05f</code>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-lg">
              <div className="flex flex-col items-center gap-sm">
                <div className="w-16 h-16 rounded-lg" style={{ backgroundColor: 'var(--warning)' }}></div>
                <span className="text-sm font-medium">Warning</span>
                <code className="text-xs text-gray-500">#ffb84d</code>
              </div>
              <div className="flex flex-col items-center gap-sm">
                <div className="w-16 h-16 rounded-lg bg-error"></div>
                <span className="text-sm font-medium">Error</span>
                <code className="text-xs text-gray-500">#ff5757</code>
              </div>
              <div className="flex flex-col items-center gap-sm">
                <div className="w-16 h-16 rounded-lg" style={{ backgroundColor: 'var(--gray-300)' }}></div>
                <span className="text-sm font-medium">Gray 300</span>
                <code className="text-xs text-gray-500">#b8b0a8</code>
              </div>
              <div className="flex flex-col items-center gap-sm">
                <div className="w-16 h-16 rounded-lg" style={{ backgroundColor: 'var(--gray-600)' }}></div>
                <span className="text-sm font-medium">Gray 600</span>
                <code className="text-xs text-gray-500">#5e544f</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Typography Section */}
      {activeTab === 'typography' && (
        <div className="space-y-xl">
          <div className="card">
            <div className="card-header">
              <h2 className="font-display text-2xl">Typography Scale</h2>
            </div>
            <div className="card-body space-y-lg">
              <div>
                <h1 className="font-display text-6xl text-primary">Display Heading</h1>
                <code className="text-sm text-gray-500">font-display text-6xl</code>
              </div>
              <div>
                <h2 className="font-display text-4xl text-primary">Section Heading</h2>
                <code className="text-sm text-gray-500">font-display text-4xl</code>
              </div>
              <div>
                <h3 className="font-display text-2xl text-primary">Card Heading</h3>
                <code className="text-sm text-gray-500">font-display text-2xl</code>
              </div>
              <div>
                <p className="text-xl text-gray-600">Large body text for important content and subtitles</p>
                <code className="text-sm text-gray-500">text-xl</code>
              </div>
              <div>
                <p className="text-base text-gray-700">Regular body text for most content and descriptions</p>
                <code className="text-sm text-gray-500">text-base</code>
              </div>
              <div>
                <p className="text-sm text-gray-600">Small text for captions and secondary information</p>
                <code className="text-sm text-gray-500">text-sm</code>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="font-display text-xl">Font Families</h3>
            </div>
            <div className="card-body space-y-md">
              <div>
                <p className="text-lg" style={{ fontFamily: 'var(--font-primary)' }}>
                  WorkSans - Primary font for body text and UI elements
                </p>
                <code className="text-sm text-gray-500">font-family: var(--font-primary)</code>
              </div>
              <div>
                <p className="font-display text-lg">
                  ANTON - DISPLAY FONT FOR HEADINGS AND BRANDING
                </p>
                <code className="text-sm text-gray-500">font-family: var(--font-display)</code>
              </div>
              <div>
                <p className="font-mono text-lg">
                  Monospace - For code and technical content
                </p>
                <code className="text-sm text-gray-500">font-family: var(--font-mono)</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Components Section */}
      {activeTab === 'components' && (
        <div className="space-y-xl">
          <div className="card">
            <div className="card-header">
              <h3 className="font-display text-xl">Cards</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 gap-lg">
                <div className="card">
                  <div className="card-header">
                    <h4 className="font-display text-lg">Basic Card</h4>
                  </div>
                  <div className="card-body">
                    <p className="text-gray-600">This is a basic card with header and body content.</p>
                  </div>
                </div>
                <div className="card">
                  <div className="card-header">
                    <h4 className="font-display text-lg">Card with Footer</h4>
                  </div>
                  <div className="card-body">
                    <p className="text-gray-600">This card includes a footer section.</p>
                  </div>
                  <div className="card-footer">
                    <button className="btn btn-primary btn-sm">Action</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="font-display text-xl">Music Components</h3>
            </div>
            <div className="card-body">
              <div className="flex items-center justify-center gap-xl">
                <div className="vinyl-record"></div>
                <div className="sound-wave">
                  <div className="sound-wave-bar"></div>
                  <div className="sound-wave-bar"></div>
                  <div className="sound-wave-bar"></div>
                  <div className="sound-wave-bar"></div>
                  <div className="sound-wave-bar"></div>
                </div>
                <div className="status-indicator status-live">
                  <span>LIVE</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="font-display text-xl">Form Elements</h3>
            </div>
            <div className="card-body space-y-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-sm">Text Input</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Enter your text here..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-sm">Select Dropdown</label>
                <select className="input">
                  <option>Choose an option</option>
                  <option>Option 1</option>
                  <option>Option 2</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buttons Section */}
      {activeTab === 'buttons' && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-display text-xl">Button Variants</h3>
          </div>
          <div className="card-body space-y-xl">
            <div>
              <h4 className="font-semibold text-lg mb-lg">Primary Buttons</h4>
              <div className="flex flex-wrap gap-md">
                <button className="btn btn-primary btn-sm">Small</button>
                <button className="btn btn-primary">Regular</button>
                <button className="btn btn-primary btn-lg">Large</button>
                <button className="btn btn-primary btn-xl">Extra Large</button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-lg">Button Variants</h4>
              <div className="flex flex-wrap gap-md">
                <button className="btn btn-primary">Primary</button>
                <button className="btn btn-secondary">Secondary</button>
                <button className="btn btn-success">Success</button>
                <button className="btn btn-ghost">Ghost</button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-lg">Button States</h4>
              <div className="flex flex-wrap gap-md">
                <button className="btn btn-primary">Normal</button>
                <button className="btn btn-primary" disabled>Disabled</button>
                <button className="btn btn-primary">
                  <div className="loading-spinner"></div>
                  Loading
                </button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-lg">Icon Buttons</h4>
              <div className="flex flex-wrap gap-md">
                <button className="btn btn-primary">🎵 Play Music</button>
                <button className="btn btn-success">💰 Send Tip</button>
                <button className="btn btn-secondary">📍 Find Venue</button>
                <button className="btn btn-ghost">🔄 Refresh</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-4xl pt-2xl border-t border-gray-100">
        <p className="text-gray-500">
          MegaVibe Design System v2.0 - Inspired by modern web design
        </p>
      </div>
    </div>
  );
};