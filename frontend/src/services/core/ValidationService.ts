/**
 * ValidationService.ts
 * 
 * Service for standardized input validation across the application,
 * providing a consistent way to validate user inputs, form data,
 * and API responses.
 */

import { BaseService, ServiceResponse, ErrorCode } from './BaseService';
import { ethers } from 'ethers';

export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

export interface ValidationSchema<T extends Record<string, any>> {
  [key: string]: ValidationRule<any>[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  errorCount: number;
}

export type ValidatorFunction<T> = (value: T) => boolean;

export class ValidationService extends BaseService {
  private readonly commonValidators: Record<string, ValidationRule<any>> = {};
  
  constructor() {
    super('ValidationService');
    
    // Register common validators
    this.registerCommonValidators();
  }
  
  /**
   * Validate an object against a schema
   */
  public validate<T extends Record<string, any>>(
    data: T,
    schema: ValidationSchema<T>
  ): ValidationResult {
    const errors: Record<string, string[]> = {};
    let errorCount = 0;
    
    // Check each field in the schema
    Object.entries(schema).forEach(([field, rules]) => {
      const value = data[field];
      const fieldErrors: string[] = [];
      
      // Apply each rule to the field
      rules.forEach(rule => {
        if (!rule.validate(value)) {
          fieldErrors.push(rule.message);
          errorCount++;
        }
      });
      
      // Add field errors if any
      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    });
    
    return {
      isValid: errorCount === 0,
      errors,
      errorCount
    };
  }
  
  /**
   * Create a validator for required field
   */
  public required(message = 'This field is required'): ValidationRule<any> {
    return {
      validate: (value: any) => {
        if (value === null || value === undefined) {
          return false;
        }
        
        if (typeof value === 'string') {
          return value.trim().length > 0;
        }
        
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        
        return true;
      },
      message
    };
  }
  
  /**
   * Create a validator for minimum string length
   */
  public minLength(min: number, message?: string): ValidationRule<string> {
    return {
      validate: (value: string) => {
        if (!value) return min === 0;
        return value.length >= min;
      },
      message: message || `Must be at least ${min} characters`
    };
  }
  
  /**
   * Create a validator for maximum string length
   */
  public maxLength(max: number, message?: string): ValidationRule<string> {
    return {
      validate: (value: string) => {
        if (!value) return true;
        return value.length <= max;
      },
      message: message || `Must be no more than ${max} characters`
    };
  }
  
  /**
   * Create a validator for numeric ranges
   */
  public range(min: number, max: number, message?: string): ValidationRule<number> {
    return {
      validate: (value: number) => {
        if (value === null || value === undefined) return false;
        return value >= min && value <= max;
      },
      message: message || `Must be between ${min} and ${max}`
    };
  }
  
  /**
   * Create a validator for minimum numeric value
   */
  public min(min: number, message?: string): ValidationRule<number> {
    return {
      validate: (value: number) => {
        if (value === null || value === undefined) return false;
        return value >= min;
      },
      message: message || `Must be at least ${min}`
    };
  }
  
  /**
   * Create a validator for maximum numeric value
   */
  public max(max: number, message?: string): ValidationRule<number> {
    return {
      validate: (value: number) => {
        if (value === null || value === undefined) return false;
        return value <= max;
      },
      message: message || `Must be no more than ${max}`
    };
  }
  
  /**
   * Create a validator for email format
   */
  public email(message = 'Invalid email address'): ValidationRule<string> {
    return {
      validate: (value: string) => {
        if (!value) return false;
        // Simple email regex - a more comprehensive one could be used in production
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      },
      message
    };
  }
  
