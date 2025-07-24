/**
 * Type definitions for blockchain service layer
 */

// Transaction status
export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

// Base transaction information
export interface Transaction {
  hash: string;
  status: TransactionStatus;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  gasUsed?: string;
  blockNumber?: number;
}

// Transaction with typed data for specific contract interactions
export interface TypedTransaction<T> extends Transaction {
  type: string;
  data: T;
}

// Bounty creation transaction data
export interface BountyCreationData {
  eventId: string;
  speakerId: string;
  description: string;
  amount: string;
  deadline: number;
}

// Bounty claim transaction data
export interface BountyClaimData {
  bountyId: number;
  submissionHash: string;
}

// Tip transaction data
export interface TipData {
  recipientId: string;
  amount: string;
  message?: string;
}

// Bounty from contract with additional UI metadata
export interface Bounty {
  id: number;
  sponsor: string;
  reward: string;
  eventId: string;
  speakerId: string;
  description: string;
  deadline: number;
  claimed: boolean;
  claimant: string;
  submissionHash: string;
  createdAt: number;
  
  // UI metadata (not from contract)
  type: 'audience-to-performer' | 'performer-to-audience';
  title?: string;
  tags?: string[];
  timeLeft?: string; // Computed from deadline
  submissions?: number; // Number of submissions if this is a contest
}

// Platform statistics from contract
export interface PlatformStats {
  totalVolume: string;
  totalBounties: number;
  activeBounties: number;
  platformFees: string;
}

// Wallet information
export interface WalletInfo {
  address: string;
  chainId: number;
  balance: {
    mnt: string; // Native MNT balance
    formatted: string; // Formatted for display
  };
  isConnected: boolean;
  isSupported: boolean; // Whether current network is supported
}

// Provider type for different wallet connection strategies
export enum ProviderType {
  METAMASK = 'metamask',
  WALLET_CONNECT = 'walletconnect',
  COINBASE = 'coinbase',
  // Add more as needed
}

// Bounty Status enum
export enum BountyStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Bounty Type enum
export enum BountyType {
  AUDIENCE_TO_PERFORMER = 'audience-to-performer',
  PERFORMER_TO_AUDIENCE = 'performer-to-audience'
}

// Detailed Bounty interface for the new UI
export interface BountyDetails {
  id: string;
  title: string;
  description: string;
  amount: string;
  creator: string;
  deadline: number | null;
  status: BountyStatus;
  submissionsCount: number;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  type: BountyType;
  isCompleted: boolean;
  winningSubmissionId?: string;
}

// Bounty submission interface
export interface BountySubmission {
  bountyId: string;
  title: string;
  description: string;
  contentCID: string;
  submitter: string;
}

// Error types for blockchain interactions
export enum BlockchainErrorType {
  CONNECTION_ERROR = 'connection_error',
  TRANSACTION_ERROR = 'transaction_error',
  CONTRACT_ERROR = 'contract_error',
  USER_REJECTED = 'user_rejected',
  NETWORK_ERROR = 'network_error',
  UNKNOWN_ERROR = 'unknown_error',
}

// Structured error format for blockchain interactions
export interface BlockchainError {
  type: BlockchainErrorType;
  message: string;
  details?: unknown;
  userMessage?: string; // User-friendly message
}