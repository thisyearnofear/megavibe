// Global type declarations for missing type definitions

// Scheduler types (React internal)
declare module 'scheduler' {
  export function unstable_scheduleCallback(
    priorityLevel: number,
    callback: () => void,
    options?: { delay?: number }
  ): any;
  export function unstable_cancelCallback(callbackNode: any): void;
  export function unstable_shouldYield(): boolean;
  export function unstable_requestPaint(): void;
  export function unstable_now(): number;
  export function unstable_getCurrentPriorityLevel(): number;
  export function unstable_ImmediatePriority(): number;
  export function unstable_UserBlockingPriority(): number;
  export function unstable_NormalPriority(): number;
  export function unstable_LowPriority(): number;
  export function unstable_IdlePriority(): number;
}

// WebIDL Conversions types
declare module 'webidl-conversions' {
  export function long(_value: unknown): number;
  export function unsigned_long(_value: unknown): number;
  export function double(_value: unknown): number;
  export function DOMString(_value: unknown): string;
  export function ByteString(_value: unknown): string;
  export function USVString(_value: unknown): string;
  export function boolean(_value: unknown): boolean;
  export function byte(_value: unknown): number;
  export function octet(_value: unknown): number;
  export function short(_value: unknown): number;
  export function unsigned_short(_value: unknown): number;
  export function long_long(_value: unknown): number;
  export function unsigned_long_long(_value: unknown): number;
  export function float(_value: unknown): number;
  export function unrestricted_double(_value: unknown): number;
  export function unrestricted_float(_value: unknown): number;
}

// WHATWG URL types
declare module 'whatwg-url' {
  export class URL {
    constructor(_url: string, _base?: string | URL);
    href: string;
    origin: string;
    protocol: string;
    username: string;
    password: string;
    host: string;
    hostname: string;
    port: string;
    pathname: string;
    search: string;
    searchParams: URLSearchParams;
    hash: string;
    toString(): string;
    toJSON(): string;
  }

  export class URLSearchParams {
    constructor(_init?: string | string[][] | Record<string, string> | URLSearchParams);
    append(_name: string, _value: string): void;
    delete(_name: string): void;
    get(_name: string): string | null;
    getAll(_name: string): string[];
    has(_name: string): boolean;
    set(_name: string, _value: string): void;
    sort(): void;
    toString(): string;
    forEach(_callback: (value: string, key: string, parent: URLSearchParams) => void): void;
    keys(): IterableIterator<string>;
    values(): IterableIterator<string>;
    entries(): IterableIterator<[string, string]>;
    [Symbol.iterator](): IterableIterator<[string, string]>;
  }

  interface ParsedURL {
    scheme: string;
    username: string;
    password: string;
    host: string | null;
    port: number | null;
    path: string[];
    query: string | null;
    fragment: string | null;
  }

  export function parseURL(_input: string, _options?: { baseURL?: string }): ParsedURL | null;
  export function serializeURL(_url: ParsedURL): string;
  export function serializeURLOrigin(_url: ParsedURL): string;
  export function basicURLParse(_input: string, _options?: Record<string, unknown>): ParsedURL | null;
  export function setTheUsername(_url: ParsedURL, _username: string): void;
  export function setThePassword(_url: ParsedURL, _password: string): void;
  export function cannotHaveAUsernamePasswordPort(_url: ParsedURL): boolean;
  export function serializeInteger(_integer: number): string;
  export function parseURLToResultingURLRecord(_input: string, _base?: ParsedURL): ParsedURL | null;
}

// Ethereum provider types
interface EthereumProvider {
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isWalletConnect?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
}

// Additional type augmentations for better TypeScript support
declare global {
  interface Window {
    // Add any global window properties you might use
    ethereum?: EthereumProvider;
    web3?: unknown;
  }
}

export {};