  /**
   * Create a validator for URL format
   */
  public url(message = 'Invalid URL'): ValidationRule<string> {
    return {
      validate: (value: string) => {
        if (!value) return false;
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message
    };
  }
  
  /**
   * Create a validator for Ethereum addresses
   */
  public ethereumAddress(message = 'Invalid Ethereum address'): ValidationRule<string> {
    return {
      validate: (value: string) => {
        if (!value) return false;
        return /^0x[a-fA-F0-9]{40}$/.test(value);
      },
      message
    };
  }
  
  /**
   * Create a validator for matching another field
   */
  public matches(field: string, message?: string): ValidationRule<any> {
    return {
      validate: (value: any, data?: Record<string, any>) => {
        if (!data) return false;
        return value === data[field];
      },
      message: message || `Must match ${field}`
    };
  }
  
  /**
   * Create a validator based on a custom function
   */
  public custom<T>(
    validatorFn: ValidatorFunction<T>,
    message = 'Invalid value'
  ): ValidationRule<T> {
    return {
      validate: validatorFn,
      message
    };
  }
  
  /**
   * Create a validator for a pattern (regex)
   */
  public pattern(regex: RegExp, message = 'Invalid format'): ValidationRule<string> {
    return {
      validate: (value: string) => {
        if (!value) return false;
        return regex.test(value);
      },
      message
    };
  }
  
  /**
   * Get a common validator by name
   */
  public getValidator(name: string): ValidationRule<any> | undefined {
    return this.commonValidators[name];
  }
  
  /**
   * Register a common validator
   */
  public registerValidator(name: string, rule: ValidationRule<any>): void {
    this.commonValidators[name] = rule;
    this.logInfo(`Validator "${name}" registered`);
  }

  /**
   * Validate if a value is a valid Ethereum address
   */
  public isValidAddress(address: string): boolean {
    try {
      if (!address) return false;
      // Use ethers.js isAddress utility function
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  /**
   * Validate if a value is a positive number
   */
  public isPositiveNumber(value: number): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value !== 'number') return false;
    return value > 0;
  }

  /**
   * Validate if a string represents a positive decimal number
   */
  public isPositiveDecimalString(value: string): boolean {
    if (!value) return false;
    const regex = /^(0|[1-9]\d*)(\.\d+)?$/;
    if (!regex.test(value)) return false;
    return parseFloat(value) > 0;
  }
  
  /**
   * Register common validators
   */
  private registerCommonValidators(): void {
    // Register basic validators
    this.registerValidator('required', this.required());
    this.registerValidator('email', this.email());
    this.registerValidator('url', this.url());
    this.registerValidator('ethAddress', this.ethereumAddress());
    
    // Numeric validators
    this.registerValidator('positive', this.min(0, 'Must be a positive number'));
    this.registerValidator('integer', this.custom(
      (value: number) => Number.isInteger(value),
      'Must be an integer'
    ));
    
    // String validators
    this.registerValidator('alphanumeric', this.pattern(
      /^[a-zA-Z0-9]*$/,
      'Must contain only letters and numbers'
    ));
    this.registerValidator('alphabetic', this.pattern(
      /^[a-zA-Z]*$/,
      'Must contain only letters'
    ));
    this.registerValidator('numeric', this.pattern(
      /^[0-9]*$/,
      'Must contain only numbers'
    ));
    
    // Password validator
    this.registerValidator('strongPassword', this.custom(
      (value: string) => {
        if (!value) return false;
        
        // At least 8 characters, with at least one uppercase, one lowercase, one number, and one special character
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(value);
      },
      'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character'
    ));
    
    this.logInfo('Common validators registered');
  }
  
  /**
   * Create a schema for a specific form
   */
  public createSchema<T extends Record<string, any>>(schema: ValidationSchema<T>): ValidationSchema<T> {
    return schema;
  }
  
  /**
   * Validate API response
   */
  public validateApiResponse<T>(
    response: any,
    expectedSchema: Record<string, any>
  ): ServiceResponse<T> {
    try {
      // Check if response has the expected structure
      if (!response || typeof response !== 'object') {
        return {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Invalid API response format'
          },
          timestamp: Date.now()
        };
      }
      
      // Validate response against expected schema
      const isValid = this.validateObjectStructure(response, expectedSchema);
      
      if (!isValid) {
        return {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'API response does not match expected schema'
          },
          timestamp: Date.now()
        };
      }
      
      return {
        success: true,
        data: response as T,
        timestamp: Date.now()
      };
    } catch (error) {
      this.logError('API response validation error', error);
      
      return {
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Failed to validate API response',
          details: error
        },
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Validate object structure against expected schema
   */
  private validateObjectStructure(
    obj: any,
    schema: Record<string, any>,
    path: string = ''
  ): boolean {
    // If schema is null or undefined, check that obj is the same
    if (schema === null || schema === undefined) {
      return obj === schema;
    }
    
    // If schema is a primitive type, check that obj is the same type
    if (typeof schema !== 'object') {
      return typeof obj === typeof schema;
    }
    
    // If schema is an array, check that obj is an array
    if (Array.isArray(schema)) {
      if (!Array.isArray(obj)) {
        this.logWarning(`Expected array at ${path || 'root'}, got ${typeof obj}`);
        return false;
      }
      
      // If schema array is empty, any array is valid
      if (schema.length === 0) {
        return true;
      }
      
      // If schema array has items, check that all obj items match the schema item
      const schemaItem = schema[0];
      
      // Empty arrays are valid
      if (obj.length === 0) {
        return true;
      }
      
      // Check each item in the array
      for (let i = 0; i < obj.length; i++) {
        const itemPath = `${path}[${i}]`;
        
        if (!this.validateObjectStructure(obj[i], schemaItem, itemPath)) {
          return false;
        }
      }
      
      return true;
    }
    
    // If schema is an object, check that obj is an object
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      this.logWarning(`Expected object at ${path || 'root'}, got ${typeof obj}`);
      return false;
    }
    
    // Check each property in the schema
    for (const [key, value] of Object.entries(schema)) {
      const propPath = path ? `${path}.${key}` : key;
      
      // If property doesn't exist in obj, it's invalid
      if (!(key in obj)) {
        this.logWarning(`Missing property ${propPath}`);
        return false;
      }
      
      // Recursively validate the property
      if (!this.validateObjectStructure(obj[key], value, propPath)) {
        return false;
      }
    }
    
    return true;
  }
}

// Export singleton instance
const ValidationServiceInstance = new ValidationService();
export default ValidationServiceInstance;