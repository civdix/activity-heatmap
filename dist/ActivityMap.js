import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { defaultAdapters } from './adapters.js';
const platformLabels = {
    leetcode: 'LeetCode',
    github: 'GitHub',
    codeforces: 'Codeforces',
    geeksforgeeks: 'GeeksforGeeks'
};
const platformColors = {
    leetcode: '#f0a52b',
    github: '#3fb950',
    codeforces: '#4d9de0',
    geeksforgeeks: '#2fa36b'
};
const allPlatforms = ['leetcode', 'github', 'codeforces', 'geeksforgeeks'];
const dateKey = (date) => date.toISOString().slice(0, 10);
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const makeMonths = (year) => monthNames.map((label, month) => {
    const firstDay = new Date(Date.UTC(year, month, 1));
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const days = Array.from({ length: firstDay.getUTCDay() }, () => null);
    for (let day = 1; day <= daysInMonth; day += 1) {
        days.push(dateKey(new Date(Date.UTC(year, month, day))));
    }
    return { label, days };
});
const defaultStyles = {
    root: { color: '#e8eef5', background: '#111820', border: '1px solid #293541', borderRadius: 12, padding: 20, fontFamily: 'ui-sans-serif, system-ui, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' },
    title: { margin: 0, fontSize: 20, letterSpacing: 0 },
    subtitle: { color: '#8fa0ad', fontSize: 13, margin: '5px 0 0' },
    controls: { display: 'flex', flexWrap: 'wrap', gap: 8 },
    toggle: { alignItems: 'center', background: '#18222c', border: '1px solid #334351', borderRadius: 6, color: '#cbd6df', cursor: 'pointer', display: 'inline-flex', fontSize: 12, gap: 7, padding: '7px 9px' },
    reload: { alignItems: 'center', background: 'transparent', border: 0, borderRadius: 4, color: '#8fa0ad', cursor: 'pointer', display: 'inline-flex', fontSize: 16, height: 28, justifyContent: 'center', marginLeft: -4, padding: 0, width: 28 },
    gridWrap: { marginTop: 24, overflowX: 'auto', paddingBottom: 4 },
    grid: { display: 'grid', gridAutoFlow: 'column', gridTemplateRows: 'repeat(7, 13px)', gap: 3, minWidth: 700 },
    month: { background: '#151f28', border: '1px solid #263541', borderRadius: 8, minWidth: 190, padding: 12 },
    monthTitle: { color: '#e8eef5', fontSize: 13, fontWeight: 600, margin: '0 0 10px' },
    weekdays: { color: '#71818d', display: 'grid', fontSize: 10, gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 5, textAlign: 'center' },
    weekday: { fontSize: 10 },
    monthGrid: { display: 'grid', gap: 4, gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' },
    cell: { borderRadius: 2, height: 13, width: 13 },
    legend: { alignItems: 'center', color: '#8fa0ad', display: 'flex', fontSize: 11, gap: 5, justifyContent: 'flex-end', marginTop: 13 },
    dot: { borderRadius: 2, display: 'inline-block', height: 11, width: 11 },
    status: { color: '#8fa0ad', fontSize: 12, marginTop: 14, minHeight: 18 }
};
const defaultColors = {
    leetcode: platformColors.leetcode,
    github: platformColors.github,
    codeforces: platformColors.codeforces,
    geeksforgeeks: platformColors.geeksforgeeks,
    empty: '#1c2831',
    low: '#387d57',
    high: '#72d39a'
};
export function ActivityMap({ usernames, initialPlatforms = Object.keys(usernames), adapters = {}, year = new Date().getFullYear(), className, style, styles = {}, colors = {}, title = 'Coding activity', showLegend = true }) {
    const usernameKey = allPlatforms.map((platform) => `${platform}:${usernames[platform] ?? ''}`).join('|');
    const availablePlatforms = useMemo(() => allPlatforms.filter((platform) => Boolean(usernames[platform]?.trim())), [usernameKey]);
    const [selected, setSelected] = useState(initialPlatforms.filter((platform) => allPlatforms.includes(platform) && Boolean(usernames[platform]?.trim())));
    const [activityByPlatform, setActivityByPlatform] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reloadNonce, setReloadNonce] = useState(0);
    const usernamesRef = useRef(usernames);
    const adaptersRef = useRef(adapters);
    const reloadPlatformRef = useRef(null);
    usernamesRef.current = usernames;
    adaptersRef.current = adapters;
    const months = useMemo(() => makeMonths(year), [year]);
    const componentStyles = { ...defaultStyles, ...styles };
    const componentColors = { ...defaultColors, ...colors };
    useEffect(() => {
        const controller = new AbortController();
        const activePlatforms = selected.filter((platform) => availablePlatforms.includes(platform));
        const requestedPlatform = reloadPlatformRef.current;
        reloadPlatformRef.current = null;
        const platformsToFetch = requestedPlatform && availablePlatforms.includes(requestedPlatform) ? [requestedPlatform] : activePlatforms;
        setLoading(true);
        setError(null);
        Promise.all(platformsToFetch.map(async (platform) => {
            const adapter = adaptersRef.current[platform] ?? defaultAdapters[platform];
            const days = await adapter.fetchActivity(usernamesRef.current[platform], controller.signal, year);
            return { platform, days };
        }))
            .then((results) => setActivityByPlatform((current) => {
            const next = { ...current };
            for (const result of results)
                next[result.platform] = result.days;
            return next;
        }))
            .catch((reason) => {
            if (reason.name !== 'AbortError')
                setError(reason instanceof Error ? reason.message : 'Unable to load activity');
        })
            .finally(() => setLoading(false));
        return () => controller.abort();
    }, [availablePlatforms, reloadNonce, selected, usernameKey, year]);
    const counts = useMemo(() => {
        const merged = new Map();
        for (const platform of selected) {
            for (const item of activityByPlatform[platform] ?? []) {
                const current = merged.get(item.date) ?? { count: 0, platforms: {} };
                current.count += item.count;
                current.platforms[platform] = (current.platforms[platform] ?? 0) + (item.platforms?.[platform] ?? item.count);
                merged.set(item.date, current);
            }
        }
        return merged;
    }, [activityByPlatform, selected]);
    const maxCount = Math.max(1, ...[...counts.values()].map((item) => item.count));
    const toggle = (platform) => setSelected((current) => current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform]);
    const reload = (platform) => {
        reloadPlatformRef.current = platform;
        setReloadNonce((current) => current + 1);
    };
    return (_jsxs("section", { className: className, style: { ...componentStyles.root, ...style }, "aria-label": `${title} activity map`, children: [_jsxs("div", { style: componentStyles.header, children: [_jsxs("div", { children: [_jsx("h2", { style: componentStyles.title, children: title }), _jsxs("p", { style: componentStyles.subtitle, children: [year, " \u00B7 ", selected.length, " platform", selected.length === 1 ? '' : 's'] })] }), _jsx("div", { style: componentStyles.controls, role: "group", "aria-label": "Activity platforms", children: availablePlatforms.map((platform) => {
                            const active = selected.includes(platform);
                            return _jsxs("span", { style: { display: 'inline-flex', alignItems: 'center' }, children: [_jsxs("button", { type: "button", "aria-pressed": active, onClick: () => toggle(platform), style: { ...componentStyles.toggle, borderColor: active ? componentColors[platform] : '#334351', color: active ? '#fff' : '#9aabb8' }, children: [_jsx("span", { "aria-hidden": "true", style: { ...componentStyles.dot, background: active ? componentColors[platform] : '#53616c' } }), platformLabels[platform]] }), _jsx("button", { type: "button", "aria-label": `Reload ${platformLabels[platform]} activity`, title: `Reload ${platformLabels[platform]} activity`, onClick: () => reload(platform), style: componentStyles.reload, children: "\u21BB" })] }, platform);
                        }) })] }), _jsx("div", { style: componentStyles.gridWrap, children: _jsx("div", { style: { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }, role: "grid", "aria-label": `${year} monthly activity`, children: months.map((month) => _jsxs("section", { style: componentStyles.month, "aria-label": `${month.label} ${year}`, children: [_jsx("h3", { style: componentStyles.monthTitle, children: month.label }), _jsx("div", { style: componentStyles.weekdays, "aria-hidden": "true", children: ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((weekday, index) => _jsx("span", { style: componentStyles.weekday, children: weekday }, `${weekday}-${index}`)) }), _jsx("div", { style: componentStyles.monthGrid, children: month.days.map((day, index) => {
                                    const item = day ? counts.get(day) : undefined;
                                    const intensity = item ? Math.min(1, item.count / maxCount) : 0;
                                    return _jsx("div", { role: day ? 'gridcell' : undefined, "aria-hidden": !day, title: day ? `${day}: ${item?.count ?? 0} activities` : undefined, style: { ...componentStyles.cell, height: 'auto', minHeight: 22, width: 'auto', background: day ? item ? `color-mix(in srgb, ${componentColors.high} ${Math.round(25 + intensity * 75)}%, ${componentColors.empty})` : componentColors.empty : 'transparent' } }, `${month.label}-${index}`);
                                }) })] }, month.label)) }) }), showLegend && _jsxs("div", { style: componentStyles.legend, children: [_jsx("span", { children: "Less" }), _jsx("i", { style: { ...componentStyles.dot, background: componentColors.empty } }), _jsx("i", { style: { ...componentStyles.dot, background: componentColors.low } }), _jsx("i", { style: { ...componentStyles.dot, background: componentColors.high } }), _jsx("span", { children: "More" })] }), _jsx("div", { style: componentStyles.status, "aria-live": "polite", children: loading ? 'Loading activity...' : error ? error : selected.length === 0 ? 'Select a platform to begin.' : `${[...counts.values()].reduce((total, item) => total + item.count, 0)} activities combined` })] }));
}
