import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import '../../styles/BountyModal.css';

interface BountyModalProps {
  venueId: string;
  currentArtistId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface SongOption {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  isAvailable: boolean;
  popularityScore: number;
}

export const BountyModal: React.FC<BountyModalProps> = ({
  venueId,
  currentArtistId,
  onClose,
  onSuccess,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [songOptions, setSongOptions] = useState<SongOption[]>([]);
  const [selectedSong, setSelectedSong] = useState<SongOption | null>(null);
  const [bountyAmount, setBountyAmount] = useState(10);
  const [customAmount, setCustomAmount] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [deadline, setDeadline] = useState('tonight');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PRESET_BOUNTIES = [5, 10, 20, 50];

  const loadArtistSongs = useCallback(async () => {
    if (!currentArtistId) return;

    try {
      setLoadingSongs(true);
      // This would typically fetch from an API
      // const songs = await api.get(`/artists/${currentArtistId}/songs`);
      // setArtistSongs(songs.data);
    } catch (error) {
      console.error('Error loading artist songs:', error);
    } finally {
      setLoadingSongs(false);
    }
  }, [currentArtistId]);

  useEffect(() => {
    if (currentArtistId) {
      loadArtistSongs();
    }
  }, [currentArtistId, loadArtistSongs]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get('/songs/search', {
        params: {
          q: searchQuery,
          venueId,
          limit: 10,
        },
      });
      setSongOptions(response.data);
    } catch (error) {
      setError('Failed to search songs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountSelect = (amount: number) => {
    setBountyAmount(amount);
    setUseCustom(false);
    setCustomAmount('');
  };

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value);
    setUseCustom(true);
    if (value && !isNaN(Number(value))) {
      setBountyAmount(Number(value));
    }
  };

  const validateBounty = (): boolean => {
    if (!selectedSong) {
      setError('Please select a song');
      return false;
    }

    const amount = useCustom ? Number(customAmount) : bountyAmount;

    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid bounty amount');
      return false;
    }

    if (amount < 5) {
      setError('Minimum bounty is $5');
      return false;
    }

    if (amount > 500) {
      setError('Maximum bounty is $500');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateBounty()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const amount = useCustom ? Number(customAmount) : bountyAmount;

      await api.post('/bounties', {
        songId: selectedSong!.id,
        venueId,
        amount,
        deadline,
        message: message.trim(),
        requestedArtistId: selectedSong!.artistId,
      });

      // Send real-time notification (commented out until implemented)
      // realtimeService would need sendBounty method
      console.log('Bounty sent:', {
        songId: selectedSong!.id,
        amount,
        message: message.trim(),
        venueId,
      });

      onSuccess();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create bounty';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bounty-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Request a Song</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="bounty-description">
          <p>
            Set a bounty to request a specific song. Artists at this venue will
            see your request!
          </p>
        </div>

        <div className="song-search-section">
          <h3>Find a Song</h3>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by song title or artist..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} disabled={isLoading}>
              Search
            </button>
          </div>

          {isLoading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>Searching songs...</p>
            </div>
          )}

          {songOptions.length > 0 && (
            <div className="song-options">
              {songOptions.map(song => (
                <div
                  key={song.id}
                  className={`song-option ${selectedSong?.id === song.id ? 'selected' : ''} ${
                    !song.isAvailable ? 'unavailable' : ''
                  }`}
                  onClick={() => song.isAvailable && setSelectedSong(song)}
                >
                  <div className="song-details">
                    <p className="song-title">{song.title}</p>
                    <p className="song-artist">by {song.artist}</p>
                  </div>
                  {!song.isAvailable && (
                    <span className="unavailable-badge">Not in repertoire</span>
                  )}
                  {song.popularityScore > 0.8 && (
                    <span className="popular-badge">🔥 Popular</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedSong && (
          <div className="selected-song-display">
            <h4>Selected Song:</h4>
            <p>
              {selectedSong.title} - {selectedSong.artist}
            </p>
          </div>
        )}

        <div className="bounty-amount-section">
          <h3>Set Bounty Amount</h3>
          <div className="preset-amounts">
            {PRESET_BOUNTIES.map(amount => (
              <button
                key={amount}
                className={`amount-button ${bountyAmount === amount && !useCustom ? 'selected' : ''}`}
                onClick={() => handleAmountSelect(amount)}
              >
                ${amount}
              </button>
            ))}
          </div>

          <div className="custom-amount">
            <label>Custom Amount</label>
            <div className="input-wrapper">
              <span className="currency">$</span>
              <input
                type="number"
                placeholder="0.00"
                value={customAmount}
                onChange={e => handleCustomAmount(e.target.value)}
                min="5"
                max="500"
                step="5"
              />
            </div>
          </div>
        </div>

        <div className="deadline-section">
          <h3>When do you want to hear it?</h3>
          <div className="deadline-options">
            <label>
              <input
                type="radio"
                value="tonight"
                checked={deadline === 'tonight'}
                onChange={e => setDeadline(e.target.value)}
              />
              Tonight
            </label>
            <label>
              <input
                type="radio"
                value="this_week"
                checked={deadline === 'this_week'}
                onChange={e => setDeadline(e.target.value)}
              />
              This Week
            </label>
            <label>
              <input
                type="radio"
                value="anytime"
                checked={deadline === 'anytime'}
                onChange={e => setDeadline(e.target.value)}
              />
              Anytime
            </label>
          </div>
        </div>

        <div className="message-section">
          <label>Add a message (optional)</label>
          <textarea
            placeholder="It's my birthday! Would love to hear this song 🎂"
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={200}
            rows={3}
          />
          <span className="char-count">{message.length}/200</span>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="modal-footer">
          <div className="bounty-summary">
            <span>Bounty Amount:</span>
            <span className="total-amount">
              $
              {(useCustom ? Number(customAmount) || 0 : bountyAmount).toFixed(
                2
              )}
            </span>
          </div>

          <div className="action-buttons">
            <button
              className="cancel-button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className="submit-button"
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedSong}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Creating Bounty...
                </>
              ) : (
                `Create Bounty $${(useCustom ? Number(customAmount) || 0 : bountyAmount).toFixed(2)}`
              )}
            </button>
          </div>
        </div>

        <div className="bounty-info">
          <p>💡 Artists will be notified of your bounty</p>
          <p>🎵 You'll only be charged if the song is played</p>
        </div>
      </div>
    </div>
  );
};
