// Security validation utility for MegaVibe
// Ensures proper environment configuration and prevents security issues

interface SecurityCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SecurityReport {
  overall: 'secure' | 'warning' | 'critical';
  checks: SecurityCheck[];
  recommendations: string[];
}

class SecurityValidator {
  private checks: SecurityCheck[] = [];
  private recommendations: string[] = [];

  validateEnvironment(): SecurityReport {
    this.checks = [];
    this.recommendations = [];

    // Check 1: Verify no private keys in environment
    this.checkPrivateKeys();

    // Check 2: Validate API key configuration
    this.checkApiKeys();

    // Check 3: Check for development secrets in production
    this.checkProductionSecrets();

    // Check 4: Validate HTTPS usage in production
    this.checkHttpsUsage();

    // Check 5: Check for exposed sensitive data
    this.checkExposedData();

    // Check 6: Validate CORS configuration
    this.checkCorsConfiguration();

    return this.generateReport();
  }

  private checkPrivateKeys(): void {
    const envVars = this.getEnvironmentVariables();
    const suspiciousKeys = ['PRIVATE_KEY', 'SECRET_KEY', 'MNEMONIC', 'SEED_PHRASE'];
    
    let foundPrivateKeys = false;
    
    for (const [key, value] of Object.entries(envVars)) {
      // Check for suspicious key names
      if (suspiciousKeys.some(suspicious => key.toUpperCase().includes(suspicious))) {
        foundPrivateKeys = true;
        break;
      }
      
      // Check for private key patterns (0x followed by 64 hex chars)
      if (typeof value === 'string' && /^0x[a-fA-F0-9]{64}$/.test(value)) {
        foundPrivateKeys = true;
        break;
      }
    }

    if (foundPrivateKeys) {
      this.checks.push({
        name: 'Private Key Check',
        status: 'fail',
        message: 'Private keys detected in environment variables',
        severity: 'critical'
      });
      this.recommendations.push('Remove all private keys from frontend environment variables');
      this.recommendations.push('Use backend services for operations requiring private keys');
    } else {
      this.checks.push({
        name: 'Private Key Check',
        status: 'pass',
        message: 'No private keys found in environment',
        severity: 'low'
      });
    }
  }

  private checkApiKeys(): void {
    const envVars = this.getEnvironmentVariables();
    const requiredApiKeys = ['VITE_DYNAMIC_ENVIRONMENT_ID', 'VITE_LIFI_API_KEY'];
    const missingKeys: string[] = [];
    const publicKeys: string[] = [];

    for (const key of requiredApiKeys) {
      const value = envVars[key];
      if (!value) {
        missingKeys.push(key);
      } else {
        // LI.FI API keys should be public-safe
        if (key === 'VITE_LIFI_API_KEY') {
          publicKeys.push(key);
        }
      }
    }

    if (missingKeys.length > 0) {
      this.checks.push({
        name: 'API Key Configuration',
        status: 'fail',
        message: `Missing required API keys: ${missingKeys.join(', ')}`,
        severity: 'high'
      });
      this.recommendations.push('Configure all required API keys in your .env file');
    } else {
      this.checks.push({
        name: 'API Key Configuration',
        status: 'pass',
        message: 'All required API keys are configured',
        severity: 'low'
      });
    }

    // Verify LI.FI API key is public-safe
    const lifiKey = envVars['VITE_LIFI_API_KEY'];
    if (lifiKey && lifiKey.length > 100) {
      this.checks.push({
        name: 'LI.FI API Key Safety',
        status: 'warning',
        message: 'LI.FI API key appears to be unusually long - verify it is public-safe',
        severity: 'medium'
      });
      this.recommendations.push('Ensure LI.FI API key is intended for client-side use');
    }
  }

  private checkProductionSecrets(): void {
    const isProduction = import.meta.env.NODE_ENV === 'production' || 
                        import.meta.env.VITE_ENVIRONMENT === 'production';
    
    if (isProduction) {
      const envVars = this.getEnvironmentVariables();
      const developmentKeys = ['DEBUG', 'TEST', 'LOCAL'];
      const foundDevKeys: string[] = [];

      for (const [key, value] of Object.entries(envVars)) {
        if (developmentKeys.some(devKey => key.toUpperCase().includes(devKey))) {
          if (value === 'true' || value === '1') {
            foundDevKeys.push(key);
          }
        }
      }

      if (foundDevKeys.length > 0) {
        this.checks.push({
          name: 'Production Configuration',
          status: 'warning',
          message: `Development flags enabled in production: ${foundDevKeys.join(', ')}`,
          severity: 'medium'
        });
        this.recommendations.push('Disable development flags in production environment');
      } else {
        this.checks.push({
          name: 'Production Configuration',
          status: 'pass',
          message: 'Production configuration is clean',
          severity: 'low'
        });
      }
    }
  }

