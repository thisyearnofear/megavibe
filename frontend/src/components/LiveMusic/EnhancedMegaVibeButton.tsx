import React, { useState, useEffect, useRef } from 'react';
import realtimeService from '../../services/realtimeService';
import { SongChangeEvent } from '../../services/realtimeService';
import { api } from '../../services/api';
import '../../styles/EnhancedMegaVibeButton.css';

interface EnhancedMegaVibeButtonProps {
  venueId: string;
  onSongIdentified?: (song: SongChangeEvent) => void;
  className?: string;
}

export const EnhancedMegaVibeButton: React.FC<EnhancedMegaVibeButtonProps> = ({
  venueId,
  onSongIdentified,
  className = '',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [currentSong, setCurrentSong] = useState<SongChangeEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isMorphed, setIsMorphed] = useState(false);
  const [showWaveform, setShowWaveform] = useState(false);

  const pulseInterval = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const waveformRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Waveform animation using design system colors
  useEffect(() => {
    if (showWaveform && waveformRef.current) {
      const canvas = waveformRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const animate = () => {
        const width = canvas.width;
        const height = canvas.height;
        const barCount = 20;
        const barWidth = width / barCount;

        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < barCount; i++) {
          const barHeight = Math.random() * height * 0.8 + height * 0.1;
          const x = i * barWidth;
          const y = (height - barHeight) / 2;

          // Use design system accent color
          const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          gradient.addColorStop(0, '#ff6b35');
          gradient.addColorStop(1, '#ff6b3580');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth - 2, barHeight);
        }

        if (isListening) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [showWaveform, isListening]);

  useEffect(() => {
    // Connect to realtime service when component mounts
    realtimeService.connect();
    realtimeService.joinVenue(venueId);

    // Listen for song changes
    const handleSongChange = (data: SongChangeEvent) => {
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

    // Enhanced animation sequence
    setIsSpinning(true);
    setShowWaveform(true);

    setTimeout(() => {
      setIsListening(true);
      setIsPulsing(true);
      setError(null);
    }, 300);

    // Start pulsing animation
    pulseInterval.current = setInterval(() => {
      setIsPulsing(prev => !prev);
    }, 800);

    try {
      // Simulate listening for 4 seconds with enhanced feedback
      await new Promise(resolve => setTimeout(resolve, 4000));

      // First, fetch the current event for the venue
      const eventResponse = await api.get(`/api/venues/${venueId}/current-event`);
      const currentEvent = eventResponse.data;

      if (!currentEvent) {
        setError('No active event at this venue');
        return;
      }

      // Get current song from venue via WebSocket
      const song = await realtimeService.getCurrentSong(venueId);

      if (song) {
        setCurrentSong(song);
        setIsMorphed(true); // Trigger morphing animation

        if (onSongIdentified) {
          onSongIdentified(song);
        }

        // Track the identification
        await api.post('/analytics/song-identified', {
          songId: song.songId,
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
      setIsSpinning(false);
      setShowWaveform(false);

      if (pulseInterval.current) {
        clearInterval(pulseInterval.current);
        pulseInterval.current = null;
      }
    }
  };

  const handleReset = () => {
    setIsMorphed(false);
    setCurrentSong(null);
    setError(null);
  };

  const getButtonText = () => {
    if (isListening) return 'LISTENING';
    if (currentSong && !isMorphed) return 'IDENTIFIED';
    return 'MEGA VIBE';
  };

  const getButtonSubtext = () => {
    if (isListening) return 'Analyzing audio waves...';
    if (error) return error;
    if (currentSong && !isMorphed) {
      return `Found: ${currentSong.title}`;
    }
    return 'Tap to identify the vibe';
  };

  if (isMorphed && currentSong) {
    return (
      <div className={`song-result-card card ${className}`}>
        <div className="card-header">
          <div className="song-artwork">
            <div className="vinyl-record">
              <div className="vinyl-groove"></div>
              <div className="vinyl-center"></div>
            </div>
          </div>
        </div>

        <div className="card-body">
          <div className="song-info">
            <h3 className="font-display text-2xl text-primary">{currentSong.title}</h3>
            <p className="text-lg text-gray-600">{currentSong.artist}</p>

            <div className="song-stats flex gap-lg">
              <div className="stat flex flex-col items-center">
                <div className="stat-icon text-2xl">💰</div>
                <div className="stat-value font-semibold text-accent">0</div>
                <div className="stat-label text-sm text-gray-500">tips</div>
              </div>
              <div className="stat flex flex-col items-center">
                <div className="stat-icon text-2xl">🎵</div>
                <div className="stat-value font-semibold text-success">
                  $0
                </div>
                <div className="stat-label text-sm text-gray-500">earned</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card-footer">
          <div className="action-buttons flex gap-md">
            <button className="btn btn-success flex-1">
              💸 Send Tip
            </button>
            <button className="btn btn-ghost" onClick={handleReset}>
              🔄 New Song
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`megavibe-button-container ${className}`}>
      <div className="button-wrapper">
        <button
          ref={buttonRef}
          className={`megavibe-btn-enhanced ${
            isListening ? 'listening' : ''
          } ${isPulsing ? 'pulsing' : ''} ${isSpinning ? 'spinning' : ''} ${
            currentSong ? 'identified' : ''
          } ${error ? 'error' : ''}`}
          onClick={handleClick}
          disabled={isListening}
        >
          {/* Background layers */}
          <div className="btn-background">
            <div className="gradient-layer"></div>
            <div className="glow-layer"></div>
          </div>

          {/* Content */}
          <div className="btn-content">
            {/* Sound wave animation */}
            {isListening && (
              <div className="sound-wave">
                <div className="sound-wave-bar"></div>
                <div className="sound-wave-bar"></div>
                <div className="sound-wave-bar"></div>
                <div className="sound-wave-bar"></div>
                <div className="sound-wave-bar"></div>
              </div>
            )}

            {/* Button text */}
            <span className="btn-text font-display">{getButtonText()}</span>

            {/* Waveform canvas */}
            {showWaveform && (
              <canvas
                ref={waveformRef}
                className="waveform-canvas"
                width={120}
                height={30}
              />
            )}

            {/* Listening indicator */}
            {isListening && (
              <div className="listening-indicator">
                <div className="pulse-ring"></div>
                <div className="pulse-ring pulse-ring-delay"></div>
              </div>
            )}
          </div>

          {/* Rotating border effect */}
          <div className="btn-border-glow"></div>
        </button>
      </div>

      <p className="button-subtext text-sm text-gray-600 text-center">
        {getButtonSubtext()}
      </p>

      {/* Status indicator */}
      {isListening && (
        <div className="status-indicator status-live">
          <span>Listening to live audio</span>
        </div>
      )}
    </div>
  );
};
