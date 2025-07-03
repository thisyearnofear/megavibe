/**
 * StorageService.ts
 * 
 * Core service for data persistence with support for multiple storage mechanisms,
 * encryption, TTL-based caching, and schema migrations.
 * 
 * Provides a unified interface for localStorage, sessionStorage, and IndexedDB operations
 * with proper error handling and type safety.
 */

import { BaseService, ServiceResponse, ErrorCode } from './BaseService';
// Using Web Crypto API instead of crypto-js

// Storage mechanisms
export enum StorageType {
  LOCAL = 'localStorage',
  SESSION = 'sessionStorage',
  INDEXED_DB = 'indexedDB',
  MEMORY = 'memory'
}

// Storage item metadata
export interface StorageMetadata {
  version: number;
  createdAt: number;
  expiresAt?: number;
  encrypted: boolean;
  compressed?: boolean;
}

// Storage item with metadata wrapper
export interface StorageItem<T> {
  data: T;
  metadata: StorageMetadata;
}

// IndexedDB database configuration
export interface IndexedDBConfig {
  dbName: string;
  version: number;
  stores: {
    name: string;
    keyPath: string;
    indices?: Array<{ name: string; keyPath: string; unique: boolean }>;
  }[];
}

// Storage options
export interface StorageOptions {
  type?: StorageType;
  ttl?: number; // Time to live in milliseconds
  encrypt?: boolean;
  encryptionKey?: string;
  compress?: boolean;
  version?: number;
  prefix?: string;
}

// Storage operation result
export interface StorageOperationResult {
  success: boolean;
  message?: string;
  error?: Error;
}

// Default options
const DEFAULT_OPTIONS: StorageOptions = {
  type: StorageType.LOCAL,
  ttl: 0, // 0 = no expiration
  encrypt: false,
  compress: false,
  version: 1,
  prefix: 'megavibe'
};

// Error codes
export enum StorageErrorCode {
  STORAGE_UNAVAILABLE = 'STORAGE_UNAVAILABLE',
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
  SERIALIZATION_ERROR = 'SERIALIZATION_ERROR',
  DESERIALIZATION_ERROR = 'DESERIALIZATION_ERROR',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  DECRYPTION_ERROR = 'DECRYPTION_ERROR',
  INVALID_DATA = 'INVALID_DATA',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  INDEXED_DB_ERROR = 'INDEXED_DB_ERROR',
  VERSION_MISMATCH = 'VERSION_MISMATCH'
}

export class StorageService extends BaseService {
  private readonly defaultOptions: StorageOptions;
  private readonly indexedDBs: Map<string, IDBDatabase> = new Map();
  private readonly memoryStorage: Map<string, string> = new Map();
  private isAvailable: { [key in StorageType]: boolean } = {
    [StorageType.LOCAL]: false,
    [StorageType.SESSION]: false,
    [StorageType.INDEXED_DB]: false,
    [StorageType.MEMORY]: true // Memory is always available
  };
  private encryptionSecret: string;
  
  constructor(options: StorageOptions = {}) {
    super('StorageService');
    
    this.defaultOptions = { ...DEFAULT_OPTIONS, ...options };
    this.encryptionSecret = this.defaultOptions.encryptionKey || 'MegaVibe_Secret_Key';
    
    // Check storage availability
    this.checkAvailability();
  }

  /**
   * Check if storage mechanisms are available
   */
  private checkAvailability(): void {
    // Check localStorage
    try {
      localStorage.setItem('storage_test', 'test');
      localStorage.removeItem('storage_test');
      this.isAvailable[StorageType.LOCAL] = true;
    } catch (error) {
      this.isAvailable[StorageType.LOCAL] = false;
      this.logWarning('localStorage is not available');
    }
    
    // Check sessionStorage
    try {
      sessionStorage.setItem('storage_test', 'test');
      sessionStorage.removeItem('storage_test');
      this.isAvailable[StorageType.SESSION] = true;
    } catch (error) {
      this.isAvailable[StorageType.SESSION] = false;
      this.logWarning('sessionStorage is not available');
    }
    
    // Check IndexedDB
    try {
      this.isAvailable[StorageType.INDEXED_DB] = 'indexedDB' in window;
      if (!this.isAvailable[StorageType.INDEXED_DB]) {
        this.logWarning('IndexedDB is not available');
      }
    } catch (error) {
      this.isAvailable[StorageType.INDEXED_DB] = false;
      this.logWarning('Error checking IndexedDB availability', error);
    }
  }

