import type { ActivityAdapter, Platform } from './types';
export declare const createProxyAdapter: (platform: Platform, endpoint: string) => ActivityAdapter;
export declare const defaultAdapters: Record<Platform, ActivityAdapter>;
