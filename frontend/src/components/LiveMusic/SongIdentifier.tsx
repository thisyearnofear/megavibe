import React, { useState, useEffect } from 'react';
import { SongChangeEvent } from '../../services/realtimeService';
import { api } from '../../services/api';
import { TippingModal } from './TippingModal';
import { BountyModal } from './BountyModal';
import '../../styles/SongIdentifier.css';

interface Artist {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  genres: string[];
  socialLinks?: {
    instagram?: string;
    spotify?: string;
    twitter?: string;
  };
}

interface Song {
  id: string;
  title: string;
  artist: Artist;
  duration: number;
  coverArt?: string;
  isOriginal: boolean;
  album?: string;
  year?: number;
  lyrics?: string;
  tipCount?: number;
  totalTips?: number;
  artistId?: string;
}

interface SongIdentifierProps {
  currentSong: SongChangeEvent;
  venueId: string;
  onClose: () => void;
}

export const SongIdentifier: React.FC<SongIdentifierProps> = ({
  currentSong,
  venueId,
  onClose,
}) => {
  const [songDetails, setSongDetails] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTipping, setShowTipping] = useState(false);
  const [showBounty, setShowBounty] = useState(false);
  const [reactions, setReactions] = useState({
    love: 0,
    fire: 0,
    clap: 0,
    wow: 0,
  });

  useEffect(() => {
    fetchSongDetails();
  }, [currentSong.songId]);

  const fetchSongDetails = async () => {
    try {
      const response = await api.get(`/songs/${currentSong.songId}`);
      setSongDetails(response.data);
    } catch (error) {
      console.error('Error fetching song details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (type: keyof typeof reactions) => {
    try {
      // Optimistic update
      setReactions(prev => ({
        ...prev,
        [type]: prev[type] + 1,
      }));

      await api.post('/reactions', {
        songId: currentSong.songId,
        type,
        venueId,
      });
    } catch (error) {
      // Revert on error
      setReactions(prev => ({
        ...prev,
        [type]: prev[type] - 1,
      }));
    }
  };

  const handleFollowArtist = async () => {
    if (!songDetails) return;

    try {
      await api.post(`/artists/${songDetails.artist.id}/follow`);
      // Update UI or show success message
    } catch (error) {
      console.error('Error following artist:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="song-identifier-modal">
        <div className="song-identifier-content loading">
          <div className="spinner"></div>
          <p>Loading song details...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="song-identifier-modal">
        <div className="song-identifier-content">
          <button className="close-button" onClick={onClose}>
            ×
          </button>

          <div className="song-header">
            {songDetails?.coverArt && (
              <img
                src={songDetails.coverArt}
                alt={songDetails.title}
                className="cover-art"
              />
            )}

            <div className="song-info">
              <h2 className="song-title">{currentSong.title}</h2>
              <p className="artist-name">{currentSong.artist}</p>

              {songDetails && (
                <div className="song-meta">
                  {songDetails.album && <span>{songDetails.album}</span>}
                  {songDetails.year && <span>{songDetails.year}</span>}
                  <span>{formatDuration(songDetails.duration)}</span>
                  {songDetails.isOriginal && (
                    <span className="original-badge">Original</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="reactions-bar">
            <button
              className="reaction-button"
              onClick={() => handleReaction('love')}
            >
              ❤️ {reactions.love}
            </button>
            <button
              className="reaction-button"
              onClick={() => handleReaction('fire')}
            >
              🔥 {reactions.fire}
            </button>
            <button
              className="reaction-button"
              onClick={() => handleReaction('clap')}
            >
              👏 {reactions.clap}
            </button>
            <button
              className="reaction-button"
              onClick={() => handleReaction('wow')}
            >
              🤩 {reactions.wow}
            </button>
          </div>

          <div className="action-buttons">
            <button
              className="action-button primary"
              onClick={() => setShowTipping(true)}
            >
              💰 Tip Artist
            </button>
            <button
              className="action-button secondary"
              onClick={() => setShowBounty(true)}
            >
              🎯 Set Bounty
            </button>
          </div>

          {songDetails?.artist && (
            <div className="artist-section">
              <h3>About the Artist</h3>
              <div className="artist-card">
                {songDetails.artist.avatar && (
                  <img
                    src={songDetails.artist.avatar}
                    alt={songDetails.artist.name}
                    className="artist-avatar"
                  />
                )}
                <div className="artist-details">
                  <h4>{songDetails.artist.name}</h4>
                  {songDetails.artist.bio && (
                    <p className="artist-bio">{songDetails.artist.bio}</p>
                  )}
                  <div className="artist-genres">
                    {songDetails.artist.genres.map(genre => (
                      <span key={genre} className="genre-tag">
                        {genre}
                      </span>
                    ))}
                  </div>
                  <button
                    className="follow-button"
                    onClick={handleFollowArtist}
                  >
                    Follow Artist
                  </button>
                </div>
              </div>

              {songDetails.artist.socialLinks && (
                <div className="social-links">
                  {songDetails.artist.socialLinks.instagram && (
                    <a
                      href={`https://instagram.com/${songDetails.artist.socialLinks.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Instagram
                    </a>
                  )}
                  {songDetails.artist.socialLinks.spotify && (
                    <a
                      href={songDetails.artist.socialLinks.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Spotify
                    </a>
                  )}
                  {songDetails.artist.socialLinks.twitter && (
                    <a
                      href={`https://twitter.com/${songDetails.artist.socialLinks.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Twitter
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="stats-section">
            <div className="stat-item">
              <span className="stat-value">{songDetails?.tipCount || 0}</span>
              <span className="stat-label">Tips Tonight</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                ${songDetails?.totalTips?.toFixed(2) || '0.00'}
              </span>
              <span className="stat-label">Total Tips</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {Math.floor(
                  (Date.now() - new Date(currentSong.timestamp).getTime()) /
                    1000
                )}
                s
              </span>
              <span className="stat-label">Playing For</span>
            </div>
          </div>
        </div>
      </div>

      {showTipping && songDetails && (
        <TippingModal
          song={{
            id: currentSong.songId,
            title: currentSong.title,
            artistId: songDetails?.artistId || currentSong.artist,
            artistName: currentSong.artist,
          }}
          venueId={venueId}
          onClose={() => setShowTipping(false)}
          onSuccess={() => {
            setShowTipping(false);
            // Refresh stats
          }}
        />
      )}

      {showBounty && songDetails && (
        <BountyModal
          venueId={venueId}
          currentArtistId={songDetails?.artistId || currentSong.artist}
          onClose={() => setShowBounty(false)}
          onSuccess={() => {
            setShowBounty(false);
          }}
        />
      )}
    </>
  );
};