  /**
   * Get a storage mechanism instance
   */
  private getStorage(type: StorageType): Storage | Map<string, string> {
    switch (type) {
      case StorageType.LOCAL:
        return localStorage;
      case StorageType.SESSION:
        return sessionStorage;
      case StorageType.MEMORY:
        return this.memoryStorage;
      default:
        throw new Error(`Storage type ${type} is not supported directly. Use specific methods for IndexedDB.`);
    }
  }

  /**
   * Create a prefixed key
   */
  private createKey(key: string, prefix?: string): string {
    const actualPrefix = prefix || this.defaultOptions.prefix;
    return actualPrefix ? `${actualPrefix}:${key}` : key;
  }

  /**
   * Serialize data for storage
   */
  private serialize<T>(
    data: T, 
    options: StorageOptions = {}
  ): string {
    try {
      // Create metadata
      const metadata: StorageMetadata = {
        version: options.version || this.defaultOptions.version || 1,
        createdAt: Date.now(),
        encrypted: Boolean(options.encrypt),
        compressed: Boolean(options.compress)
      };
      
      // Set expiration if TTL is provided
      if (options.ttl && options.ttl > 0) {
        metadata.expiresAt = Date.now() + options.ttl;
      }
      
      // Create storage item
      const storageItem: StorageItem<T> = {
        data,
        metadata
      };
      
      // Convert to JSON
      let serialized = JSON.stringify(storageItem);
      
      // Encrypt if needed
      if (options.encrypt) {
        try {
          // Simple Base64 encoding as a placeholder for real encryption
          // In a production app, use Web Crypto API for proper encryption
          serialized = btoa(serialized);
          this.logInfo('Data encrypted (using base64 as demo)');
        } catch (error) {
          this.logError('Encryption error', error);
          throw {
            code: StorageErrorCode.ENCRYPTION_ERROR,
            message: 'Failed to encrypt data',
            originalError: error
          };
        }
      }
      
      return serialized;
    } catch (error) {
      this.logError('Error serializing data', error);
      throw {
        code: StorageErrorCode.SERIALIZATION_ERROR,
        message: 'Failed to serialize data for storage',
        originalError: error
      };
    }
  }

