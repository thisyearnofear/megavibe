import React, { useState, useEffect, useRef, useCallback } from 'react';
import audioService, { AudioSnippet } from '../../services/audioService';
import { useWebAudioRecording } from '../../hooks/useWebAudioRecording';
import '../../styles/AudioFeed.css';

interface AudioFeedProps {
  filter?: string;
  limit?: number;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  showSaveModal: boolean;
  audioBlob: Blob | null;
  title: string;
  tags: string[];
}

export const AudioFeed: React.FC<AudioFeedProps> = ({ filter = 'all', limit = 20 }) => {
  const [snippets, setSnippets] = useState<AudioSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [playingSnippetId, setPlayingSnippetId] = useState<string | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{ [key: string]: number }>({});
  const [activeFilter, setActiveFilter] = useState(filter);
  const [showRecorder, setShowRecorder] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const positionInterval = useRef<NodeJS.Timeout | null>(null);

  // Recording functionality using VOISSS pattern
  const {
    isRecording,
    isLoading: recordingLoading,
    duration: recordingDuration,
    audioBlob: recordingBlob,
    error: recordingError,
    waveformData,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
  } = useWebAudioRecording();

  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    showSaveModal: false,
    audioBlob: null,
    title: '',
    tags: [],
  });

  const fetchSnippets = useCallback(async () => {
    try {
      setLoading(offset === 0);

      // Check backend health first
      try {
        const healthCheck = await fetch(`${process.env.VITE_API_URL || 'https://megavibe.onrender.com'}/api/health/ping`);
        if (!healthCheck.ok) {
          throw new Error('Backend server is not responding');
        }
        console.log('Backend health check passed');
      } catch (healthError) {
        throw new Error('Cannot connect to backend server. Please make sure the server is running.');
      }

      const response = await audioService.getFeed(limit, offset, activeFilter);

      // Handle empty response gracefully
      if (response && response.snippets) {
        setSnippets(prevSnippets =>
          offset === 0 ? response.snippets : [...prevSnippets, ...response.snippets]
        );
        setTotal(response.total || 0);
        setError(null);
      } else {
        // No snippets available - not an error, just empty
        setSnippets([]);
        setTotal(0);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching audio feed:', err);

      // Only show error if we don't have any snippets yet
      if (offset === 0) {
        setError(`Unable to load audio feed. ${err instanceof Error ? err.message : 'Please check your connection and try again.'}`);
        setSnippets([]);
        setTotal(0);
      } else {
        // For pagination errors, just log and don't crash the UI
        console.warn('Failed to load more snippets');
      }
    } finally {
      setLoading(false);
    }
  }, [limit, offset, activeFilter]);

  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets]);

  useEffect(() => {
    setRecordingState(prev => ({
      ...prev,
      isRecording,
      duration: recordingDuration,
      audioBlob: recordingBlob,
    }));

    if (recordingBlob && !isRecording) {
      setRecordingState(prev => ({ ...prev, showSaveModal: true }));
    }
  }, [isRecording, recordingDuration, recordingBlob]);



  const handleFilterChange = (newFilter: string) => {
    setActiveFilter(newFilter);
    setOffset(0);
    setSnippets([]);
  };

  const handleLoadMore = () => {
    if (snippets.length < total && !loading) {
      setOffset(snippets.length);
    }
  };

  const updatePosition = useCallback(() => {
    audioRefs.current.forEach((audio, snippetId) => {
      if (!audio.paused) {
        setCurrentPosition(prev => ({
          ...prev,
          [snippetId]: audio.currentTime,
        }));
      }
    });
  }, []);

  useEffect(() => {
    if (playingSnippetId) {
      positionInterval.current = setInterval(updatePosition, 100);
    } else {
      if (positionInterval.current) {
        clearInterval(positionInterval.current);
      }
    }

    return () => {
      if (positionInterval.current) {
        clearInterval(positionInterval.current);
      }
    };
  }, [playingSnippetId, updatePosition]);

  const handlePlay = async (snippet: AudioSnippet) => {
    // Stop any currently playing audio
    if (playingSnippetId && playingSnippetId !== snippet._id) {
      const prevAudio = audioRefs.current.get(playingSnippetId);
      if (prevAudio) {
        prevAudio.pause();
        prevAudio.currentTime = 0;
      }
    }

    const audio = audioRefs.current.get(snippet._id);
    if (audio) {
      try {
        await audio.play();
        setPlayingSnippetId(snippet._id);
        // Record play event
        await audioService.playSnippet(snippet._id);
      } catch (error) {
        console.error('Error playing audio:', error);
        setError('Failed to play audio. Please try again.');
      }
    }
  };

  const handlePause = (snippetId: string) => {
    const audio = audioRefs.current.get(snippetId);
    if (audio) {
      audio.pause();
      setPlayingSnippetId(null);
    }
  };

  const handleSeek = (snippetId: string, position: number) => {
    const audio = audioRefs.current.get(snippetId);
    if (audio) {
      audio.currentTime = position;
      setCurrentPosition(prev => ({
        ...prev,
        [snippetId]: position,
      }));
    }
  };

  const handleLike = async (snippetId: string) => {
    try {
      const response = await audioService.likeSnippet(snippetId);
      setSnippets(prevSnippets =>
        prevSnippets.map(snippet =>
          snippet._id === snippetId
            ? { ...snippet, likes: response.likes, hasLiked: true }
            : snippet
        )
      );
    } catch (error) {
      console.error('Error liking snippet:', error);
      setError('Failed to like snippet. Please try again.');
    }
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
      setShowRecorder(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = async () => {
    try {
      await stopRecording();
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const handlePauseResume = () => {
    if (recordingState.isPaused) {
      resumeRecording();
      setRecordingState(prev => ({ ...prev, isPaused: false }));
    } else {
      pauseRecording();
      setRecordingState(prev => ({ ...prev, isPaused: true }));
    }
  };

  const handleCancelRecording = () => {
    cancelRecording();
    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      showSaveModal: false,
      audioBlob: null,
      title: '',
      tags: [],
    });
    setShowRecorder(false);
  };

  const handleSaveRecording = async () => {
    if (!recordingBlob) return;

    try {
      const metadata = {
        title: recordingState.title || `Recording ${new Date().toLocaleDateString()}`,
        venueId: 'default', // You might want to get this from context
        tags: recordingState.tags,
      };

      await audioService.uploadSnippet(
        { blob: recordingBlob, duration: recordingDuration },
        metadata
      );

      // Refresh feed to show new recording
      setOffset(0);
      setSnippets([]);
      await fetchSnippets();

      // Reset recording state
      setRecordingState({
        isRecording: false,
        isPaused: false,
        duration: 0,
        showSaveModal: false,
        audioBlob: null,
        title: '',
        tags: [],
      });
      setShowRecorder(false);
    } catch (error) {
      console.error('Error saving recording:', error);
      setError('Failed to save recording. Please try again.');
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderWaveform = (waveform: number[], isPlaying: boolean, progress: number = 0) => {
    if (!waveform || waveform.length === 0) {
      return <div className="waveform-placeholder">No waveform data</div>;
    }

    return (
      <div className="waveform-container">
        {waveform.map((value, index) => {
          const isActive = index / waveform.length <= progress;
          return (
            <div
              key={index}
              className={`waveform-bar ${isActive ? 'active' : ''} ${isPlaying ? 'playing' : ''}`}
              style={{
                height: `${Math.max(2, value * 40)}px`,
              }}
            />
          );
        })}
      </div>
    );
  };

  const filteredSnippets = snippets.filter(snippet =>
    snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    snippet.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error && snippets.length === 0) {
    return (
      <div className="audio-feed-container">
        <div className="audio-feed-error">
          <div className="error-icon">🎵</div>
          <h3>Welcome to MegaVibe Audio!</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button className="btn-record primary" onClick={handleStartRecording}>
              🎤 Create First Recording
            </button>
            <button className="btn-retry" onClick={() => {
              setError(null);
              setOffset(0);
              fetchSnippets();
            }}>
              Refresh Feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="audio-feed-container">
      {/* Header */}
      <div className="feed-header">
        <div className="header-content">
          <h1 className="feed-title font-display">🎵 Audio Feed</h1>
          <p className="feed-subtitle">Share and discover live performance moments</p>
        </div>
        <div className="header-actions">
          <button
            className="btn-test"
            onClick={async () => {
              try {
                const response = await fetch(`${process.env.VITE_API_URL || 'https://megavibe.onrender.com'}/api/health`);
                const data = await response.json();
                alert(`Backend Status: ${data.status}\nDatabase: ${data.services?.database || 'unknown'}`);
              } catch (err) {
                alert(`Backend Error: ${err instanceof Error ? err.message : 'Connection failed'}`);
              }
            }}
          >
            🔧 Test Backend
          </button>
          <button
            className="btn-test"
            onClick={async () => {
              try {
                const response = await fetch(`${process.env.VITE_API_URL || 'https://megavibe.onrender.com'}/api/audio/create-sample`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                });
                const data = await response.json();
                alert(`Sample Data: ${data.message}`);
                // Refresh the feed
                setOffset(0);
                setSnippets([]);
                fetchSnippets();
              } catch (err) {
                alert(`Sample Data Error: ${err instanceof Error ? err.message : 'Creation failed'}`);
              }
            }}
          >
            🎲 Create Sample Data
          </button>
          <button
            className="btn-record"
            onClick={handleStartRecording}
            disabled={recordingLoading}
          >
            🎤 Record
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="feed-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search recordings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="feed-filters">
          {['all', 'recent', 'popular', 'following'].map((filterOption) => (
            <button
              key={filterOption}
              className={`filter-btn ${activeFilter === filterOption ? 'active' : ''}`}
              onClick={() => handleFilterChange(filterOption)}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Recording Studio */}
      {(showRecorder || isRecording) && (
        <div className="recording-studio">
          <div className="studio-header">
            <h3>🎙️ Recording Studio</h3>
            <button className="btn-close" onClick={handleCancelRecording}>✕</button>
          </div>

          <div className="studio-content">
            <div className="duration-display">
              {formatDuration(recordingDuration / 1000)}
            </div>

            <div className="waveform-section">
              {renderWaveform(waveformData, isRecording)}
            </div>

            <div className="recording-controls">
              {!isRecording && !recordingState.showSaveModal && (
                <button
                  className="record-btn start"
                  onClick={handleStartRecording}
                  disabled={recordingLoading}
                >
                  <span className="btn-icon">🎤</span>
                  Start Recording
                </button>
              )}

              {isRecording && (
                <>
                  <button
                    className="record-btn pause"
                    onClick={handlePauseResume}
                  >
                    <span className="btn-icon">{recordingState.isPaused ? '▶️' : '⏸️'}</span>
                    {recordingState.isPaused ? 'Resume' : 'Pause'}
                  </button>

                  <button
                    className="record-btn stop"
                    onClick={handleStopRecording}
                  >
                    <span className="btn-icon">⏹️</span>
                    Stop
                  </button>

                  <button
                    className="record-btn cancel"
                    onClick={handleCancelRecording}
                  >
                    <span className="btn-icon">❌</span>
                    Cancel
                  </button>
                </>
              )}
            </div>

            {recordingState.showSaveModal && (
              <div className="save-modal">
                <h4>Save Recording</h4>
                <input
                  type="text"
                  placeholder="Recording title..."
                  value={recordingState.title}
                  onChange={(e) => setRecordingState(prev => ({ ...prev, title: e.target.value }))}
                  className="title-input"
                />
                <div className="save-actions">
                  <button className="btn-save" onClick={handleSaveRecording}>
                    💾 Save & Share
                  </button>
                  <button className="btn-cancel" onClick={handleCancelRecording}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {recordingError && (
            <div className="recording-error">
              <p>⚠️ {recordingError}</p>
            </div>
          )}
        </div>
      )}

      {/* Feed Content */}
      {loading && snippets.length === 0 ? (
        <div className="feed-loading">
          <div className="loading-spinner"></div>
          <p>Loading audio snippets...</p>
        </div>
      ) : (
        <>
          {filteredSnippets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎵</div>
              <h3 className="empty-title">No recordings yet</h3>
              <p className="empty-text">
                {searchQuery
                  ? `No recordings found matching "${searchQuery}"`
                  : "Be the first to share a moment! Start by recording some audio."
                }
              </p>
              {!searchQuery && (
                <button className="btn-record primary" onClick={handleStartRecording}>
                  🎤 Start Recording
                </button>
              )}
              {searchQuery && (
                <button
                  className="btn-record primary"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="snippet-grid">
              {filteredSnippets.map((snippet) => {
                const isPlaying = playingSnippetId === snippet._id;
                const position = currentPosition[snippet._id] || 0;
                const progress = snippet.duration > 0 ? position / snippet.duration : 0;

                return (
                  <div
                    key={snippet._id}
                    className={`snippet-card ${isPlaying ? 'playing' : ''}`}
                  >
                    <div className="snippet-header">
                      <div className="user-info">
                        {snippet.user.avatar ? (
                          <img
                            src={snippet.user.avatar}
                            alt={snippet.user.username}
                            className="user-avatar"
                          />
                        ) : (
                          <div className="user-avatar placeholder">
                            {snippet.user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="user-details">
                          <span className="username">{snippet.user.username}</span>
                          <span className="timestamp">{formatDate(snippet.createdAt)}</span>
                        </div>
                      </div>
                      <div className="snippet-menu">
                        <button className="menu-btn">⋯</button>
                      </div>
                    </div>

                    <div className="snippet-content">
                      <h3 className="snippet-title">{snippet.title}</h3>
                      {snippet.artist && (
                        <p className="snippet-artist">by {snippet.artist}</p>
                      )}

                      <div className="audio-player">
                        <audio
                          ref={el => {
                            if (el) {
                              audioRefs.current.set(snippet._id, el);
                            }
                          }}
                          src={snippet.url}
                          onEnded={() => setPlayingSnippetId(null)}
                          onTimeUpdate={() => updatePosition()}
                        />

                        <div className="player-controls">
                          <button
                            className={`play-btn ${isPlaying ? 'playing' : ''}`}
                            onClick={() =>
                              isPlaying
                                ? handlePause(snippet._id)
                                : handlePlay(snippet)
                            }
                          >
                            <span className="play-icon">
                              {isPlaying ? '⏸️' : '▶️'}
                            </span>
                          </button>

                          <div className="progress-section">
                            <div className="progress-bar-container">
                              <div className="progress-bar">
                                <div
                                  className="progress-fill"
                                  style={{ width: `${progress * 100}%` }}
                                />
                              </div>
                              <input
                                type="range"
                                min="0"
                                max={snippet.duration}
                                value={position}
                                onChange={(e) => handleSeek(snippet._id, Number(e.target.value))}
                                className="seek-bar"
                              />
                            </div>
                            <div className="time-display">
                              <span>{formatDuration(position)}</span>
                              <span>/</span>
                              <span>{formatDuration(snippet.duration)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="snippet-footer">
                      <div className="snippet-stats">
                        <span className="stat">
                          <span className="stat-icon">▶️</span>
                          <span className="stat-value">{snippet.plays}</span>
                        </span>
                        <span className="stat">
                          <span className="stat-icon">❤️</span>
                          <span className="stat-value">{snippet.likes}</span>
                        </span>
                        <span className="stat">
                          <span className="stat-icon">🔄</span>
                          <span className="stat-value">{snippet.shares}</span>
                        </span>
                      </div>

                      <div className="snippet-actions">
                        <button
                          className={`action-btn like ${snippet.hasLiked ? 'liked' : ''}`}
                          onClick={() => handleLike(snippet._id)}
                          disabled={snippet.hasLiked}
                        >
                          <span className="action-icon">❤️</span>
                          <span className="action-text">Like</span>
                        </button>
                        <button className="action-btn share">
                          <span className="action-icon">🔄</span>
                          <span className="action-text">Share</span>
                        </button>
                        <button className="action-btn comment">
                          <span className="action-icon">💬</span>
                          <span className="action-text">Comment</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More */}
          {snippets.length < total && !loading && (
            <div className="load-more-section">
              <button className="btn-load-more" onClick={handleLoadMore}>
                Load More
              </button>
            </div>
          )}

          {loading && snippets.length > 0 && (
            <div className="feed-loading">
              <div className="loading-spinner small"></div>
              <p>Loading more...</p>
            </div>
          )}
        </>
      )}

      {/* Error Toast */}
      {error && (
        <div className="error-toast">
          <span className="error-message">{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
    </div>
  );
};
