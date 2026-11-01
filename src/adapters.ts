import type { ActivityAdapter, ActivityDay, Platform } from './types';

const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const normalize = (platform: Platform, values: ActivityDay[]): ActivityDay[] =>
  values
    .filter((item) => validDate(item.date) && Number.isFinite(item.count))
    .map((item) => ({
      date: item.date,
      count: Math.max(0, Math.round(item.count)),
      platforms: { ...item.platforms, [platform]: Math.max(0, Math.round(item.count)) }
    }));

const github: ActivityAdapter = {
  platform: 'github',
  async fetchActivity(username, signal) {
    const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}`, { signal });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    const payload = (await response.json()) as { contributions?: Array<{ date: string; count: number }> };
    return normalize('github', (payload.contributions ?? []).map((item) => ({ ...item })));
  }
};

const leetcode: ActivityAdapter = {
  platform: 'leetcode',
  async fetchActivity(username, signal, year) {
    const response = await fetch('https://leetcode.com/graphql/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query userProfileCalendar($username: String!, $year: Int) {
          matchedUser(username: $username) {
            userCalendar(year: $year) {
              submissionCalendar
            }
          }
        }`,
        variables: { username, ...(year ? { year } : {}) },
        operationName: 'userProfileCalendar'
      }),
      signal
    });
    if (!response.ok) throw new Error(`LeetCode returned ${response.status}`);
    const payload = (await response.json()) as {
      errors?: Array<{ message?: string }>;
      data?: { matchedUser?: { userCalendar?: { submissionCalendar?: string | Record<string, number> } } };
    };
    if (payload.errors?.length) throw new Error(payload.errors[0].message ?? 'LeetCode rejected the username');
    const rawCalendar = payload.data?.matchedUser?.userCalendar?.submissionCalendar ?? {};
    const calendar = typeof rawCalendar === 'string' ? JSON.parse(rawCalendar) as Record<string, number> : rawCalendar;
    return normalize('leetcode', Object.entries(calendar).map(([timestamp, count]) => ({
      date: new Date(Number(timestamp) * 1000).toISOString().slice(0, 10),
      count
    })));
  }
};

const codeforces: ActivityAdapter = {
  platform: 'codeforces',
  async fetchActivity(username, signal) {
    const response = await fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(username)}&from=1&count=10000`, { signal });
    if (!response.ok) throw new Error(`Codeforces returned ${response.status}`);
    const payload = (await response.json()) as { status: string; result?: Array<{ creationTimeSeconds: number }> };
    if (payload.status !== 'OK') throw new Error('Codeforces rejected the handle');
    const counts = new Map<string, number>();
    for (const submission of payload.result ?? []) {
      const date = new Date(submission.creationTimeSeconds * 1000).toISOString().slice(0, 10);
      counts.set(date, (counts.get(date) ?? 0) + 1);
    }
    return normalize('codeforces', [...counts].map(([date, count]) => ({ date, count })));
  }
};

const geeksforgeeks: ActivityAdapter = {
  platform: 'geeksforgeeks',
  async fetchActivity(username, signal, year = new Date().getFullYear()) {
    const response = await fetch('https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle: username, requestType: 'getYearwiseUserSubmissions', year: String(year), month: '' }),
      signal
    });
    if (!response.ok) throw new Error(`GeeksforGeeks returned ${response.status}`);
    const payload = (await response.json()) as {
      result?: unknown;
      data?: unknown;
      submissions?: unknown;
    };
    const records = (Array.isArray(payload) ? payload : payload.result ?? payload.data ?? payload.submissions ?? []) as Array<Record<string, unknown>>;
    return normalize('geeksforgeeks', records.map((record) => ({
      date: String(record.date ?? record.submissionDate ?? record.submittedAt ?? ''),
      count: Number(record.count ?? record.submissionCount ?? record.submissions ?? 1)
    })));
  }
};

export const defaultAdapters: Record<Platform, ActivityAdapter> = {
  leetcode,
  github,
  codeforces,
  geeksforgeeks
};