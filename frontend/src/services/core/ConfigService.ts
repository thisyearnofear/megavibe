/**
 * ConfigService.ts
 * 
 * Service for managing application configuration with support for:
 * - Environment-specific configurations
 * - Remote config loading
 * - Feature flags for A/B testing
 * - Configuration change notifications
 * - Local overrides for development
 */

import { BaseService, ServiceResponse, ErrorCode } from './BaseService';
import StorageService, { StorageType } from './StorageService';
import APIService from './APIService';
import { EventEmitter } from 'events';

// Configuration environment
export enum ConfigEnvironment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production'
}

// Feature flag status
export enum FeatureStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  PERCENTAGE = 'percentage' // Enabled for a percentage of users
}

// Feature assignment map
export interface FeatureAssignments {
  [featureId: string]: boolean;
}

// Feature flag configuration
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  status: FeatureStatus;
  percentage?: number; // Used when status is PERCENTAGE
  dependencies?: string[]; // Other feature flags this depends on
  userGroups?: string[]; // User groups this applies to
  startDate?: string; // When the feature should start being active
  endDate?: string; // When the feature should stop being active
  metadata?: Record<string, any>; // Additional metadata
}

// Chain configuration
export interface ChainConfig {
  id: number;
  name: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isTestnet: boolean;
  contractAddresses: Record<string, string>;
}

// API configuration
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  websocket?: {
    url: string;
    reconnectInterval: number;
    maxReconnectAttempts: number;
  };
}

// Full application configuration
export interface AppConfig {
  environment: ConfigEnvironment;
  version: string;
  buildId?: string;
  api: ApiConfig;
  chains: ChainConfig[];
  features: Record<string, FeatureFlag>;
  settings: {
    defaultChainId: number;
    defaultLanguage: string;
    defaultCurrency: string;
    defaultTheme: 'light' | 'dark' | 'system';
    tipAmounts: number[];
    maxFileSize: number;
    cacheExpiry: number;
    notificationDuration: number;
  };
  services: {
    ipfsGateway: string;
    decentralizedStorage: string;
    analyticsEndpoint?: string;
  };
  urls: Record<string, string>;
  constants: Record<string, any>;
}

// Configuration update options
export interface ConfigUpdateOptions {
  merge?: boolean; // Merge with existing config or replace
  persist?: boolean; // Save to storage
  emitEvent?: boolean; // Emit change event
}

// Configuration listener type
export type ConfigChangeListener = (
  path: string, 
  newValue: any, 
  oldValue: any
) => void;

// Default configuration
const DEFAULT_CONFIG: AppConfig = {
  environment: 
    import.meta.env.VITE_ENVIRONMENT === 'production' 
      ? ConfigEnvironment.PRODUCTION 
      : import.meta.env.VITE_ENVIRONMENT === 'staging'
        ? ConfigEnvironment.STAGING
        : ConfigEnvironment.DEVELOPMENT,
  version: import.meta.env.VITE_APP_VERSION || '0.1.0',
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'https://api.megavibe.app',
    timeout: 30000,
    retries: 3,
    websocket: {
      url: import.meta.env.VITE_WS_URL || 'wss://api.megavibe.app/ws',
      reconnectInterval: 5000,
      maxReconnectAttempts: 5
    }
  },
  chains: [
    // Ethereum Mainnet
    {
      id: 1,
      name: 'Ethereum',
      rpcUrl: `https://mainnet.infura.io/v3/${import.meta.env.VITE_INFURA_KEY || ''}`,
      blockExplorerUrl: 'https://etherscan.io',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18
      },
      isTestnet: false,
      contractAddresses: {
        TippingContract: '0x0000000000000000000000000000000000000000',
        ReputationContract: '0x0000000000000000000000000000000000000000',
        USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
      }
    },
    // Sepolia Testnet
    {
      id: 11155111,
      name: 'Sepolia',
      rpcUrl: `https://sepolia.infura.io/v3/${import.meta.env.VITE_INFURA_KEY || ''}`,
      blockExplorerUrl: 'https://sepolia.etherscan.io',
      nativeCurrency: {
        name: 'Sepolia Ether',
        symbol: 'ETH',
        decimals: 18
      },
      isTestnet: true,
      contractAddresses: {
        TippingContract: '0x0000000000000000000000000000000000000000',
        ReputationContract: '0x0000000000000000000000000000000000000000',
        USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
      }
    }
  ],
  features: {
    crossChainTipping: {
      id: 'crossChainTipping',
      name: 'Cross-Chain Tipping',
      description: 'Allow tipping across different blockchains',
      status: FeatureStatus.ENABLED
    },
    bounties: {
      id: 'bounties',
      name: 'Bounties',
      description: 'Allow creating and fulfilling bounties',
      status: FeatureStatus.ENABLED
    },
    reputationSystem: {
      id: 'reputationSystem',
      name: 'Reputation System',
      description: 'Enable multi-dimensional reputation scoring',
      status: FeatureStatus.ENABLED
    },
    nftTickets: {
      id: 'nftTickets',
      name: 'NFT Tickets',
      description: 'Enable NFT-based event tickets',
      status: FeatureStatus.DISABLED
    },
    web3Social: {
      id: 'web3Social',
      name: 'Web3 Social Integration',
      description: 'Integration with decentralized social platforms',
      status: FeatureStatus.PERCENTAGE,
      percentage: 25
    }
  },
  settings: {
    defaultChainId: 11155111, // Sepolia Testnet
    defaultLanguage: 'en',
    defaultCurrency: 'USD',
    defaultTheme: 'system',
    tipAmounts: [5, 10, 20, 50, 100],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
    notificationDuration: 5000 // 5 seconds
  },
  services: {
    ipfsGateway: 'https://ipfs.io/ipfs/',
    decentralizedStorage: 'https://api.megavibe.app/ipfs'
  },
  urls: {
    termsOfService: 'https://megavibe.app/terms',
    privacyPolicy: 'https://megavibe.app/privacy',
    support: 'https://support.megavibe.app',
    documentation: 'https://docs.megavibe.app'
  },
  constants: {
    maxRetries: 3,
    minTipAmount: 1,
    maxTipAmount: 1000,
    tipDefaultMessage: 'Great talk!',
    maxTipMessageLength: 280
  }
};

