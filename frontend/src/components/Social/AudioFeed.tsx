import React, { useState, useEffect, useRef } from 'react';
import audioService, { AudioSnippet } from '../../services/audioService';
import '../../styles/AudioFeed.css';

interface AudioFeedProps {
  filter?: string;
  limit?: number;
}

export const AudioFeed: React.FC<AudioFeedProps> = ({ filter = 'all', limit = 10 }) => {
  const [snippets, setSnippets] = useState<AudioSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [playingSnippetId, setPlayingSnippetId] = useState<string | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    const fetchSnippets = async () => {
      try {
        setLoading(true);
        const response = await audioService.getFeed(limit, offset, filter);
        setSnippets(prevSnippets => [...prevSnippets, ...response.snippets]);
        setTotal(response.total);
        setError(null);
      } catch (err) {
        setError('Failed to load audio feed. Please try again.');
        console.error('Error fetching audio feed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSnippets();
  }, [offset, filter, limit]);

  const handleLoadMore = () => {
    if (snippets.length < total) {
      setOffset(snippets.length);
    }
  };

  const handlePlay = async (snippetId: string) => {
    // Stop any currently playing audio
    if (playingSnippetId && playingSnippetId !== snippetId) {
      const prevAudio = audioRefs.current.get(playingSnippetId);
      if (prevAudio) {
        prevAudio.pause();
        prevAudio.currentTime = 0;
      }
    }

    const audio = audioRefs.current.get(snippetId);
    if (audio) {
      try {
        await audio.play();
        setPlayingSnippetId(snippetId);
        // Record play event
        await audioService.playSnippet(snippetId);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (error && snippets.length === 0) {
    return <div className="audio-feed-error">{error}</div>;
  }

  return (
    <div className="audio-feed-container">
      <h2 className="audio-feed-title font-display">Audio Feed</h2>
      {loading && snippets.length === 0 ? (
        <div className="audio-feed-loading">Loading audio snippets...</div>
      ) : (
        <div className="audio-feed-list">
          {snippets.map(snippet => (
            <div key={snippet._id} className="audio-snippet-card">
              <div className="snippet-header">
                <div className="snippet-user">
                  {snippet.user.avatar ? (
                    <img
                      src={snippet.user.avatar}
                      alt={snippet.user.username}
                      className="snippet-avatar"
                    />
                  ) : (
                    <div className="snippet-avatar-placeholder">
                      {snippet.user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="snippet-user-info">
                    <span className="snippet-username font-medium">{snippet.user.username}</span>
                    <span className="snippet-date text-sm text-gray-500">{formatDate(snippet.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="snippet-body">
                <h3 className="snippet-title font-display">{snippet.title}</h3>
                <p className="snippet-artist text-gray-600">{snippet.artist}</p>
                <audio
                  ref={el => {
                    if (el) {
                      audioRefs.current.set(snippet._id, el);
                    }
                  }}
                  src={snippet.url}
                  onEnded={() => setPlayingSnippetId(null)}
                />
                <div className="audio-controls">
                  <button
                    className={`btn-play ${playingSnippetId === snippet._id ? 'playing' : ''}`}
                    onClick={() =>
                      playingSnippetId === snippet._id
                        ? handlePause(snippet._id)
                        : handlePlay(snippet._id)
                    }
                  >
                    {playingSnippetId === snippet._id ? 'Pause' : 'Play'}
                  </button>
                </div>
              </div>
              <div className="snippet-footer">
                <div className="snippet-stats">
                  <span className="snippet-stat">▶️ {snippet.plays}</span>
                  <span className="snippet-stat">❤️ {snippet.likes}</span>
                  <span className="snippet-stat">🔄 {snippet.shares}</span>
                </div>
                <div className="snippet-actions">
                  <button
                    className={`btn-like ${snippet.hasLiked ? 'liked' : ''}`}
                    onClick={() => handleLike(snippet._id)}
                    disabled={snippet.hasLiked}
                  >
                    Like
                  </button>
                  <button className="btn-share">Share</button>
                </div>
              </div>
            </div>
          ))}
          {loading && <div className="audio-feed-loading">Loading more snippets...</div>}
          {snippets.length < total && !loading && (
            <button className="btn-load-more" onClick={handleLoadMore}>
              Load More
            </button>
          )}
          {snippets.length === 0 && !loading && (
            <div className="audio-feed-empty">No audio snippets found.</div>
          )}
        </div>
      )}
    </div>
  );
};
