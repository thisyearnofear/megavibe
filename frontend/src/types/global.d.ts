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
  export function long(value: any): number;
  export function unsigned_long(value: any): number;
  export function double(value: any): number;
  export function DOMString(value: any): string;
  export function ByteString(value: any): string;
  export function USVString(value: any): string;
  export function boolean(value: any): boolean;
  export function byte(value: any): number;
  export function octet(value: any): number;
  export function short(value: any): number;
  export function unsigned_short(value: any): number;
  export function long_long(value: any): number;
  export function unsigned_long_long(value: any): number;
  export function float(value: any): number;
  export function unrestricted_double(value: any): number;
  export function unrestricted_float(value: any): number;
}

// WHATWG URL types
declare module 'whatwg-url' {
  export class URL {
    constructor(url: string, base?: string | URL);
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
    constructor(init?: string | string[][] | Record<string, string> | URLSearchParams);
    append(name: string, value: string): void;
    delete(name: string): void;
    get(name: string): string | null;
    getAll(name: string): string[];
    has(name: string): boolean;
    set(name: string, value: string): void;
    sort(): void;
    toString(): string;
    forEach(callback: (value: string, key: string, parent: URLSearchParams) => void): void;
    keys(): IterableIterator<string>;
    values(): IterableIterator<string>;
    entries(): IterableIterator<[string, string]>;
    [Symbol.iterator](): IterableIterator<[string, string]>;
  }

  export function parseURL(input: string, options?: { baseURL?: string }): any;
  export function serializeURL(url: any): string;
  export function serializeURLOrigin(url: any): string;
  export function basicURLParse(input: string, options?: any): any;
  export function setTheUsername(url: any, username: string): void;
  export function setThePassword(url: any, password: string): void;
  export function cannotHaveAUsernamePasswordPort(url: any): boolean;
  export function serializeInteger(integer: number): string;
  export function parseURLToResultingURLRecord(input: string, base?: any): any;
}

// Additional type augmentations for better TypeScript support
declare global {
  interface Window {
    // Add any global window properties you might use
    ethereum?: any;
    web3?: any;
  }
}

export {};