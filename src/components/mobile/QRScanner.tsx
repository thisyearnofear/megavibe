"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./QRScanner.module.css";

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (performerId: string) => void;
  onError?: (error: string) => void;
}

export default function QRScanner({ isOpen, onClose, onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string>("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError("");
      setIsScanning(true);

      // Check if we're in a secure context (HTTPS or localhost)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access not available. Please use HTTPS or localhost.");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        
        // Start scanning once video is ready
        videoRef.current.onloadedmetadata = () => {
          startScanning();
        };
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setHasPermission(false);
      setError(err instanceof Error ? err.message : "Camera access denied");
      onError?.(err instanceof Error ? err.message : "Camera access denied");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    setIsScanning(false);
  };

  const startScanning = () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Scan every 500ms
    scanIntervalRef.current = setInterval(() => {
      scanForQRCode();
    }, 500);
  };

  const scanForQRCode = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Real QR code detection using jsQR
      const { realQRService } = await import('@/services/qr/realQRService');
      const scanResult = await realQRService.scanQRFromCanvas(canvas);
      
      if (scanResult.isValid && scanResult.performerId) {
        // Validate the QR code for security
        const validation = await realQRService.validateQRCode(JSON.stringify({
          type: 'performer',
          id: scanResult.performerId,
          name: scanResult.performerName
        }));
        
        if (validation.isValid && validation.isSafe) {
          handleQRDetected(scanResult.performerId);
        } else {
          setError(validation.warnings?.join(', ') || 'Invalid QR code');
        }
      }
      // Continue scanning if no valid QR found
      
    } catch (err) {
      console.error("QR scanning error:", err);
    }
  };

  const simulateQRDetection = (imageData: ImageData) => {
    // Simulate QR code detection for demo purposes
    // In production, use: import jsQR from 'jsqr'; const code = jsQR(imageData.data, imageData.width, imageData.height);
    
    // For demo, we'll randomly "detect" a QR code after a few seconds
    if (Math.random() > 0.98) { // 2% chance per scan
      const mockPerformerId = "performer_" + Math.random().toString(36).substr(2, 9);
      handleQRDetected(mockPerformerId);
    }
  };

  const handleQRDetected = (performerId: string) => {
    // Haptic feedback
    navigator.vibrate?.(200);
    
    // Stop scanning
    stopCamera();
    
    // Call the onScan callback
    onScan(performerId);
    
    // Close scanner
    onClose();
  };

  const handleManualInput = () => {
    const performerId = prompt("Enter performer ID or scan code:");
    if (performerId) {
      handleQRDetected(performerId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.scanner}>
        {/* Header */}
        <div className={styles.header}>
          <button 
            className={styles.closeButton} 
            onClick={() => {
              // Add haptic feedback and smooth exit
              navigator.vibrate?.(50);
              stopCamera();
              setTimeout(onClose, 300);
            }}
          >
            ✕
          </button>
          <h2 className={styles.title}>Scan QR Code</h2>
          <button className={styles.manualButton} onClick={handleManualInput}>
            Manual
          </button>
        </div>

        {/* Camera View */}
        <div className={styles.cameraContainer}>
          {hasPermission === false ? (
            <div className={styles.permissionError}>
              <div className={styles.errorIcon}>📷</div>
              <h3>Camera Access Needed</h3>
              <p>{error}</p>
              <button className={styles.retryButton} onClick={startCamera}>
                Try Again
              </button>
            </div>
          ) : hasPermission === null ? (
            <div className={styles.loading}>
              <div className={styles.loadingSpinner}>📷</div>
              <p>Requesting camera access...</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className={styles.video}
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className={styles.canvas}
                style={{ display: 'none' }}
              />
              
              {/* Scanning Overlay */}
              <div className={styles.scanningOverlay}>
                <div className={styles.scanFrame}>
                  <div className={styles.cornerTopLeft} />
                  <div className={styles.cornerTopRight} />
                  <div className={styles.cornerBottomLeft} />
                  <div className={styles.cornerBottomRight} />
                  <div className={styles.scanGuideText}>
                    Align QR code within frame
                  </div>
                </div>
                
                {isScanning && (
                  <div className={styles.scanLine} />
                )}
              </div>
              <div className={styles.hintBubble}>
                <span>💡</span> Point camera at performer's QR code
              </div>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className={styles.instructions}>
          <p>Point your camera at a performer's QR code</p>
          <div className={styles.tips}>
            <span>💡 Make sure the QR code is well lit</span>
            <span>📱 Hold steady for best results</span>
          </div>
        </div>

        {/* Demo Helper */}
        <div className={styles.demoHelper}>
          <p>Demo Mode: QR detection simulated</p>
          <button 
            className={styles.simulateButton}
            onClick={() => handleQRDetected("demo_performer_123")}
          >
            Simulate QR Detection
          </button>
        </div>
      </div>
    </div>
  );
}
