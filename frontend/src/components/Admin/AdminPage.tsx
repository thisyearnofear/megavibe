import React, { useState, useEffect } from 'react';
import { PageLayout } from '../Layout/PageLayout';
import { SimpleAdminForm } from './SimpleAdminForm';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';
import { useToast } from '../../contexts/ToastContext';
import './AdminPage.css';

interface AdminStats {
  totalSpeakers: number;
  farcasterSpeakers: number;
  curatedSpeakers: number;
  featuredSpeakers: number;
}

export const AdminPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [stats, setStats] = useState<AdminStats>({
    totalSpeakers: 0,
    farcasterSpeakers: 0,
    curatedSpeakers: 0,
    featuredSpeakers: 0
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { showSuccess, showError } = useToast();

  // Simple password auth (MVP only - replace with proper auth later)
  const ADMIN_PASSWORD = 'megavibe2024'; // TODO: Move to env var

  useEffect(() => {
    // Check if already authenticated
    const isAuth = localStorage.getItem('admin_authenticated') === 'true';
    setIsAuthenticated(isAuth);
    
    if (isAuth) {
      loadStats();
    }
  }, [refreshTrigger]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('admin_authenticated', 'true');
      localStorage.setItem('admin_token', 'simple_admin_token'); // MVP token
      showSuccess('Logged In', 'Welcome to MegaVibe Admin');
    } else {
      showError('Invalid Password', 'Please check your admin password');
    }
    setPassword('');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_token');
    showSuccess('Logged Out', 'See you later!');
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.warn('Could not load admin stats:', error);
      // Don't show error to user - stats are nice-to-have
    }
  };

  const handleSpeakerAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (!isAuthenticated) {
    return (
      <PageLayout
        title="🔐 Admin Access"
        subtitle="Enter admin password to manage speakers"
      >
        <div className="admin-login">
          <Card>
            <form onSubmit={handleLogin} className="login-form">
              <h3>Admin Login</h3>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                />
              </div>
              <Button type="submit" variant="primary">
                🔓 Login
              </Button>
            </form>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="🛠️ MegaVibe Admin"
      subtitle="Manage speakers and platform content"
    >
      <div className="admin-page">
        {/* Header */}
        <div className="admin-header">
          <div className="admin-header-content">
            <h2>👋 Welcome, Admin</h2>
            <Button variant="outline" onClick={handleLogout}>
              🚪 Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="admin-stats">
          <Card className="stat-card">
            <div className="stat-content">
              <div className="stat-number">{stats.totalSpeakers}</div>
              <div className="stat-label">Total Speakers</div>
            </div>
            <div className="stat-icon">👥</div>
          </Card>

          <Card className="stat-card">
            <div className="stat-content">
              <div className="stat-number">{stats.farcasterSpeakers}</div>
              <div className="stat-label">Farcaster Profiles</div>
            </div>
            <div className="stat-icon">🟣</div>
          </Card>

          <Card className="stat-card">
            <div className="stat-content">
              <div className="stat-number">{stats.curatedSpeakers}</div>
              <div className="stat-label">Manual Additions</div>
            </div>
            <div className="stat-icon">✋</div>
          </Card>

          <Card className="stat-card">
            <div className="stat-content">
              <div className="stat-number">{stats.featuredSpeakers}</div>
              <div className="stat-label">Featured</div>
            </div>
            <div className="stat-icon">⭐</div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="admin-content">
          <div className="admin-main">
            <SimpleAdminForm onSuccess={handleSpeakerAdded} />
          </div>

          <div className="admin-sidebar">
            <Card>
              <h4>📋 Quick Actions</h4>
              <div className="quick-actions">
                <Button 
                  variant="outline" 
                  onClick={() => window.open('/talent', '_blank')}
                >
                  👀 View Talent Page
                </Button>
                <Button 
                  variant="outline" 
                  onClick={loadStats}
                >
                  🔄 Refresh Stats
                </Button>
              </div>
            </Card>

            <Card className="help-card">
              <h4>💡 Admin Tips</h4>
              <ul className="help-list">
                <li>Add speakers before events to enable tipping</li>
                <li>Mark important speakers as "Featured"</li>
                <li>Verify speakers you personally know</li>
                <li>Use high-quality profile images</li>
                <li>Encourage speakers to join Farcaster</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default AdminPage;
