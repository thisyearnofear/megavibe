import React, { useState, useRef, useEffect } from 'react';
import { AudioSnippet } from '../../services/audioService';

interface SnippetCardProps {
  snippet: AudioSnippet;
  isPlaying: boolean;
  onPlay: () => void;
  onLike: () => void;
  onShare: () => void;
}

export const SnippetCard: React.FC<SnippetCardProps> = ({
  snippet,
  isPlaying,
  onPlay,
  onLike,
  onShare,
}) => {
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const duration = snippet.duration * 1000;
      const updateInterval = 100;
      let elapsed = 0;

      progressInterval.current = setInterval(() => {
        elapsed += updateInterval;
        const newProgress = Math.min((elapsed / duration) * 100, 100);
        setProgress(newProgress);

        if (newProgress >= 100) {
          setProgress(0);
          if (progressInterval.current) {
            clearInterval(progressInterval.current);
          }
        }
      }, updateInterval);
    } else {
      setProgress(0);
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying, snippet.duration]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Date(date).toLocaleDateString();
  };

  const handleLike = () => {
    setLiked(!liked);
    onLike();
  };

  const handleShare = async () => {
    onShare();
    // Show brief feedback
    const button = document.querySelector(`[data-snippet-id="${snippet._id}"] .share-button`);
    if (button) {
      button.textContent = '✓ Copied!';
      setTimeout(() => {
        button.textContent = '🔗 Share';
      }, 2000);
    }
  };

  const getVenueIcon = () => {
    // For now, return default icon since venue data structure needs to be resolved
    return '🎵';
  };

  return (
    <div
      className="card snippet-card transition hover:shadow-lg group"
      data-snippet-id={snippet._id}
    >
      {/* Header */}
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-md">
            {/* Creator Avatar */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white font-bold">
                {snippet.artist ? snippet.artist.charAt(0).toUpperCase() : 'A'}
              </div>
              {isPlaying && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                  <div className="sound-wave scale-50">
                    <div className="sound-wave-bar"></div>
                    <div className="sound-wave-bar"></div>
                    <div className="sound-wave-bar"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Creator Info */}
            <div className="flex-1">
              <h4 className="font-medium text-primary">
                {snippet.artist}
              </h4>
              <div className="flex items-center gap-sm text-sm text-gray-600">
                <span className="text-lg">{getVenueIcon()}</span>
                <span className="font-medium">Live Performance</span>
                <span>•</span>
                <span>{formatTimeAgo(new Date(snippet.createdAt))}</span>
              </div>
            </div>
          </div>

          {/* Play Button */}
          <button
            className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
              isPlaying
                ? 'bg-accent text-white shadow-glow'
                : 'bg-light text-primary hover:bg-accent hover:text-white'
            }`}
            onClick={onPlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <span className="text-lg">⏸️</span>
            ) : (
              <span className="text-lg ml-1">▶️</span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="card-body">
        {/* Title */}
        <h3 className="font-display text-xl text-primary mb-md group-hover:text-accent transition">
          {snippet.title}
        </h3>

        {/* Tags - placeholder since tags aren't in AudioSnippet interface yet */}
        <div className="flex flex-wrap gap-xs mb-lg">
          <span className="px-sm py-xs bg-light text-gray-600 rounded-full text-xs font-medium hover:bg-accent hover:text-white transition cursor-pointer">
            #live
          </span>
          <span className="px-sm py-xs bg-light text-gray-600 rounded-full text-xs font-medium hover:bg-accent hover:text-white transition cursor-pointer">
            #performance
          </span>
        </div>

        {/* Audio Visualization */}
        <div className="audio-visualization relative bg-light rounded-lg p-md mb-lg overflow-hidden">
          {/* Progress Bar */}
          {isPlaying && (
            <div
              className="absolute top-0 left-0 h-full bg-accent opacity-20 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          )}

          {/* Waveform */}
          <div className="relative flex items-center justify-center gap-1">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className={`waveform-bar transition-all duration-200 ${
                  isPlaying ? 'bg-accent' : 'bg-gray-300'
                } ${isPlaying ? 'animate-pulse' : ''}`}
                style={{
                  width: '3px',
                  height: `${15 + Math.random() * 25}px`,
                  borderRadius: '2px',
                  animationDelay: `${i * 0.05}s`,
                  opacity: isPlaying && progress > (i / 40) * 100 ? 1 : 0.6,
                }}
              />
            ))}

            {/* Duration Overlay */}
            <div className="absolute right-2 bottom-1 text-xs font-mono text-gray-600 bg-white px-xs py-xs rounded">
              {formatDuration(snippet.duration)}
            </div>
          </div>
        </div>

        {/* Artist Feature Tag */}
        {snippet.artist && (
          <div className="flex items-center gap-sm p-md bg-accent bg-opacity-10 rounded-lg mb-lg">
            <span className="text-lg">🎤</span>
            <span className="text-sm font-medium text-accent">
              Artist: {snippet.artist}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="card-footer bg-light">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-lg">
            {/* Like Button */}
            <button
              className={`flex items-center gap-xs transition ${
                liked
                  ? 'text-red-500'
                  : 'text-gray-600 hover:text-red-500'
              }`}
              onClick={handleLike}
            >
              <span className="text-lg">{liked ? '❤️' : '🤍'}</span>
              <span className="font-medium">{snippet.likes + (liked ? 1 : 0)}</span>
            </button>

            {/* Play Count */}
            <div className="flex items-center gap-xs text-gray-600">
              <span className="text-lg">🎧</span>
              <span className="font-medium">{snippet.plays}</span>
            </div>

            {/* Share Button */}
            <button
              className="share-button flex items-center gap-xs text-gray-600 hover:text-accent transition"
              onClick={handleShare}
            >
              <span className="text-lg">🔗</span>
              <span className="font-medium">Share</span>
            </button>
          </div>

          {/* More Actions */}
          <div className="relative">
            <button
              className="p-sm text-gray-600 hover:text-primary transition"
              onClick={() => setShowMoreActions(!showMoreActions)}
            >
              <span className="text-lg">⋯</span>
            </button>

            {showMoreActions && (
              <div className="absolute right-0 bottom-full mb-sm bg-white border border-gray-200 rounded-lg shadow-xl py-sm z-10 min-w-32">
                <button className="w-full px-md py-sm text-left text-sm hover:bg-light transition">
                  🔄 Repost
                </button>
                <button className="w-full px-md py-sm text-left text-sm hover:bg-light transition">
                  💾 Save
                </button>
                <button className="w-full px-md py-sm text-left text-sm hover:bg-light transition text-error">
                  🚫 Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close more actions */}
      {showMoreActions && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowMoreActions(false)}
        />
      )}
    </div>
  );
};