export class ConfigService extends BaseService {
  private config: AppConfig;
  private readonly eventEmitter: EventEmitter;
  private readonly storageKey: string = 'app_config';
  private readonly featureAssignmentsKey: string = 'feature_assignments';
  private readonly devOverridesKey: string = 'dev_config_overrides';
  private userId: string | null = null;
  private userGroups: string[] = [];
  private isRemoteConfigLoaded: boolean = false;
  private featureAssignmentsCache: FeatureAssignments = {};
  
  constructor() {
    super('ConfigService');
    
    this.config = { ...DEFAULT_CONFIG };
    this.eventEmitter = new EventEmitter();
    
    // Load locally stored config if available
    this.loadLocalConfig();
  }

  /**
   * Initialize the config service with user information
   */
  public async initialize(userId?: string, userGroups?: string[]): Promise<ServiceResponse<boolean>> {
    return this.executeOperation(async () => {
      // Set user info
      this.userId = userId || null;
      this.userGroups = userGroups || [];
      
      // Load remote config
      if (userId) {
        await this.loadRemoteConfig();
      }
      
      // Load feature assignments
      await this.loadFeatureAssignments();
      
      // Load developer overrides in development environment
      if (this.config.environment === ConfigEnvironment.DEVELOPMENT) {
        await this.loadDevOverrides();
      }
      
      this.logInfo('ConfigService initialized');
      return true;
    }, 'Failed to initialize ConfigService');
  }

  /**
   * Get the entire configuration
   */
  public getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Get a specific configuration value by path
   */
  public get<T>(path: string, defaultValue?: T): T {
    try {
      const value = this.getValueByPath(this.config, path);
      return value !== undefined ? value as T : (defaultValue as T);
    } catch (error) {
      this.logWarning(`Config path not found: ${path}`, error);
      return defaultValue as T;
    }
  }

