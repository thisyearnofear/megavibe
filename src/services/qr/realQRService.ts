import QRCode from 'qrcode';
import jsQR from 'jsqr';

export interface QRCodeData {
  performerId: string;
  performerName: string;
  qrCodeUrl: string;
  deepLink: string;
  timestamp: number;
}

export interface QRScanResult {
  performerId: string;
  performerName?: string;
  isValid: boolean;
  error?: string;
}

export interface QRGenerationOptions {
  size?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  includeMetadata?: boolean;
}

class RealQRService {
  private readonly baseUrl = 'https://megavibe.app';
  private readonly deepLinkScheme = 'megavibe';

  async generatePerformerQR(
    performerId: string,
    performerName: string,
    options: QRGenerationOptions = {}
  ): Promise<QRCodeData> {
    try {
      // Create the deep link URL
      const deepLink = `${this.deepLinkScheme}://performer/${performerId}`;
      const webUrl = `${this.baseUrl}/performer/${performerId}`;
      
      // Create QR code data with metadata
      const qrData = JSON.stringify({
        type: 'performer',
        id: performerId,
        name: performerName,
        url: webUrl,
        deepLink: deepLink,
        timestamp: Date.now(),
        version: '1.0'
      });

      // Generate QR code with options
      const qrOptions = {
        width: options.size || 256,
        margin: options.margin || 2,
        color: {
          dark: options.color?.dark || '#000000',
          light: options.color?.light || '#FFFFFF'
        },
        errorCorrectionLevel: options.errorCorrectionLevel || 'M'
      };

      const qrCodeUrl = await QRCode.toDataURL(qrData, qrOptions);

      return {
        performerId,
        performerName,
        qrCodeUrl,
        deepLink,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      throw new Error('QR code generation failed');
    }
  }

  async generateCustomQR(
    data: unknown,
    options: QRGenerationOptions = {}
  ): Promise<string> {
    try {
      // Only allow objects, arrays, strings, numbers, booleans for QR data
      if (
        typeof data !== "object" &&
        typeof data !== "string" &&
        typeof data !== "number" &&
        typeof data !== "boolean"
      ) {
        throw new Error("Unsupported QR data type");
      }
      const qrOptions = {
        width: options.size || 256,
        margin: options.margin || 2,
        color: {
          dark: options.color?.dark || '#000000',
          light: options.color?.light || '#FFFFFF'
        },
        errorCorrectionLevel: options.errorCorrectionLevel || 'M'
      };

      return await QRCode.toDataURL(JSON.stringify(data), qrOptions);
    } catch (error) {
      console.error('Failed to generate custom QR code:', error);
      throw new Error('Custom QR code generation failed');
    }
  },
        errorCorrectionLevel: options.errorCorrectionLevel || 'M'
      };