  private checkHttpsUsage(): void {
    const apiUrl = import.meta.env.VITE_API_URL;
    const isProduction = import.meta.env.NODE_ENV === 'production';

    if (isProduction && apiUrl && !apiUrl.startsWith('https://')) {
      this.checks.push({
        name: 'HTTPS Usage',
        status: 'fail',
        message: 'API URL is not using HTTPS in production',
        severity: 'high'
      });
      this.recommendations.push('Use HTTPS for all API endpoints in production');
    } else if (apiUrl && apiUrl.startsWith('https://')) {
      this.checks.push({
        name: 'HTTPS Usage',
        status: 'pass',
        message: 'HTTPS is properly configured',
        severity: 'low'
      });
    }
  }

  private checkExposedData(): void {
    const envVars = this.getEnvironmentVariables();
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /token.*[a-zA-Z0-9]{32,}/i, // Long tokens
      /key.*[a-zA-Z0-9]{32,}/i    // Long keys
    ];

    let foundSensitiveData = false;

    for (const [key, value] of Object.entries(envVars)) {
      if (typeof value === 'string') {
        for (const pattern of sensitivePatterns) {
          if (pattern.test(key) || pattern.test(value)) {
            // Skip known safe keys
            if (key.includes('DYNAMIC_ENVIRONMENT_ID') || key.includes('LIFI_API_KEY')) {
              continue;
            }
            foundSensitiveData = true;
            break;
          }
        }
      }
    }

    if (foundSensitiveData) {
      this.checks.push({
        name: 'Sensitive Data Exposure',
        status: 'warning',
        message: 'Potentially sensitive data found in environment',
        severity: 'medium'
      });
      this.recommendations.push('Review environment variables for sensitive data');
    } else {
      this.checks.push({
        name: 'Sensitive Data Exposure',
        status: 'pass',
        message: 'No sensitive data exposure detected',
        severity: 'low'
      });
    }
  }

  private checkCorsConfiguration(): void {
    const apiUrl = import.meta.env.VITE_API_URL;
    const currentOrigin = window.location.origin;

    // This is a basic check - in a real app, you'd verify CORS headers
    if (apiUrl && apiUrl !== currentOrigin && !apiUrl.includes('localhost')) {
      this.checks.push({
        name: 'CORS Configuration',
        status: 'warning',
        message: 'Cross-origin API detected - ensure CORS is properly configured',
        severity: 'medium'
      });
      this.recommendations.push('Verify CORS headers are properly configured on your API server');
    } else {
      this.checks.push({
        name: 'CORS Configuration',
        status: 'pass',
        message: 'CORS configuration appears correct',
        severity: 'low'
      });
    }
  }

  private getEnvironmentVariables(): Record<string, string> {
    // Get all VITE_ prefixed environment variables
    const envVars: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(import.meta.env)) {
      if (key.startsWith('VITE_')) {
        envVars[key] = String(value);
      }
    }

    return envVars;
  }

  private generateReport(): SecurityReport {
    const criticalIssues = this.checks.filter(check => check.severity === 'critical' && check.status === 'fail');
    const highIssues = this.checks.filter(check => check.severity === 'high' && check.status === 'fail');
    const warnings = this.checks.filter(check => check.status === 'warning');

    let overall: 'secure' | 'warning' | 'critical';

    if (criticalIssues.length > 0) {
      overall = 'critical';
    } else if (highIssues.length > 0 || warnings.length > 2) {
      overall = 'warning';
    } else {
      overall = 'secure';
    }

    return {
      overall,
      checks: this.checks,
      recommendations: this.recommendations
    };
  }

  // Public method to run security check and log results
  static runSecurityCheck(): SecurityReport {
    const validator = new SecurityValidator();
    const report = validator.validateEnvironment();

    // Log results in development
    if (import.meta.env.NODE_ENV === 'development') {
      console.group('🔒 Security Validation Report');
      console.log(`Overall Status: ${report.overall.toUpperCase()}`);
      
      report.checks.forEach(check => {
        const icon = check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
        console.log(`${icon} ${check.name}: ${check.message}`);
      });

      if (report.recommendations.length > 0) {
        console.group('📋 Recommendations');
        report.recommendations.forEach(rec => console.log(`• ${rec}`));
        console.groupEnd();
      }

      console.groupEnd();
    }

    return report;
  }
}

// Export the validator
export { SecurityValidator };
export type { SecurityReport, SecurityCheck };

// Auto-run security check in development
if (import.meta.env.NODE_ENV === 'development') {
  SecurityValidator.runSecurityCheck();
}