  /**
   * Check if a feature is enabled
   */
  public isFeatureEnabled(featureId: string): boolean {
    const feature = this.config.features[featureId];
    
    if (!feature) {
      this.logWarning(`Feature not found: ${featureId}`);
      return false;
    }
    
    // Check dependencies first
    if (feature.dependencies && feature.dependencies.length > 0) {
      for (const dependencyId of feature.dependencies) {
        if (!this.isFeatureEnabled(dependencyId)) {
          return false;
        }
      }
    }
    
    // Check dates
    const now = new Date();
    if (feature.startDate && new Date(feature.startDate) > now) {
      return false;
    }
    if (feature.endDate && new Date(feature.endDate) < now) {
      return false;
    }
    
    // Check user groups
    if (feature.userGroups && feature.userGroups.length > 0) {
      if (!this.userGroups.some(group => feature.userGroups!.includes(group))) {
        return false;
      }
    }
    
    switch (feature.status) {
      case FeatureStatus.ENABLED:
        return true;
        
      case FeatureStatus.DISABLED:
        return false;
        
      case FeatureStatus.PERCENTAGE:
        // Check if user has a stored assignment
        const assignments = this.getFeatureAssignments();
        if (assignments[featureId] !== undefined) {
          return assignments[featureId];
        }
        
        // Assign based on percentage
        if (!this.userId || !feature.percentage) {
          return false;
        }
        
        // Deterministic assignment based on user ID and feature ID
        const hash = this.hashString(`${this.userId}-${featureId}`);
        const assignment = (hash % 100) < feature.percentage;
        
        // Store assignment for consistency
        this.setFeatureAssignment(featureId, assignment);
        
        return assignment;
        
      default:
        return false;
    }
  }

  /**
   * Update configuration values
   */
  public async updateConfig(
    updates: Partial<AppConfig>,
    options: ConfigUpdateOptions = { merge: true, persist: true, emitEvent: true }
  ): Promise<ServiceResponse<boolean>> {
    return this.executeOperation(async () => {
      const oldConfig = { ...this.config };
      
      // Apply updates
      if (options.merge) {
        this.config = this.deepMerge(this.config, updates);
      } else {
        this.config = { ...DEFAULT_CONFIG, ...updates };
      }
      
      // Emit events for changed paths
      if (options.emitEvent) {
        this.emitChangeEvents(oldConfig, this.config);
      }
      
      // Persist to storage
      if (options.persist) {
        await this.saveConfig();
      }
      
      this.logInfo('Configuration updated');
      return true;
    }, 'Failed to update configuration');
  }

  /**
   * Set a configuration value by path
   */
  public async set<T>(
    path: string, 
    value: T,
    options: ConfigUpdateOptions = { persist: true, emitEvent: true }
  ): Promise<ServiceResponse<boolean>> {
    return this.executeOperation(async () => {
      const oldValue = this.get(path);
      
      // Set value
      this.setValueByPath(this.config, path, value);
      
      // Emit change event
      if (options.emitEvent) {
        this.eventEmitter.emit('configChanged', path, value, oldValue);
      }
      
      // Persist to storage
      if (options.persist) {
        await this.saveConfig();
      }
      
      this.logInfo(`Configuration value set: ${path}`);
      return true;
    }, `Failed to set configuration value: ${path}`);
  }

  /**
   * Override a configuration value for development
   */
  public async setDevOverride<T>(path: string, value: T): Promise<ServiceResponse<boolean>> {
    if (this.config.environment !== ConfigEnvironment.DEVELOPMENT) {
      this.logWarning('Developer overrides are only available in development environment');
      return this.success(false);
    }
    
    return this.executeOperation(async () => {
      // Get current overrides
      const response = await StorageService.getItem<Record<string, any>>(
        this.devOverridesKey,
        { type: StorageType.LOCAL }
      );
      
      const overrides = response.success ? response.data || {} : {};
      
      // Set override
      this.setValueByPath(overrides, path, value);
      
      // Save overrides
      await StorageService.setItem(
        this.devOverridesKey,
        overrides,
        { type: StorageType.LOCAL }
      );
      
      // Apply override
      this.setValueByPath(this.config, path, value);
      
      this.logInfo(`Development override set: ${path}`);
      return true;
    }, `Failed to set development override: ${path}`);
  }

  /**
   * Clear a development override
   */
  public async clearDevOverride(path: string): Promise<ServiceResponse<boolean>> {
    if (this.config.environment !== ConfigEnvironment.DEVELOPMENT) {
      this.logWarning('Developer overrides are only available in development environment');
      return this.success(false);
    }
    
    return this.executeOperation(async () => {
      // Get current overrides
      const response = await StorageService.getItem<Record<string, any>>(
        this.devOverridesKey,
        { type: StorageType.LOCAL }
      );
      
      if (!response.success) {
        return false;
      }
      
      const overrides = response.data || {};
      
      // Remove override
      this.deleteValueByPath(overrides, path);
      
      // Save overrides
      await StorageService.setItem(
        this.devOverridesKey,
        overrides,
        { type: StorageType.LOCAL }
      );
      
      // Reset to default value
      const pathParts = path.split('.');
      const key = pathParts.pop() as string;
      const parentPath = pathParts.join('.');
      const defaultParent = this.getValueByPath(DEFAULT_CONFIG, parentPath);
      
      if (defaultParent && typeof defaultParent === 'object') {
        this.setValueByPath(this.config, path, (defaultParent as any)[key]);
      }
      
      this.logInfo(`Development override cleared: ${path}`);
      return true;
    }, `Failed to clear development override: ${path}`);
  }

