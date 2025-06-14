import React, { useState, useRef, useEffect } from 'react';
import {
  audioService,
  AudioRecording,
  AudioSnippet,
} from '../../services/audioService';
import '../../styles/SnippetRecorder.css';

interface SnippetRecorderProps {
  venueId?: string;
  eventId?: string;
  onClose: () => void;
  onSuccess: (snippet: AudioSnippet) => void;
}

export const SnippetRecorder: React.FC<SnippetRecorderProps> = ({
  venueId,
  eventId,
  onClose,
  onSuccess,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recording, setRecording] = useState<AudioRecording | null>(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const MAX_DURATION = 180; // 3 minutes in seconds

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_DURATION) {
            handleStopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  useEffect(() => {
    if (isRecording && !isPaused && canvasRef.current) {
      drawWaveform();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isRecording, isPaused]);

  const handleStartRecording = async () => {
    try {
      setError(null);
      // Request access to microphone
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(streamRef.current);
      const chunks: Blob[] = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecording({
          url,
          blob,
          duration: recordingTime * 1000, // Convert to milliseconds
        });
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Setup audio context for visualization
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 2048;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to start recording'
      );
    }
  };

  const handleStopRecording = async () => {
    try {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      setRecordingTime(0);
    } catch (err) {
      setError('Failed to stop recording');
    }
  };

  const handlePauseResume = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
      } else {
        mediaRecorderRef.current.pause();
      }
      setIsPaused(!isPaused);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < 5) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!recording || !title.trim()) {
      setError('Please add a title for your snippet');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const snippet = await audioService.uploadSnippet(recording, {
        title: title.trim(),
        venueId: venueId || '',
        eventId,
        tags,
      });

      onSuccess(snippet);
    } catch (err) {
      setError('Failed to upload snippet. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDiscard = () => {
    if (recording || isRecording) {
      if (window.confirm('Are you sure you want to discard this recording?')) {
        setRecording(null);
        setIsRecording(false);
        setTitle('');
        setTags([]);
        setRecordingTime(0);
      }
    } else {
      onClose();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyserRef.current.getByteTimeDomainData(dataArray);

    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ff6b35';
    ctx.beginPath();

    const sliceWidth = width * 1.0 / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * height / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();

    if (isRecording && !isPaused) {
      animationRef.current = requestAnimationFrame(drawWaveform);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="snippet-recorder-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Record Audio Snippet</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="recorder-content">
          {!recording ? (
            <div className="recording-section">
              <div className="recording-timer">
                <span className="time">{formatTime(recordingTime)}</span>
                <span className="max-time">/ {formatTime(MAX_DURATION)}</span>
              </div>

              {isRecording && (
                <div className="recording-indicator">
                  <div className="recording-dot"></div>
                  <span>{isPaused ? 'Paused' : 'Recording...'}</span>
                </div>
              )}

              <div className="recording-controls">
                {!isRecording ? (
                  <button
                    className="record-button start"
                    onClick={handleStartRecording}
                  >
                    <div className="record-icon"></div>
                    <span>Start Recording</span>
                  </button>
                ) : (
                  <>
                    <button
                      className="control-button"
                      onClick={handlePauseResume}
                    >
                      {isPaused ? '▶️' : '⏸️'}
                    </button>
                    <button
                      className="record-button stop"
                      onClick={handleStopRecording}
                    >
                      <div className="stop-icon"></div>
                      <span>Stop</span>
                    </button>
                  </>
                )}
              </div>
              {isRecording && (
                <canvas
                  ref={canvasRef}
                  className="waveform-canvas"
                  width={300}
                  height={100}
                />
              )}

              <div className="recording-tips">
                <p>💡 Tips for great snippets:</p>
                <ul>
                  <li>Find a quiet spot or get close to the stage</li>
                  <li>Keep it under 3 minutes</li>
                  <li>Capture the vibe of the moment</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="preview-section">
              <div className="audio-preview">
                <audio controls src={recording.url} className="audio-player" />
                <p className="duration">
                  Duration: {formatTime(Math.floor(recording.duration / 1000))}
                </p>
              </div>

              <div className="snippet-details">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    placeholder="Give your snippet a catchy title..."
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    maxLength={100}
                  />
                  <span className="char-count">{title.length}/100</span>
                </div>

                <div className="form-group">
                  <label>Tags (up to 5)</label>
                  <div className="tags-input">
                    <div className="tags-list">
                      {tags.map((tag, index) => (
                        <span key={index} className="tag">
                          #{tag}
                          <button onClick={() => handleRemoveTag(index)}>
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    {tags.length < 5 && (
                      <div className="tag-input-wrapper">
                        <input
                          type="text"
                          placeholder="Add a tag..."
                          value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          onKeyPress={e => e.key === 'Enter' && handleAddTag()}
                          maxLength={20}
                        />
                        <button onClick={handleAddTag}>Add</button>
                      </div>
                    )}
                  </div>
                </div>

                {venueId && (
                  <div className="venue-tag">📍 Recording at venue</div>
                )}
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="action-buttons">
                <button
                  className="discard-button"
                  onClick={handleDiscard}
                  disabled={isUploading}
                >
                  Discard
                </button>
                <button
                  className="upload-button"
                  onClick={handleUpload}
                  disabled={isUploading || !title.trim()}
                >
                  {isUploading ? (
                    <>
                      <span className="spinner"></span>
                      Uploading...
                    </>
                  ) : (
                    '🚀 Share Snippet'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {error && !recording && <div className="error-banner">{error}</div>}
      </div>
    </div>
  );
};
