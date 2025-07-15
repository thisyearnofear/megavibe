"use client";

import React, { useState, useRef } from "react";
import { realQRService, QRCodeData } from "@/services/qr/realQRService";
import styles from "./QRCodeGenerator.module.css";

interface QRCodeGeneratorProps {
  performerId: string;
  performerName: string;
  size?: number;
  includeDownload?: boolean;
}

export default function QRCodeGenerator({
  performerId,
  performerName,
  size = 256,
  includeDownload = true,
}: QRCodeGeneratorProps) {
  const [qrCodeData, setQrCodeData] = useState<QRCodeData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    generateQRCode();
  }, [performerId, performerName, size]);

  const generateQRCode = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const qrData = await realQRService.generatePerformerQR(
        performerId,
        performerName,
        {
          size,
          errorCorrectionLevel: "M",
          color: {
            dark: "#8A2BE2", // MegaVibe primary color
            light: "#FFFFFF",
          },
          margin: 2,
        }
      );

      setQrCodeData(qrData);
    } catch (err) {
      console.error("Failed to generate QR code:", err);
      setError("Failed to generate QR code");
    } finally {
      setIsGenerating(false);
    }
  };

  const createQRPattern = (
    ctx: CanvasRenderingContext2D,
    size: number,
    data: string
  ) => {
    // Clear canvas
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, size, size);

    // Create a simple pattern based on performer ID
    const gridSize = 25; // 25x25 grid
    const cellSize = size / gridSize;

    // Generate pattern from performer ID
    const hash = simpleHash(data);

    ctx.fillStyle = "#000000";

    // Draw finder patterns (corners)
    drawFinderPattern(ctx, 0, 0, cellSize);
    drawFinderPattern(ctx, (gridSize - 7) * cellSize, 0, cellSize);
    drawFinderPattern(ctx, 0, (gridSize - 7) * cellSize, cellSize);

    // Draw data pattern
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // Skip finder pattern areas
        if (isFinderPatternArea(row, col, gridSize)) continue;

        // Generate pattern based on hash
        const index = row * gridSize + col;
        if ((hash >> index % 32) & 1) {
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
    }

    // Add MegaVibe branding in center
    const centerX = size / 2;
    const centerY = size / 2;
    const logoSize = size * 0.15;

    // White background for logo
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(
      centerX - logoSize / 2,
      centerY - logoSize / 2,
      logoSize,
      logoSize
    );

    // Purple border
    ctx.strokeStyle = "#8A2BE2";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      centerX - logoSize / 2,
      centerY - logoSize / 2,
      logoSize,
      logoSize
    );

    // MV text
    ctx.fillStyle = "#8A2BE2";
    ctx.font = `bold ${logoSize * 0.3}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("MV", centerX, centerY);
  };

  const drawFinderPattern = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    cellSize: number
  ) => {
    // Outer 7x7 square
    ctx.fillRect(x, y, 7 * cellSize, 7 * cellSize);

    // Inner white 5x5 square
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize);

    // Inner black 3x3 square
    ctx.fillStyle = "#000000";
    ctx.fillRect(
      x + 2 * cellSize,
      y + 2 * cellSize,
      3 * cellSize,
      3 * cellSize
    );
  };

  const isFinderPatternArea = (
    row: number,
    col: number,
    gridSize: number
  ): boolean => {
    // Top-left
    if (row < 9 && col < 9) return true;
    // Top-right
    if (row < 9 && col >= gridSize - 8) return true;
    // Bottom-left
    if (row >= gridSize - 8 && col < 9) return true;
    return false;
  };

  const simpleHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  };

  const downloadQRCode = async () => {
    if (!qrCodeData) return;

    try {
      await realQRService.downloadQRCode(
        qrCodeData.qrCodeUrl,
        `${performerName.replace(/\s+/g, "_")}_QR_Code.png`
      );
    } catch (error) {
      console.error("Failed to download QR code:", error);
      setError("Failed to download QR code");
    }
  };

  const shareQRCode = async () => {
    if (!qrCodeData) return;

    try {
      await realQRService.shareQRCode(qrCodeData);
    } catch (error) {
      console.error("Failed to share QR code:", error);
      setError("Failed to share QR code");
    }
  };

  const copyPerformerLink = async () => {
    if (!qrCodeData) return;

    try {
      await navigator.clipboard.writeText(qrCodeData.deepLink);
      // Show success feedback (in production, use a toast notification)
      alert("Link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy link:", error);
      // Fallback
      prompt("Copy this link:", qrCodeData.deepLink);
    }
  };

  const handleRetry = () => {
    setError(null);
    generateQRCode();
  };

  return (
    <div className={styles.qrGenerator}>
      <div className={styles.qrContainer}>
        {error ? (
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>⚠️</div>
            <h4>QR Generation Failed</h4>
            <p>{error}</p>
            <button className={styles.retryButton} onClick={handleRetry}>
              Try Again
            </button>
          </div>
        ) : isGenerating ? (
          <div className={styles.generating}>
            <div className={styles.spinner} />
            <p>Generating QR Code...</p>
          </div>
        ) : qrCodeData ? (
          <div className={styles.qrDisplay}>
            <img
              src={qrCodeData.qrCodeUrl}
              alt={`QR Code for ${performerName}`}
              className={styles.qrImage}
            />
            <div className={styles.qrLabel}>
              <h4>{performerName}</h4>
              <p>Scan to connect on MegaVibe</p>
            </div>
            <div className={styles.qrMetadata}>
              <p className={styles.qrId}>ID: {performerId}</p>
              <p className={styles.qrTimestamp}>
                Generated: {new Date(qrCodeData.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {includeDownload && qrCodeData?.qrCodeUrl && (
        <div className={styles.actions}>
          <button className={styles.downloadButton} onClick={downloadQRCode}>
            📥 Download
          </button>
          <button className={styles.shareButton} onClick={shareQRCode}>
            📤 Share
          </button>
          <button className={styles.linkButton} onClick={copyPerformerLink}>
            🔗 Copy Link
          </button>
        </div>
      )}

      <div className={styles.instructions}>
        <h4>Display Instructions:</h4>
        <ul>
          <li>
            📱 <strong>Mobile:</strong> Save image and display on your phone
          </li>
          <li>
            🖨️ <strong>Print:</strong> Print on paper or sticker for your setup
          </li>
          <li>
            📺 <strong>Digital:</strong> Display on tablet or screen
          </li>
          <li>
            🎪 <strong>Venue:</strong> Place where audiences can easily see and
            scan
          </li>
        </ul>
      </div>

      <div className={styles.tips}>
        <h4>Pro Tips:</h4>
        <ul>
          <li>💡 Ensure good lighting for easy scanning</li>
          <li>📏 Make it large enough to scan from 3-4 feet away</li>
          <li>🎨 Consider adding your branding around the QR code</li>
          <li>🔄 Test scanning with different phones before performing</li>
        </ul>
      </div>
    </div>
  );
}
