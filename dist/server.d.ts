import type { ActivityDay, Platform } from './types.js';
/** Fetch activity from a platform on the server, where third-party CORS rules do not apply. */
export declare const fetchPlatformActivity: (platform: Platform, username: string, year?: number, signal?: AbortSignal) => Promise<ActivityDay[]>;
