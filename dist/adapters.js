const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const normalize = (platform, values) => values
    .filter((item) => validDate(item.date) && Number.isFinite(item.count))
    .map((item) => ({
    date: item.date,
    count: Math.max(0, Math.round(item.count)),
    platforms: { ...item.platforms, [platform]: Math.max(0, Math.round(item.count)) }
}));
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
    async fetchActivity(username, signal) {
        const response = await fetch(`https://alfa-leetcode-api.onrender.com/user/${encodeURIComponent(username)}/calendar`, { signal });
        if (!response.ok)
            throw new Error(`LeetCode returned ${response.status}`);
        const payload = (await response.json());
        return normalize('leetcode', Object.entries(payload.submissionCalendar ?? {}).map(([timestamp, count]) => ({
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
    async fetchActivity(username, signal) {
        const response = await fetch(`https://gfg-stats-api.vercel.app/${encodeURIComponent(username)}`, { signal });
        if (!response.ok)
            throw new Error(`GeeksforGeeks returned ${response.status}`);
        const payload = (await response.json());
        return normalize('geeksforgeeks', payload.activity ?? []);
    }
};
export const defaultAdapters = {
    leetcode,
    github,
    codeforces,
    geeksforgeeks
};
