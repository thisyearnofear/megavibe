import React, { useState, useEffect, useRef } from 'react';
import { realtimeService, CurrentSong } from '../../services/realtimeService';
import { api } from '../../services/api';
import '../../styles/MegaVibeButton.css';

interface MegaVibeButtonProps {
  venueId: string;
  onSongIdentified?: (song: CurrentSong) => void;
  className?: string;
}

export const MegaVibeButton: React.FC<MegaVibeButtonProps> = ({
  venueId,
  onSongIdentified,
  className = '',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [currentSong, setCurrentSong] = useState<CurrentSong | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pulseInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Connect to realtime service when component mounts
    realtimeService.connect(undefined, venueId);
    realtimeService.joinVenue(venueId);

    // Listen for song changes
    const handleSongChange = (data: CurrentSong) => {
      setCurrentSong(data);
    };

    realtimeService.on('song_changed', handleSongChange);

    return () => {
      realtimeService.off('song_changed', handleSongChange);
      realtimeService.leaveVenue(venueId);
      if (pulseInterval.current) {
        clearInterval(pulseInterval.current);
      }
    };
  }, [venueId]);

  const handleClick = async () => {
    if (isListening) return;

    setIsListening(true);
    setIsPulsing(true);
    setError(null);

    // Start pulsing animation
    pulseInterval.current = setInterval(() => {
      setIsPulsing(prev => !prev);
    }, 1000);

    try {
      // Simulate listening for 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Get current song from venue
      const song = await realtimeService.getCurrentSong(venueId);

      if (song) {
        setCurrentSong(song);
        if (onSongIdentified) {
          onSongIdentified(song);
        }

        // Track the identification
        await api.post('/analytics/song-identified', {
          songId: song.id,
          venueId,
          timestamp: new Date(),
        });
      } else {
        setError('No song currently playing');
      }
    } catch (err) {
      setError('Failed to identify song');
      console.error('Song identification error:', err);
    } finally {
      setIsListening(false);
      setIsPulsing(false);
      if (pulseInterval.current) {
        clearInterval(pulseInterval.current);
        pulseInterval.current = null;
      }
    }
  };

  const getButtonText = () => {
    if (isListening) return 'LISTENING...';
    if (currentSong) return 'TAP AGAIN';
    return 'MEGA VIBE';
  };

  const getButtonSubtext = () => {
    if (isListening) return 'Identifying song...';
    if (error) return error;
    if (currentSong) {
      return `${currentSong.title} - ${currentSong.artistName}`;
    }
    return 'Tap to identify current song';
  };

  return (
    <div className={`megavibe-button-container ${className}`}>
      <button
        className={`megavibe-button ${isListening ? 'listening' : ''} ${
          isPulsing ? 'pulsing' : ''
        } ${currentSong ? 'identified' : ''} ${error ? 'error' : ''}`}
        onClick={handleClick}
        disabled={isListening}
      >
        <div className="button-content">
          <div className="wave-animation">
            <div className="wave wave-1"></div>
            <div className="wave wave-2"></div>
            <div className="wave wave-3"></div>
          </div>

          <span className="button-text">{getButtonText()}</span>

          {isListening && (
            <div className="listening-indicator">
              <div className="bar bar-1"></div>
              <div className="bar bar-2"></div>
              <div className="bar bar-3"></div>
              <div className="bar bar-4"></div>
              <div className="bar bar-5"></div>
            </div>
          )}
        </div>
      </button>

      <p className="button-subtext">{getButtonSubtext()}</p>

      {currentSong && !isListening && (
        <div className="song-details">
          <div className="song-stats">
            <span className="stat">💰 {currentSong.tipCount} tips</span>
            <span className="stat">
              ${currentSong.totalTips.toFixed(2)} total
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
