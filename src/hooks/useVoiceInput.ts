import { useState, useCallback, useRef } from 'react';

interface VoiceInputOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

interface VoiceInputResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

interface UseVoiceInputReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  startListening: (options?: VoiceInputOptions) => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useVoiceInput(): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Check if speech recognition is supported
  const isSupported = typeof window !== 'undefined' && 
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  const startListening = useCallback((options: VoiceInputOptions = {}) => {
    if (!isSupported) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    if (isListening) {
      return; // Already listening
    }

    try {
      // Create recognition instance
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      // Configure recognition
      recognition.continuous = options.continuous ?? false;
      recognition.interimResults = options.interimResults ?? true;
      recognition.lang = options.language ?? 'en-US';
      recognition.maxAlternatives = options.maxAlternatives ?? 1;

      // Event handlers
      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        setTranscript('');
        setConfidence(0);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        let maxConfidence = 0;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence || 0;

          if (result.isFinal) {
            finalTranscript += transcript;
            maxConfidence = Math.max(maxConfidence, confidence);
          } else {
            interimTranscript += transcript;
          }
        }

        // Update state with the best result
        if (finalTranscript) {
          setTranscript(finalTranscript.trim());
          setConfidence(maxConfidence);
        } else if (interimTranscript) {
          setTranscript(interimTranscript.trim());
          setConfidence(0); // Interim results don't have reliable confidence
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setError(getErrorMessage(event.error));
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      // Store reference and start
      recognitionRef.current = recognition;
      recognition.start();

    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError('Failed to start voice input');
      setIsListening(false);
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    confidence,
    error,
    startListening,
    stopListening,
    resetTranscript
  };
}

function getErrorMessage(error: string): string {
  switch (error) {
    case 'no-speech':
      return 'No speech detected. Please try again.';
    case 'audio-capture':
      return 'Microphone not accessible. Please check permissions.';
    case 'not-allowed':
      return 'Microphone access denied. Please allow microphone access.';
    case 'network':
      return 'Network error. Please check your connection.';
    case 'service-not-allowed':
      return 'Speech recognition service not available.';
    case 'bad-grammar':
      return 'Speech recognition grammar error.';
    case 'language-not-supported':
      return 'Language not supported for speech recognition.';
    default:
      return `Speech recognition error: ${error}`;
  }
}

// Enhanced voice input hook with noise filtering for live venues
export function useEnhancedVoiceInput() {
  const baseVoiceInput = useVoiceInput();
  const [isNoiseFiltered, setIsNoiseFiltered] = useState(false);

  const startListeningWithNoiseFilter = useCallback((options: VoiceInputOptions = {}) => {
    // Enhanced options for noisy environments
    const enhancedOptions: VoiceInputOptions = {
      ...options,
      continuous: false, // Better for noisy environments
      interimResults: true,
      maxAlternatives: 3 // Get multiple alternatives to choose best one
    };

    setIsNoiseFiltered(true);
    baseVoiceInput.startListening(enhancedOptions);
  }, [baseVoiceInput]);

  const processTranscriptForVenue = useCallback((transcript: string): string => {
    // Clean up common venue noise artifacts
    let cleaned = transcript
      .replace(/\b(uh|um|ah|er)\b/gi, '') // Remove filler words
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Capitalize first letter
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    return cleaned;
  }, []);

  return {
    ...baseVoiceInput,
    startListeningWithNoiseFilter,
    processTranscriptForVenue,
    isNoiseFiltered
  };
}