  /**
   * Reset configuration to defaults
   */
  public async resetToDefaults(): Promise<ServiceResponse<boolean>> {
    return this.executeOperation(async () => {
      const oldConfig = { ...this.config };
      this.config = { ...DEFAULT_CONFIG };
      
      // Emit events for changed paths
      this.emitChangeEvents(oldConfig, this.config);
      
      // Clear stored config
      await StorageService.removeItem(this.storageKey, { type: StorageType.LOCAL });
      
      // Clear feature assignments
      await StorageService.removeItem(this.featureAssignmentsKey, { type: StorageType.LOCAL });
      
      // Clear dev overrides
      if (this.config.environment === ConfigEnvironment.DEVELOPMENT) {
        await StorageService.removeItem(this.devOverridesKey, { type: StorageType.LOCAL });
      }
      
      this.logInfo('Configuration reset to defaults');
      return true;
    }, 'Failed to reset configuration');
  }

  /**
   * Subscribe to configuration changes
   */
  public subscribe(path: string, listener: ConfigChangeListener): () => void {
    const handler = (changedPath: string, newValue: any, oldValue: any) => {
      if (changedPath === path || changedPath.startsWith(`${path}.`) || path === '*') {
        listener(changedPath, newValue, oldValue);
      }
    };
    
    this.eventEmitter.on('configChanged', handler);
    
    // Return unsubscribe function
    return () => {
      this.eventEmitter.off('configChanged', handler);
    };
  }

  /**
   * Get chain configuration by ID
   */
  public getChainConfig(chainId: number): ChainConfig | undefined {
    return this.config.chains.find(chain => chain.id === chainId);
  }

  /**
   * Get contract address for a specific chain
   */
  public getContractAddress(contractName: string, chainId: number): string | undefined {
    const chain = this.getChainConfig(chainId);
    return chain?.contractAddresses[contractName];
  }

  /**
   * Get all feature flags
   */
  public getAllFeatures(): Record<string, FeatureFlag> {
    return { ...this.config.features };
  }

  /**
   * Load configuration from remote server
   */
  private async loadRemoteConfig(): Promise<void> {
    try {
      if (!this.userId) {
        this.logWarning('Cannot load remote config without user ID');
        return;
      }
      
      this.logInfo('Loading remote configuration...');
      
      const response = await APIService.get<Partial<AppConfig>>(
        '/api/config',
        { userId: this.userId }
      );
      
      if (response.success && response.data) {
        // Merge remote config with local config
        this.config = this.deepMerge(this.config, response.data);
        this.isRemoteConfigLoaded = true;
        
        // Save merged config
        await this.saveConfig();
        
        this.logInfo('Remote configuration loaded and merged');
      }
    } catch (error) {
      this.logError('Failed to load remote configuration', error);
    }
  }

  /**
   * Load configuration from local storage
   */
  private async loadLocalConfig(): Promise<void> {
    try {
      const response = await StorageService.getItem<AppConfig>(
        this.storageKey,
        { type: StorageType.LOCAL }
      );
      
      if (response.success && response.data) {
        // Merge stored config with default config
        this.config = this.deepMerge(DEFAULT_CONFIG, response.data);
        this.logInfo('Local configuration loaded');
      }
    } catch (error) {
      this.logWarning('Failed to load local configuration, using defaults', error);
    }
  }

  /**
   * Save configuration to local storage
   */
  private async saveConfig(): Promise<void> {
    try {
      await StorageService.setItem(
        this.storageKey,
        this.config,
        { type: StorageType.LOCAL }
      );
      
      this.logInfo('Configuration saved to local storage');
    } catch (error) {
      this.logError('Failed to save configuration', error);
    }
  }

  /**
   * Load feature assignments from local storage
   */
  private async loadFeatureAssignments(): Promise<void> {
    try {
      const response = await StorageService.getItem<FeatureAssignments>(
        this.featureAssignmentsKey,
        { type: StorageType.LOCAL }
      );
      
      if (!response.success || !response.data) {
        return;
      }
      
      // Store assignments in cache
      this.featureAssignmentsCache = response.data;
      this.logInfo('Feature assignments loaded');
    } catch (error) {
      this.logWarning('Failed to load feature assignments', error);
    }
  }

