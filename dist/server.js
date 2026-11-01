import { defaultAdapters } from './adapters.js';
/** Fetch activity from a platform on the server, where third-party CORS rules do not apply. */
export const fetchPlatformActivity = (platform, username, year, signal) => defaultAdapters[platform].fetchActivity(username, signal, year);