      return await QRCode.toDataURL(JSON.stringify(data), qrOptions);
    } catch (error) {
      console.error('Failed to generate custom QR code:', error);
      throw new Error('Custom QR code generation failed');
    }
  }

  async scanQRFromImageData(
    imageData: ImageData
  ): Promise<QRScanResult> {
    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (!code) {
        return {
          performerId: '',
          isValid: false,
          error: 'No QR code found in image'
        };
      }

      return this.parseQRData(code.data);
    } catch (error) {
      console.error('QR scan failed:', error);
      return {
        performerId: '',
        isValid: false,
        error: 'Failed to scan QR code'
      };
    }
  }

  async scanQRFromCanvas(canvas: HTMLCanvasElement): Promise<QRScanResult> {
    try {
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Canvas context not available');
      }

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      return this.scanQRFromImageData(imageData);
    } catch (error) {
      console.error('Canvas QR scan failed:', error);
      return {
        performerId: '',
        isValid: false,
        error: 'Failed to scan QR code from canvas'
      };
    }
  }

  private parseQRData(qrText: string): QRScanResult {
    try {
      // Try to parse as JSON first (our format)
      const data = JSON.parse(qrText);
      
      if (data.type === 'performer' && data.id) {
        return {
          performerId: data.id,
          performerName: data.name,
          isValid: true
        };
      }
      
      // If not our format, check if it's a direct URL
      if (qrText.includes('megavibe.app/performer/')) {
        const performerId = this.extractPerformerIdFromUrl(qrText);
        if (performerId) {
          return {
            performerId,
            isValid: true
          };
        }
      }
      
      // Check if it's a deep link
      if (qrText.startsWith(`${this.deepLinkScheme}://performer/`)) {
        const performerId = qrText.replace(`${this.deepLinkScheme}://performer/`, '');
        if (performerId) {
          return {
            performerId,
            isValid: true
          };
        }
      }

      return {
        performerId: '',
        isValid: false,
        error: 'QR code is not a valid MegaVibe performer code'
      };
    } catch (error) {
      // If JSON parsing fails, try direct URL parsing
      if (qrText.includes('megavibe.app/performer/')) {
        const performerId = this.extractPerformerIdFromUrl(qrText);
        if (performerId) {
          return {
            performerId,
            isValid: true
          };
        }
      }

      return {
        performerId: '',
        isValid: false,
        error: 'Invalid QR code format'
      };
    }
  }

  private extractPerformerIdFromUrl(url: string): string | null {
    try {
      const match = url.match(/\/performer\/([^\/\?#]+)/);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  }

  // Deep link handling
  generateDeepLink(performerId: string, action?: 'tip' | 'request'): string {
    let link = `${this.deepLinkScheme}://performer/${performerId}`;
    if (action) {
      link += `?action=${action}`;
    }
    return link;
  }

  parseDeepLink(url: string): {
    performerId?: string;
    action?: 'tip' | 'request';
    isValid: boolean;
  } {
    try {
      if (!url.startsWith(`${this.deepLinkScheme}://`)) {
        return { isValid: false };
      }

      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      
      if (pathParts[0] === 'performer' && pathParts[1]) {
        const performerId = pathParts[1];
        const action = urlObj.searchParams.get('action') as 'tip' | 'request' | null;
        
        return {
          performerId,
          action: action || undefined,
          isValid: true
        };
      }

      return { isValid: false };
    } catch (error) {
      return { isValid: false };
    }
  }

  // QR code validation and security
  async validateQRCode(qrData: string): Promise<{
    isValid: boolean;
    isSafe: boolean;
    performerId?: string;
    warnings?: string[];
  }> {
    try {
      const scanResult = this.parseQRData(qrData);
      const warnings: string[] = [];

      if (!scanResult.isValid) {
        return {
          isValid: false,
          isSafe: false,
          warnings: [scanResult.error || 'Invalid QR code']
        };
      }

      // Additional security checks
      let isSafe = true;

      // Check if performer exists (would integrate with performer service)
      // const performerExists = await performerService.validatePerformer(scanResult.performerId);
      // if (!performerExists) {
      //   warnings.push('Performer not found in system');
      //   isSafe = false;
      // }

      // Check for suspicious patterns
      if (scanResult.performerId.length > 100) {
        warnings.push('Unusually long performer ID');
        isSafe = false;
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(scanResult.performerId)) {
        warnings.push('Performer ID contains suspicious characters');
        isSafe = false;
      }

      return {
        isValid: scanResult.isValid,
        isSafe,
        performerId: scanResult.performerId,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      return {
        isValid: false,
        isSafe: false,
        warnings: ['Failed to validate QR code']
      };
    }
  }

  // Utility methods
  async downloadQRCode(qrCodeUrl: string, filename: string): Promise<void> {
    try {
      const link = document.createElement('a');
      link.download = filename;
      link.href = qrCodeUrl;
      link.click();
    } catch (error) {
      console.error('Failed to download QR code:', error);
      throw new Error('Download failed');
    }
  }

  async shareQRCode(qrCodeData: QRCodeData): Promise<void> {
    try {
      if (navigator.share) {
        // Convert data URL to blob for sharing
        const response = await fetch(qrCodeData.qrCodeUrl);
        const blob = await response.blob();
        const file = new File([blob], `${qrCodeData.performerName}_QR.png`, { 
          type: 'image/png' 
        });

        await navigator.share({
          title: `${qrCodeData.performerName} - MegaVibe`,
          text: `Connect with ${qrCodeData.performerName} on MegaVibe!`,
          files: [file]
        });
      } else {
        // Fallback to copying link
        await navigator.clipboard.writeText(qrCodeData.deepLink);
        alert('QR code link copied to clipboard!');
      }
    } catch (error) {
      console.error('Failed to share QR code:', error);
      // Fallback to download
      await this.downloadQRCode(
        qrCodeData.qrCodeUrl, 
        `${qrCodeData.performerName}_QR.png`
      );
    }
  }

  // Batch QR operations
  async generateBatchQRCodes(
    performers: Array<{ id: string; name: string }>,
    options: QRGenerationOptions = {}
  ): Promise<QRCodeData[]> {
    const results: QRCodeData[] = [];
    
    for (const performer of performers) {
      try {
        const qrData = await this.generatePerformerQR(
          performer.id, 
          performer.name, 
          options
        );
        results.push(qrData);
      } catch (error) {
        console.error(`Failed to generate QR for ${performer.name}:`, error);
      }
    }
    
    return results;
  }
}

export const realQRService = new RealQRService();