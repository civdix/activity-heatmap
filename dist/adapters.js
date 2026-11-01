const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const normalize = (platform, values) => values
    .filter((item) => validDate(item.date) && Number.isFinite(item.count) && item.count > 0)
    .map((item) => ({
    date: item.date,
    count: Math.max(0, Math.round(item.count)),
    platforms: { ...item.platforms, [platform]: Math.max(0, Math.round(item.count)) }
}));
const platformLabels = {
    leetcode: 'LeetCode',
    github: 'GitHub',
    codeforces: 'Codeforces',
    geeksforgeeks: 'GeeksforGeeks'
};
export const createProxyAdapter = (platform, endpoint) => ({
    platform,
    async fetchActivity(username, signal, year) {
        const query = new URLSearchParams({ handle: username, ...(year ? { year: String(year) } : {}) });
        const response = await fetch(`${endpoint}${endpoint.includes('?') ? '&' : '?'}${query.toString()}`, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
            signal
        });
        if (!response.ok)
            throw new Error(`${platformLabels[platform]} proxy returned ${response.status}`);
        const payload = await response.json();
        if (!Array.isArray(payload))
            throw new Error(`${platformLabels[platform]} proxy must return an activity array`);
        return normalize(platform, payload);
    }
});
const github = {
    platform: 'github',
    async fetchActivity(username, signal) {
        const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}`, { signal });
        if (!response.ok)
            throw new Error(`GitHub returned ${response.status}`);
        const payload = (await response.json());
        return normalize('github', (payload.contributions ?? []).map((item) => ({ ...item })));
    }
};
const leetcode = {
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
        if (!response.ok)
            throw new Error(`LeetCode returned ${response.status}`);
        const payload = (await response.json());
        if (payload.errors?.length)
            throw new Error(payload.errors[0].message ?? 'LeetCode rejected the username');
        const rawCalendar = payload.data?.matchedUser?.userCalendar?.submissionCalendar ?? {};
        const calendar = typeof rawCalendar === 'string' ? JSON.parse(rawCalendar) : rawCalendar;
        return normalize('leetcode', Object.entries(calendar).map(([timestamp, count]) => ({
            date: new Date(Number(timestamp) * 1000).toISOString().slice(0, 10),
            count
        })));
    }
};
const codeforces = {
    platform: 'codeforces',
    async fetchActivity(username, signal) {
        const response = await fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(username)}&from=1&count=10000`, { signal });
        if (!response.ok)
            throw new Error(`Codeforces returned ${response.status}`);
        const payload = (await response.json());
        if (payload.status !== 'OK')
            throw new Error('Codeforces rejected the handle');
        const counts = new Map();
        for (const submission of payload.result ?? []) {
            const date = new Date(submission.creationTimeSeconds * 1000).toISOString().slice(0, 10);
            counts.set(date, (counts.get(date) ?? 0) + 1);
        }
        return normalize('codeforces', [...counts].map(([date, count]) => ({ date, count })));
    }
};
const geeksforgeeks = {
    platform: 'geeksforgeeks',
    async fetchActivity(username, signal, year = new Date().getFullYear()) {
        const response = await fetch('https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ handle: username, requestType: 'getYearwiseUserSubmissions', year: String(year), month: '' }),
            signal
        });
        if (!response.ok)
            throw new Error(`GeeksforGeeks returned ${response.status}`);
        const payload = (await response.json());
        const rawRecords = Array.isArray(payload) ? payload : payload.result ?? payload.data ?? payload.submissions ?? [];
        const records = Array.isArray(rawRecords)
            ? rawRecords
            : rawRecords && typeof rawRecords === 'object'
                ? Object.entries(rawRecords).map(([date, count]) => ({ date, count }))
                : [];
        return normalize('geeksforgeeks', records.map((record) => ({
            date: String(record.date ?? record.submissionDate ?? record.submittedAt ?? ''),
            count: Number(record.count ?? record.submissionCount ?? record.submissions ?? 1)
        })));
    }
};
export const defaultAdapters = {
    leetcode,
    github,
    codeforces,
    geeksforgeeks
};
