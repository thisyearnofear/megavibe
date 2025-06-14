import React, { useState, useRef, useCallback } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import audioService from '../../services/audioService';
import '../../styles/AudioUpload.css';

interface AudioUploadProps {
  venueId?: string;
  eventId?: string;
  onUploadSuccess?: (snippet: any) => void;
  onClose?: () => void;
}

export const AudioUpload: React.FC<AudioUploadProps> = ({
  venueId,
  eventId,
  onUploadSuccess,
  onClose,
}) => {
  const { user, isAuthenticated } = useDynamicContext();
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadMode, setUploadMode] = useState<'record' | 'upload'>('record');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm;codecs=opus'
        });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));

        // Stop all tracks to free up microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      setError('Failed to access microphone. Please allow microphone access.');
      console.error('Recording error:', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setDuration(recordingTime);

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  }, [isRecording, recordingTime]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      setError('Please select a valid audio file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setAudioBlob(file);
    setAudioUrl(URL.createObjectURL(file));

    // Get duration using audio element
    const audio = new Audio(URL.createObjectURL(file));
    audio.onloadedmetadata = () => {
      setDuration(Math.floor(audio.duration));
    };

    setError(null);
  }, []);

  const handleUpload = async () => {
    if (!audioBlob || !title.trim()) {
      setError('Please provide a title and audio content');
      return;
    }

    if (!isAuthenticated || !user) {
      setError('Please connect your wallet to upload audio');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Convert blob to file if needed
      const audioFile = audioBlob instanceof File
        ? audioBlob
        : new File([audioBlob], `recording-${Date.now()}.webm`, {
            type: audioBlob.type
          });

      // Upload to backend with user info
      const snippet = await audioService.uploadSnippet(
        audioFile,
        title.trim(),
        user.email || user.userId || 'Anonymous'
      );

      // Success
      if (onUploadSuccess) {
        onUploadSuccess(snippet);
      }

      // Reset form
      resetForm();

    } catch (err) {
      setError('Failed to upload audio. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setTitle('');
    setDescription('');
    setTags('');
    setDuration(0);
    setRecordingTime(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="audio-upload-container">
        <div className="card">
          <div className="card-body text-center py-2xl">
            <div className="text-6xl mb-lg">🎤</div>
            <h3 className="font-display text-2xl text-primary mb-md">
              Connect Your Wallet
            </h3>
            <p className="text-gray-600 mb-xl">
              Connect your wallet with Dynamic.xyz to upload and share audio snippets
            </p>
            <div className="text-sm text-gray-500">
              💾 Files stored on decentralized storage<br/>
              🔐 Secured by your wallet identity
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="audio-upload-container">
      <div className="card audio-upload-card">
        {/* Header */}
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-primary">Upload Audio Snippet</h2>
            {onClose && (
              <button
                className="btn btn-ghost p-sm rounded-full"
                onClick={onClose}
                aria-label="Close"
              >
                ✕
              </button>
            )}
          </div>
          <div className="text-sm text-gray-600 mt-sm">
            Connected as: {user?.email || user?.userId || 'Anonymous'}
          </div>
        </div>

        <div className="card-body">
          {/* Upload Mode Toggle */}
          <div className="mode-toggle mb-xl">
            <div className="flex gap-sm">
              <button
                className={`btn ${uploadMode === 'record' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setUploadMode('record')}
              >
                🎤 Record
              </button>
              <button
                className={`btn ${uploadMode === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setUploadMode('upload')}
              >
                📁 Upload File
              </button>
            </div>
          </div>

          {/* Recording Section */}
          {uploadMode === 'record' && (
            <div className="recording-section mb-xl">
              <div className="recording-controls text-center">
                {!isRecording && !audioBlob && (
                  <button
                    className="btn btn-primary btn-lg recording-button"
                    onClick={startRecording}
                  >
                    <span className="text-2xl">🎤</span>
                    <span>Start Recording</span>
                  </button>
                )}

                {isRecording && (
                  <div className="recording-active">
                    <button
                      className="btn btn-error btn-lg recording-button pulsing"
                      onClick={stopRecording}
                    >
                      <span className="text-2xl">⏹️</span>
                      <span>Stop Recording</span>
                    </button>
                    <div className="recording-timer mt-md">
                      <span className="text-lg font-mono">{formatTime(recordingTime)}</span>
                    </div>
                    <div className="recording-indicator mt-sm">
                      <div className="sound-wave">
                        <div className="sound-wave-bar"></div>
                        <div className="sound-wave-bar"></div>
                        <div className="sound-wave-bar"></div>
                        <div className="sound-wave-bar"></div>
                        <div className="sound-wave-bar"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* File Upload Section */}
          {uploadMode === 'upload' && (
            <div className="file-upload-section mb-xl">
              <div className="file-drop-zone">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="audio-file-input"
                />
                <label htmlFor="audio-file-input" className="file-drop-label">
                  <div className="text-center py-2xl">
                    <div className="text-4xl mb-md">📁</div>
                    <p className="font-medium mb-sm">Click to select audio file</p>
                    <p className="text-sm text-gray-600">
                      Supports MP3, WAV, M4A, WEBM (max 10MB)
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Audio Preview */}
          {audioUrl && (
            <div className="audio-preview mb-xl">
              <div className="card bg-light">
                <div className="card-body">
                  <div className="flex items-center justify-between mb-md">
                    <h4 className="font-medium">Audio Preview</h4>
                    <span className="text-sm text-gray-600">
                      Duration: {formatTime(duration)}
                    </span>
                  </div>
                  <audio controls className="w-full mb-md">
                    <source src={audioUrl} type="audio/webm" />
                    <source src={audioUrl} type="audio/mpeg" />
                    Your browser does not support audio playback.
                  </audio>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={resetForm}
                  >
                    🗑️ Delete & Start Over
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Metadata Form */}
          {audioBlob && (
            <div className="metadata-form space-y-lg">
              <div>
                <label className="block text-sm font-medium mb-xs">
                  Title *
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Enter a title for your audio snippet"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
                <div className="text-xs text-gray-500 mt-xs">
                  {title.length}/100 characters
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-xs">
                  Description (optional)
                </label>
                <textarea
                  className="input w-full"
                  placeholder="Describe your audio snippet..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 mt-xs">
                  {description.length}/500 characters
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-xs">
                  Tags (optional)
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="crypto, defi, web3, conference (comma separated)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
                <div className="text-xs text-gray-500 mt-xs">
                  Separate tags with commas
                </div>
              </div>

              {/* Venue/Event Info */}
              {(venueId || eventId) && (
                <div className="bg-light p-md rounded-lg">
                  <h5 className="font-medium mb-sm">Event Context</h5>
                  {venueId && (
                    <div className="text-sm text-gray-600">
                      📍 Venue: {venueId}
                    </div>
                  )}
                  {eventId && (
                    <div className="text-sm text-gray-600">
                      🎪 Event: {eventId}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="error-message mb-lg">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Upload Button */}
          {audioBlob && (
            <div className="upload-actions mt-xl">
              <button
                className="btn btn-primary btn-lg w-full"
                onClick={handleUpload}
                disabled={isUploading || !title.trim()}
              >
                {isUploading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Uploading to IPFS...
                  </>
                ) : (
                  <>
                    <span>🚀 Upload Snippet</span>
                  </>
                )}
              </button>

              <div className="text-center mt-md">
                <div className="text-xs text-gray-500">
                  💾 Stored on decentralized IPFS network<br/>
                  🔐 Linked to your wallet identity
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
