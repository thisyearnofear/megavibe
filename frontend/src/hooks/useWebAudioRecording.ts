'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface WebRecordingState {
  isRecording: boolean;
  isLoading: boolean;
  duration: number;
  audioBlob: Blob | null;
  error: string | null;
  waveformData: number[];
}

export interface WebRecordingActions {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  cancelRecording: () => void;
  requestPermissions: () => Promise<boolean>;
}

export function useWebAudioRecording(): WebRecordingState & WebRecordingActions {
  const [state, setState] = useState<WebRecordingState>({
    isRecording: false,
    isLoading: false,
    duration: 0,
    audioBlob: null,
    error: null,
    waveformData: [],
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const waveformIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (waveformIntervalRef.current) {
        clearInterval(waveformIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        }
      });

      // Test successful, stop the stream
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Failed to request audio permissions:', error);
      setState(prev => ({
        ...prev,
        error: 'Microphone permission denied or not available',
      }));
      return false;
    }
  }, []);

  const startDurationTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    durationIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setState(prev => ({
        ...prev,
        duration: elapsed,
      }));
    }, 100);
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  const startWaveformAnalysis = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    waveformIntervalRef.current = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);

      // Calculate average amplitude for waveform visualization
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const normalizedValue = average / 255; // Normalize to 0-1

      setState(prev => ({
        ...prev,
        waveformData: [...prev.waveformData.slice(-100), normalizedValue], // Keep last 100 values
      }));
    }, 50); // Update every 50ms for smooth animation
  }, []);

  const stopWaveformAnalysis = useCallback(() => {
    if (waveformIntervalRef.current) {
      clearInterval(waveformIntervalRef.current);
      waveformIntervalRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request permissions and get media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        }
      });

      streamRef.current = stream;

      // Set up audio context for waveform analysis
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      source.connect(analyserRef.current);

      // Set up MediaRecorder with fallback MIME types
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/wav';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = ''; // Let browser choose
            }
          }
        }
      }

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        setState(prev => ({
          ...prev,
          audioBlob: blob,
          isRecording: false,
        }));
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setState(prev => ({
          ...prev,
          error: 'Recording failed. Please try again.',
          isRecording: false,
          isLoading: false,
        }));
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms

      setState(prev => ({
        ...prev,
        isRecording: true,
        isLoading: false,
        duration: 0,
        waveformData: [],
        audioBlob: null,
      }));

      startDurationTimer();
      startWaveformAnalysis();
    } catch (error) {
      console.error('Failed to start recording:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to start recording',
      }));
    }
  }, [startDurationTimer, startWaveformAnalysis]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!mediaRecorderRef.current || !streamRef.current) {
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true }));
    stopDurationTimer();
    stopWaveformAnalysis();

    try {
      // Stop recording
      if (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.stop();
      }

      // Stop all tracks
      streamRef.current.getTracks().forEach(track => track.stop());

      // Close audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close();
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
      }));

      // Return the blob (will be set by the onstop event)
      return state.audioBlob;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to stop recording',
      }));
      return null;
    }
  }, [state.audioBlob, stopDurationTimer, stopWaveformAnalysis]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      stopDurationTimer();
      stopWaveformAnalysis();
    }
  }, [stopDurationTimer, stopWaveformAnalysis]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      startDurationTimer();
      startWaveformAnalysis();
    }
  }, [startDurationTimer, startWaveformAnalysis]);

  const cancelRecording = useCallback(() => {
    // Stop recording if active
    if (mediaRecorderRef.current &&
        (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused')) {
      mediaRecorderRef.current.stop();
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }

    stopDurationTimer();
    stopWaveformAnalysis();

    setState(prev => ({
      ...prev,
      isRecording: false,
      isLoading: false,
      duration: 0,
      audioBlob: null,
      waveformData: [],
      error: null,
    }));

    chunksRef.current = [];
  }, [stopDurationTimer, stopWaveformAnalysis]);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    requestPermissions,
  };
}
