import React from 'react';
import { PageLayout } from '../Layout/PageLayout';
import { PERFORMERS, Performer } from '../../data/performers';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';
import { useTalentFilter } from '../../hooks/useTalentFilter';
import './ArtistsPage.css';
import {
  FaSpotify, FaInstagram, FaTwitter, FaYoutube, FaTiktok, FaGlobe, FaTwitch, FaLinkedin
} from 'react-icons/fa';
import { IconType } from 'react-icons';

const typeLabels: Record<Performer['type'], string> = {
  speaker: '🎤 Speaker',
  musician: '🎸 Musician',
  comedian: '🎭 Comedian',
};

const SOCIAL_ICONS: Record<string, IconType> = {
  spotify: FaSpotify,
  instagram: FaInstagram,
  twitter: FaTwitter,
  youtube: FaYoutube,
  tiktok: FaTiktok,
  website: FaGlobe,
  twitch: FaTwitch,
  linkedin: FaLinkedin,
};

export const ArtistsPage: React.FC = () => {
  const talent = PERFORMERS;
  const {
    filter, setFilter,
    search, setSearch,
    sort, setSort,
    filtered
  } = useTalentFilter(talent);

  return (
    <PageLayout
      title="Talent"
      subtitle="Explore all profiles. Filter, search, and discover talent."
    >
      <div className="artists-content">
        <div className="artists-intro">
          <h2>🎭 Talent Directory</h2>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <Button variant={filter==='all'?'primary':'outline'} onClick={() => setFilter('all')}>All</Button>
            <Button variant={filter==='speaker'?'primary':'outline'} onClick={() => setFilter('speaker')}>Speakers</Button>
            <Button variant={filter==='musician'?'primary':'outline'} onClick={() => setFilter('musician')}>Musicians</Button>
            <Button variant={filter==='comedian'?'primary':'outline'} onClick={() => setFilter('comedian')}>Comedians</Button>
          </div>
          <input
            type="text"
            placeholder="Search by name or genre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', maxWidth: 320, marginBottom: 16 }}
          />
          <div style={{ marginBottom: 12 }}>
            <span style={{ marginRight: 8 }}>Sort by:</span>
            <Button variant={sort==='name'?'primary':'outline'} size="sm" onClick={() => setSort('name')}>Name</Button>
            <Button variant={sort==='reputation'?'primary':'outline'} size="sm" onClick={() => setSort('reputation')}>Reputation</Button>
            <Button variant={sort==='tips'?'primary':'outline'} size="sm" onClick={() => setSort('tips')}>Most Tipped</Button>
          </div>
        </div>
        <div className="talent-grid">
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#888', marginTop: 32 }}>
              No talent found. Try a different search or filter.
            </div>
          ) : (
            filtered.map(p => (
              <Card key={p.id} hoverable className="talent-card">
                {/* LIVE badge at top right of card */}
                {p.isLive && <span className="live-badge card-live-badge">LIVE</span>}
                <div className="talent-avatar">
                  {p.avatar ? <img src={p.avatar} alt={p.name} /> : <span>{p.name[0]}</span>}
                </div>
                <div className="talent-info">
                  <div className="talent-header">
                    <span className="talent-name">{p.name}</span>
                    <span className="talent-type">{typeLabels[p.type]}</span>
                  </div>
                  <div className="talent-bio">{p.bio}</div>
                  <div className="talent-actions">
                    <Button variant="primary" size="sm" className="tip-btn">Tip</Button>
                    <a href={`/talent/${p.id}`} className="profile-btn btn btn-outline btn-sm" style={{ textDecoration: 'none' }}>View Profile</a>
                    {p.socialLinks && (
                      <span className="talent-socials">
                        {Object.entries(p.socialLinks).map(([key, url]) => {
                          if (!url) return null;
                          const Icon = SOCIAL_ICONS[key];
                          return (
                            <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="social-icon-btn" title={key} aria-label={key}>
                              {/* @ts-expect-error: react-icons type issue in monorepo */}
                              {Icon ? <Icon /> : '🔗'}
                            </a>
                          );
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default ArtistsPage;