  /**
   * Get feature assignments from cache
   */
  private getFeatureAssignments(): FeatureAssignments {
    return this.featureAssignmentsCache;
  }

  /**
   * Set a feature assignment
   */
  private async setFeatureAssignment(featureId: string, enabled: boolean): Promise<void> {
    try {
      const response = await StorageService.getItem<Record<string, boolean>>(
        this.featureAssignmentsKey,
        { type: StorageType.LOCAL }
      );
      
      const assignments = response.success && response.data ? response.data : {};
      assignments[featureId] = enabled;
      
      await StorageService.setItem(
        this.featureAssignmentsKey,
        assignments,
        { type: StorageType.LOCAL }
      );
    } catch (error) {
      this.logWarning(`Failed to set feature assignment for ${featureId}`, error);
    }
  }

  /**
   * Load developer overrides from local storage
   */
  private async loadDevOverrides(): Promise<void> {
    try {
      const response = await StorageService.getItem<Record<string, any>>(
        this.devOverridesKey,
        { type: StorageType.LOCAL }
      );
      
      if (!response.success || !response.data) {
        return;
      }
      
      // Apply overrides
      Object.entries(this.flattenObject(response.data)).forEach(([path, value]) => {
        this.setValueByPath(this.config, path, value);
      });
      
      this.logInfo('Developer overrides applied');
    } catch (error) {
      this.logWarning('Failed to load developer overrides', error);
    }
  }

  /**
   * Emit change events for all changed paths
   */
  private emitChangeEvents(oldObj: any, newObj: any, basePath: string = ''): void {
    const oldFlat = this.flattenObject(oldObj, basePath);
    const newFlat = this.flattenObject(newObj, basePath);
    
    // Find changed or added paths
    Object.entries(newFlat).forEach(([path, value]) => {
      if (!Object.prototype.hasOwnProperty.call(oldFlat, path) || oldFlat[path] !== value) {
        this.eventEmitter.emit('configChanged', path, value, oldFlat[path]);
      }
    });
    
    // Find removed paths
    Object.keys(oldFlat).forEach(path => {
      if (!Object.prototype.hasOwnProperty.call(newFlat, path)) {
        this.eventEmitter.emit('configChanged', path, undefined, oldFlat[path]);
      }
    });
  }

  /**
   * Flatten an object into path/value pairs
   */
  private flattenObject(obj: any, basePath: string = ''): Record<string, any> {
    const result: Record<string, any> = {};
    
    if (!obj || typeof obj !== 'object') {
      return result;
    }
    
    Object.entries(obj).forEach(([key, value]) => {
      const path = basePath ? `${basePath}.${key}` : key;
      
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, this.flattenObject(value, path));
      } else {
        result[path] = value;
      }
    });
    
    return result;
  }

  /**
   * Get a value from an object by path
   */
  private getValueByPath(obj: any, path: string): any {
    if (!path) return obj;
    
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }
      
      current = current[part];
    }
    
    return current;
  }

  /**
   * Set a value in an object by path
   */
  private setValueByPath(obj: any, path: string, value: any): void {
    if (!path) return;
    
    const parts = path.split('.');
    const lastPart = parts.pop()!;
    let current = obj;
    
    for (const part of parts) {
      if (current[part] === undefined || current[part] === null) {
        current[part] = {};
      }
      
      current = current[part];
    }
    
    current[lastPart] = value;
  }

  /**
   * Delete a value from an object by path
   */
  private deleteValueByPath(obj: any, path: string): void {
    if (!path) return;
    
    const parts = path.split('.');
    const lastPart = parts.pop()!;
    let current = obj;
    
    for (const part of parts) {
      if (current[part] === undefined || current[part] === null) {
        return;
      }
      
      current = current[part];
    }
    
    delete current[lastPart];
  }

  /**
   * Deep merge two objects
   */
  private deepMerge<T extends Record<string, any>>(target: T, source: Record<string, any>): T {
    if (!source) return target;
    
    // Create a new object with target's properties
    const output = { ...target } as Record<string, any>;
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = this.deepMerge(
              target[key] as Record<string, any>,
              source[key]
            );
          }
        } else {
          output[key] = source[key];
        }
      });
    }
    
    return output as T;
  }

  /**
   * Check if a value is an object
   */
  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * Generate a hash from a string
   */
  private hashString(str: string): number {
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash);
  }
}

// Export singleton instance
export default new ConfigService();