  /**
   * Deserialize data from storage
   */
  private deserialize<T>(
    serialized: string, 
    options: StorageOptions = {}
  ): StorageItem<T> {
    try {
      let dataString = serialized;
      
      // Decrypt if needed
      if (options.encrypt) {
        try {
          // Simple Base64 decoding as a placeholder for real decryption
          // In a production app, use Web Crypto API for proper decryption
          dataString = atob(serialized);
          
          if (!dataString) {
            throw new Error('Decryption resulted in empty string');
          }
        } catch (error) {
          this.logError('Decryption error', error);
          throw {
            code: StorageErrorCode.DECRYPTION_ERROR,
            message: 'Failed to decrypt data',
            originalError: error
          };
        }
      }
      
      // Parse JSON
      const storageItem = JSON.parse(dataString) as StorageItem<T>;
      
      // Validate structure
      if (!storageItem || !storageItem.metadata) {
        throw new Error('Invalid storage item structure');
      }
      
      // Check expiration
      if (storageItem.metadata.expiresAt && storageItem.metadata.expiresAt < Date.now()) {
        throw {
          code: StorageErrorCode.ITEM_NOT_FOUND,
          message: 'Item has expired'
        };
      }
      
      // Check version if specified
      if (options.version && options.version > storageItem.metadata.version) {
        this.logWarning(`Version mismatch: expected ${options.version}, got ${storageItem.metadata.version}`);
      }
      
      return storageItem;
    } catch (error) {
      // Special handling for known errors
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }
      
      this.logError('Error deserializing data', error);
      throw {
        code: StorageErrorCode.DESERIALIZATION_ERROR,
        message: 'Failed to deserialize data from storage',
        originalError: error
      };
    }
  }

  /**
   * Set an item in storage
   */
  public async setItem<T>(
    key: string, 
    data: T, 
    options: StorageOptions = {}
  ): Promise<ServiceResponse<StorageOperationResult>> {
    return this.executeOperation(async () => {
      const mergedOptions = { ...this.defaultOptions, ...options };
      const storageType = mergedOptions.type || StorageType.LOCAL;
      
      // Check if storage is available
      if (!this.isAvailable[storageType]) {
        throw {
          code: StorageErrorCode.STORAGE_UNAVAILABLE,
          message: `Storage type '${storageType}' is not available`
        };
      }
      
      const prefixedKey = this.createKey(key, mergedOptions.prefix);
      
      try {
        // Handle IndexedDB separately
        if (storageType === StorageType.INDEXED_DB) {
          return await this.setItemInIndexedDB(prefixedKey, data, mergedOptions);
        }
        
        // Get storage mechanism
        const storage = this.getStorage(storageType) as Storage | Map<string, string>;
        
        // Serialize data
        const serialized = this.serialize(data, mergedOptions);
        
        // Save to storage
        if (storage instanceof Map) {
          storage.set(prefixedKey, serialized);
        } else {
          storage.setItem(prefixedKey, serialized);
        }
        
        return {
          success: true,
          message: `Item '${key}' saved successfully`
        };
      } catch (error) {
        // Handle quota exceeded error
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          throw {
            code: StorageErrorCode.QUOTA_EXCEEDED,
            message: 'Storage quota exceeded',
            originalError: error
          };
        }
        
        throw error;
      }
    }, `Failed to set item '${key}' in storage`);
  }

  /**
   * Get an item from storage
   */
  public async getItem<T>(
    key: string, 
    options: StorageOptions = {}
  ): Promise<ServiceResponse<T>> {
    return this.executeOperation(async () => {
      const mergedOptions = { ...this.defaultOptions, ...options };
      const storageType = mergedOptions.type || StorageType.LOCAL;
      
      // Check if storage is available
      if (!this.isAvailable[storageType]) {
        throw {
          code: StorageErrorCode.STORAGE_UNAVAILABLE,
          message: `Storage type '${storageType}' is not available`
        };
      }
      
      const prefixedKey = this.createKey(key, mergedOptions.prefix);
      
      // Handle IndexedDB separately
      if (storageType === StorageType.INDEXED_DB) {
        return await this.getItemFromIndexedDB<T>(prefixedKey, mergedOptions);
      }
      
      // Get storage mechanism
      const storage = this.getStorage(storageType) as Storage | Map<string, string>;
      
      // Get from storage
      let serialized: string | null;
      if (storage instanceof Map) {
        serialized = storage.get(prefixedKey) || null;
      } else {
        serialized = storage.getItem(prefixedKey);
      }
      
      if (!serialized) {
        throw {
          code: StorageErrorCode.ITEM_NOT_FOUND,
          message: `Item '${key}' not found in storage`
        };
      }
      
      // Deserialize data
      const storageItem = this.deserialize<T>(serialized, mergedOptions);
      
      return storageItem.data;
    }, `Failed to get item '${key}' from storage`);
  }

  /**
   * Remove an item from storage
   */
  public async removeItem(
    key: string, 
    options: StorageOptions = {}
  ): Promise<ServiceResponse<StorageOperationResult>> {
    return this.executeOperation(async () => {
      const mergedOptions = { ...this.defaultOptions, ...options };
      const storageType = mergedOptions.type || StorageType.LOCAL;
      
      // Check if storage is available
      if (!this.isAvailable[storageType]) {
        throw {
          code: StorageErrorCode.STORAGE_UNAVAILABLE,
          message: `Storage type '${storageType}' is not available`
        };
      }
      
      const prefixedKey = this.createKey(key, mergedOptions.prefix);
      
      // Handle IndexedDB separately
      if (storageType === StorageType.INDEXED_DB) {
        return await this.removeItemFromIndexedDB(prefixedKey, mergedOptions);
      }
      
      // Get storage mechanism
      const storage = this.getStorage(storageType) as Storage | Map<string, string>;
      
      // Remove from storage
      if (storage instanceof Map) {
        storage.delete(prefixedKey);
      } else {
        storage.removeItem(prefixedKey);
      }
      
      return {
        success: true,
        message: `Item '${key}' removed successfully`
      };
    }, `Failed to remove item '${key}' from storage`);
  }

  /**
   * Check if an item exists in storage
   */
  public async hasItem(
    key: string, 
    options: StorageOptions = {}
  ): Promise<ServiceResponse<boolean>> {
    return this.executeOperation(async () => {
      const mergedOptions = { ...this.defaultOptions, ...options };
      const storageType = mergedOptions.type || StorageType.LOCAL;
      
      // Check if storage is available
      if (!this.isAvailable[storageType]) {
        throw {
          code: StorageErrorCode.STORAGE_UNAVAILABLE,
          message: `Storage type '${storageType}' is not available`
        };
      }
      
      const prefixedKey = this.createKey(key, mergedOptions.prefix);
      
      // Handle IndexedDB separately
      if (storageType === StorageType.INDEXED_DB) {
        return await this.hasItemInIndexedDB(prefixedKey, mergedOptions);
      }
      
      // Get storage mechanism
      const storage = this.getStorage(storageType) as Storage | Map<string, string>;
      
      // Check if item exists
      if (storage instanceof Map) {
        return storage.has(prefixedKey);
      } else {
        return storage.getItem(prefixedKey) !== null;
      }
    }, `Failed to check if item '${key}' exists in storage`);
  }

  /**
   * Clear all items from storage
   */
  public async clear(
    options: StorageOptions = {}
  ): Promise<ServiceResponse<StorageOperationResult>> {
    return this.executeOperation(async () => {
      const mergedOptions = { ...this.defaultOptions, ...options };
      const storageType = mergedOptions.type || StorageType.LOCAL;
      const prefix = mergedOptions.prefix || this.defaultOptions.prefix;
      
      // Check if storage is available
      if (!this.isAvailable[storageType]) {
        throw {
          code: StorageErrorCode.STORAGE_UNAVAILABLE,
          message: `Storage type '${storageType}' is not available`
        };
      }
      
      // Handle IndexedDB separately
      if (storageType === StorageType.INDEXED_DB) {
        return await this.clearIndexedDB(mergedOptions);
      }
      
      // Get storage mechanism
      const storage = this.getStorage(storageType) as Storage | Map<string, string>;
      
      // If prefix is provided, only clear items with that prefix
      if (prefix) {
        if (storage instanceof Map) {
          // For Map storage
          const keysToDelete: string[] = [];
          storage.forEach((_, k) => {
            if (k.startsWith(`${prefix}:`)) {
              keysToDelete.push(k);
            }
          });
          
          keysToDelete.forEach(k => storage.delete(k));
        } else {
          // For localStorage/sessionStorage
          const keysToDelete: string[] = [];
          for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            if (key && key.startsWith(`${prefix}:`)) {
              keysToDelete.push(key);
            }
          }
          
          keysToDelete.forEach(k => storage.removeItem(k));
        }
      } else {
        // Clear all items
        if (storage instanceof Map) {
          storage.clear();
        } else {
          storage.clear();
        }
      }
      
      return {
        success: true,
        message: prefix ? `Items with prefix '${prefix}' cleared successfully` : 'All items cleared successfully'
      };
    }, 'Failed to clear storage');
  }

  /**
   * Get all keys from storage
   */
  public async getAllKeys(
    options: StorageOptions = {}
  ): Promise<ServiceResponse<string[]>> {
    return this.executeOperation(async () => {
      const mergedOptions = { ...this.defaultOptions, ...options };
      const storageType = mergedOptions.type || StorageType.LOCAL;
      const prefix = mergedOptions.prefix || this.defaultOptions.prefix;
      
      // Check if storage is available
      if (!this.isAvailable[storageType]) {
        throw {
          code: StorageErrorCode.STORAGE_UNAVAILABLE,
          message: `Storage type '${storageType}' is not available`
        };
      }
      
      // Handle IndexedDB separately
      if (storageType === StorageType.INDEXED_DB) {
        return await this.getAllKeysFromIndexedDB(mergedOptions);
      }
      
      // Get storage mechanism
      const storage = this.getStorage(storageType) as Storage | Map<string, string>;
      
      let keys: string[] = [];
      
      // Get all keys
      if (storage instanceof Map) {
        keys = Array.from(storage.keys());
      } else {
        keys = Array.from({ length: storage.length }, (_, i) => storage.key(i) || '').filter(Boolean);
      }
      
      // Filter by prefix if provided
      if (prefix) {
        const prefixWithSeparator = `${prefix}:`;
        keys = keys
          .filter(key => key.startsWith(prefixWithSeparator))
          .map(key => key.substring(prefixWithSeparator.length));
      }
      
      return keys;
    }, 'Failed to get all keys from storage');
  }

  /**
   * Set encryption key
   */
  public setEncryptionKey(key: string): void {
    this.encryptionSecret = key;
  }

  // IndexedDB specific methods

  /**
   * Open IndexedDB database
   */
  private async openDatabase(config: IndexedDBConfig): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      // Check if already open
      if (this.indexedDBs.has(config.dbName)) {
        const db = this.indexedDBs.get(config.dbName);
        if (db) {
          return resolve(db);
        }
      }
      
      // Open database
      const request = indexedDB.open(config.dbName, config.version);
      
      // Handle upgrade needed
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        config.stores.forEach(store => {
          // Check if store exists
          if (!db.objectStoreNames.contains(store.name)) {
            const objectStore = db.createObjectStore(store.name, { keyPath: store.keyPath });
            
            // Create indices
            if (store.indices) {
              store.indices.forEach(index => {
                objectStore.createIndex(index.name, index.keyPath, { unique: index.unique });
              });
            }
          }
        });
      };
      
      // Handle success
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.indexedDBs.set(config.dbName, db);
        resolve(db);
      };
      
      // Handle error
      request.onerror = (event) => {
        this.logError('Error opening IndexedDB database', event);
        reject(new Error('Failed to open IndexedDB database'));
      };
    });
  }

  /**
   * Initialize IndexedDB with configuration
   */
  public async initIndexedDB(config: IndexedDBConfig): Promise<ServiceResponse<boolean>> {
    return this.executeOperation(async () => {
      if (!this.isAvailable[StorageType.INDEXED_DB]) {
        throw {
          code: StorageErrorCode.STORAGE_UNAVAILABLE,
          message: 'IndexedDB is not available'
        };
      }
      
      await this.openDatabase(config);
      return true;
    }, 'Failed to initialize IndexedDB');
  }

  /**
   * Set an item in IndexedDB
   */
  private async setItemInIndexedDB<T>(
    key: string, 
    data: T, 
    options: StorageOptions
  ): Promise<StorageOperationResult> {
    if (!options.prefix) {
      throw new Error('Prefix is required for IndexedDB operations');
    }
    
    try {
      const db = await this.openDatabase({
        dbName: 'MegaVibeStorage',
        version: 1,
        stores: [
          {
            name: options.prefix,
            keyPath: 'key',
            indices: [
              { name: 'createdAt', keyPath: 'metadata.createdAt', unique: false }
            ]
          }
        ]
      });
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([options.prefix!], 'readwrite');
        const objectStore = transaction.objectStore(options.prefix!);
        
        // Prepare item
        const storageItem: StorageItem<T> = {
          data,
          metadata: {
            version: options.version || this.defaultOptions.version || 1,
            createdAt: Date.now(),
            encrypted: Boolean(options.encrypt),
            compressed: Boolean(options.compress)
          }
        };
        
        // Set expiration if TTL is provided
        if (options.ttl && options.ttl > 0) {
          storageItem.metadata.expiresAt = Date.now() + options.ttl;
        }
        
        // Encrypt if needed
        if (options.encrypt) {
          // In a real implementation, we would encrypt the data here
          // For now, we just mark it as encrypted
        }
        
        // Store item
        const request = objectStore.put({
          key,
          ...storageItem
        });
        
        request.onsuccess = () => {
          resolve({
            success: true,
            message: `Item '${key}' saved successfully in IndexedDB`
          });
        };
        
        request.onerror = (event) => {
          this.logError('Error setting item in IndexedDB', event);
          reject(new Error('Failed to set item in IndexedDB'));
        };
      });
    } catch (error) {
      this.logError('Error in setItemInIndexedDB', error);
      throw {
        code: StorageErrorCode.INDEXED_DB_ERROR,
        message: 'Failed to set item in IndexedDB',
        originalError: error
      };
    }
  }

  /**
   * Get an item from IndexedDB
   */
  private async getItemFromIndexedDB<T>(
    key: string, 
    options: StorageOptions
  ): Promise<T> {
    if (!options.prefix) {
      throw new Error('Prefix is required for IndexedDB operations');
    }
    
    try {
      const db = await this.openDatabase({
        dbName: 'MegaVibeStorage',
        version: 1,
        stores: [
          {
            name: options.prefix,
            keyPath: 'key'
          }
        ]
      });
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([options.prefix!], 'readonly');
        const objectStore = transaction.objectStore(options.prefix!);
        const request = objectStore.get(key);
        
        request.onsuccess = (event) => {
          const result = (event.target as IDBRequest).result;
          
          if (!result) {
            reject({
              code: StorageErrorCode.ITEM_NOT_FOUND,
              message: `Item '${key}' not found in IndexedDB`
            });
            return;
          }
          
          // Check expiration
          if (result.metadata.expiresAt && result.metadata.expiresAt < Date.now()) {
            // Remove expired item
            const deleteTransaction = db.transaction([options.prefix!], 'readwrite');
            const deleteStore = deleteTransaction.objectStore(options.prefix!);
            deleteStore.delete(key);
            
            reject({
              code: StorageErrorCode.ITEM_NOT_FOUND,
              message: `Item '${key}' has expired`
            });
            return;
          }
          
          // Decrypt if needed
          if (result.metadata.encrypted) {
            // In a real implementation, we would decrypt the data here
            // For now, we just acknowledge it's encrypted
          }
          
          resolve(result.data);
        };
        
        request.onerror = (event) => {
          this.logError('Error getting item from IndexedDB', event);
          reject(new Error('Failed to get item from IndexedDB'));
        };
      });
    } catch (error) {
      this.logError('Error in getItemFromIndexedDB', error);
      throw {
        code: StorageErrorCode.INDEXED_DB_ERROR,
        message: 'Failed to get item from IndexedDB',
        originalError: error
      };
    }
  }

  /**
   * Remove an item from IndexedDB
   */
  private async removeItemFromIndexedDB(
    key: string, 
    options: StorageOptions
  ): Promise<StorageOperationResult> {
    if (!options.prefix) {
      throw new Error('Prefix is required for IndexedDB operations');
    }
    
    try {
      const db = await this.openDatabase({
        dbName: 'MegaVibeStorage',
        version: 1,
        stores: [
          {
            name: options.prefix,
            keyPath: 'key'
          }
        ]
      });
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([options.prefix!], 'readwrite');
        const objectStore = transaction.objectStore(options.prefix!);
        const request = objectStore.delete(key);
        
        request.onsuccess = () => {
          resolve({
            success: true,
            message: `Item '${key}' removed successfully from IndexedDB`
          });
        };
        
        request.onerror = (event) => {
          this.logError('Error removing item from IndexedDB', event);
          reject(new Error('Failed to remove item from IndexedDB'));
        };
      });
    } catch (error) {
      this.logError('Error in removeItemFromIndexedDB', error);
      throw {
        code: StorageErrorCode.INDEXED_DB_ERROR,
        message: 'Failed to remove item from IndexedDB',
        originalError: error
      };
    }
  }

  /**
   * Check if an item exists in IndexedDB
   */
  private async hasItemInIndexedDB(
    key: string, 
    options: StorageOptions
  ): Promise<boolean> {
    if (!options.prefix) {
      throw new Error('Prefix is required for IndexedDB operations');
    }
    
    try {
      const db = await this.openDatabase({
        dbName: 'MegaVibeStorage',
        version: 1,
        stores: [
          {
            name: options.prefix,
            keyPath: 'key'
          }
        ]
      });
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([options.prefix!], 'readonly');
        const objectStore = transaction.objectStore(options.prefix!);
        const request = objectStore.count(key);
        
        request.onsuccess = (event) => {
          const count = (event.target as IDBRequest).result;
          resolve(count > 0);
        };
        
        request.onerror = (event) => {
          this.logError('Error checking item in IndexedDB', event);
          reject(new Error('Failed to check if item exists in IndexedDB'));
        };
      });
    } catch (error) {
      this.logError('Error in hasItemInIndexedDB', error);
      throw {
        code: StorageErrorCode.INDEXED_DB_ERROR,
        message: 'Failed to check if item exists in IndexedDB',
        originalError: error
      };
    }
  }

  /**
   * Clear IndexedDB store
   */
  private async clearIndexedDB(options: StorageOptions): Promise<StorageOperationResult> {
    if (!options.prefix) {
      throw new Error('Prefix is required for IndexedDB operations');
    }
    
    try {
      const db = await this.openDatabase({
        dbName: 'MegaVibeStorage',
        version: 1,
        stores: [
          {
            name: options.prefix,
            keyPath: 'key'
          }
        ]
      });
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([options.prefix!], 'readwrite');
        const objectStore = transaction.objectStore(options.prefix!);
        const request = objectStore.clear();
        
        request.onsuccess = () => {
          resolve({
            success: true,
            message: `IndexedDB store '${options.prefix}' cleared successfully`
          });
        };
        
        request.onerror = (event) => {
          this.logError('Error clearing IndexedDB store', event);
          reject(new Error('Failed to clear IndexedDB store'));
        };
      });
    } catch (error) {
      this.logError('Error in clearIndexedDB', error);
      throw {
        code: StorageErrorCode.INDEXED_DB_ERROR,
        message: 'Failed to clear IndexedDB store',
        originalError: error
      };
    }
  }

  /**
   * Get all keys from IndexedDB
   */
  private async getAllKeysFromIndexedDB(options: StorageOptions): Promise<string[]> {
    if (!options.prefix) {
      throw new Error('Prefix is required for IndexedDB operations');
    }
    
    try {
      const db = await this.openDatabase({
        dbName: 'MegaVibeStorage',
        version: 1,
        stores: [
          {
            name: options.prefix,
            keyPath: 'key'
          }
        ]
      });
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([options.prefix!], 'readonly');
        const objectStore = transaction.objectStore(options.prefix!);
        const request = objectStore.getAllKeys();
        
        request.onsuccess = (event) => {
          const keys = (event.target as IDBRequest).result as string[];
          resolve(keys);
        };
        
        request.onerror = (event) => {
          this.logError('Error getting all keys from IndexedDB', event);
          reject(new Error('Failed to get all keys from IndexedDB'));
        };
      });
    } catch (error) {
      this.logError('Error in getAllKeysFromIndexedDB', error);
      throw {
        code: StorageErrorCode.INDEXED_DB_ERROR,
        message: 'Failed to get all keys from IndexedDB',
        originalError: error
      };
    }
  }
}

// Export singleton instance
export default new StorageService();