import { useEffect, useMemo, useRef, useState } from 'react';
import { defaultAdapters } from './adapters.js';
import type { ActivityDay, ActivityMapColors, ActivityMapProps, ActivityMapStyles, Platform } from './types.js';

const platformLabels: Record<Platform, string> = {
  leetcode: 'LeetCode',
  github: 'GitHub',
  codeforces: 'Codeforces',
  geeksforgeeks: 'GeeksforGeeks'
};

const platformColors: Record<Platform, string> = {
  leetcode: '#f0a52b',
  github: '#3fb950',
  codeforces: '#4d9de0',
  geeksforgeeks: '#2fa36b'
};

const allPlatforms: Platform[] = ['leetcode', 'github', 'codeforces', 'geeksforgeeks'];

const dateKey = (date: Date) => date.toISOString().slice(0, 10);

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const makeMonths = (year: number) => monthNames.map((label, month) => {
  const firstDay = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const days: Array<string | null> = Array.from({ length: firstDay.getUTCDay() }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(dateKey(new Date(Date.UTC(year, month, day))));
  }
  return { label, days };
});

const defaultStyles: Required<ActivityMapStyles> = {
  root: { color: '#e8eef5', background: '#111820', border: '1px solid #293541', borderRadius: 12, padding: 20, fontFamily: 'ui-sans-serif, system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' as const },
  title: { margin: 0, fontSize: 20, letterSpacing: 0 },
  subtitle: { color: '#8fa0ad', fontSize: 13, margin: '5px 0 0' },
  controls: { display: 'flex', flexWrap: 'wrap' as const, gap: 8 },
  toggle: { alignItems: 'center', background: '#18222c', border: '1px solid #334351', borderRadius: 6, color: '#cbd6df', cursor: 'pointer', display: 'inline-flex', fontSize: 12, gap: 7, padding: '7px 9px' },
  reload: { alignItems: 'center', background: 'transparent', border: 0, borderRadius: 4, color: '#8fa0ad', cursor: 'pointer', display: 'inline-flex', fontSize: 16, height: 28, justifyContent: 'center', marginLeft: -4, padding: 0, width: 28 },
  gridWrap: { marginTop: 24, overflowX: 'auto' as const, paddingBottom: 4 },
  grid: { display: 'grid', gridAutoFlow: 'column' as const, gridTemplateRows: 'repeat(7, 13px)', gap: 3, minWidth: 700 },
  month: { background: '#151f28', border: '1px solid #263541', borderRadius: 8, minWidth: 190, padding: 12 },
  monthTitle: { color: '#e8eef5', fontSize: 13, fontWeight: 600, margin: '0 0 10px' },
  weekdays: { color: '#71818d', display: 'grid', fontSize: 10, gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 5, textAlign: 'center' as const },
  weekday: { fontSize: 10 },
  monthGrid: { display: 'grid', gap: 4, gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' },
  cell: { borderRadius: 2, height: 13, width: 13 },
  legend: { alignItems: 'center', color: '#8fa0ad', display: 'flex', fontSize: 11, gap: 5, justifyContent: 'flex-end', marginTop: 13 },
  dot: { borderRadius: 2, display: 'inline-block', height: 11, width: 11 },
  status: { color: '#8fa0ad', fontSize: 12, marginTop: 14, minHeight: 18 }
};

const defaultColors: Required<ActivityMapColors> = {
  leetcode: platformColors.leetcode,
  github: platformColors.github,
  codeforces: platformColors.codeforces,
  geeksforgeeks: platformColors.geeksforgeeks,
  empty: '#1c2831',
  low: '#387d57',
  high: '#72d39a'
};

export function ActivityMap({
  usernames,
  initialPlatforms = Object.keys(usernames) as Platform[],
  adapters = {},
  year = new Date().getFullYear(),
  className,
  style,
  styles = {},
  colors = {},
  title = 'Coding activity',
  showLegend = true
}: ActivityMapProps) {
  const usernameKey = allPlatforms.map((platform) => `${platform}:${usernames[platform] ?? ''}`).join('|');
  const availablePlatforms = useMemo(() => allPlatforms.filter((platform) => Boolean(usernames[platform]?.trim())), [usernameKey]);
  const [selected, setSelected] = useState<Platform[]>(initialPlatforms.filter((platform) => allPlatforms.includes(platform) && Boolean(usernames[platform]?.trim())));
  const [activityByPlatform, setActivityByPlatform] = useState<Partial<Record<Platform, ActivityDay[]>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const usernamesRef = useRef(usernames);
  const adaptersRef = useRef(adapters);
  const reloadPlatformRef = useRef<Platform | null>(null);
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
      const days = await adapter.fetchActivity(usernamesRef.current[platform]!, controller.signal, year);
      return { platform, days };
    }))
      .then((results) => setActivityByPlatform((current) => {
        const next = { ...current };
        for (const result of results) next[result.platform] = result.days;
        return next;
      }))
      .catch((reason: unknown) => {
        if ((reason as Error).name !== 'AbortError') setError(reason instanceof Error ? reason.message : 'Unable to load activity');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [availablePlatforms, reloadNonce, selected, usernameKey, year]);

  const counts = useMemo(() => {
    const merged = new Map<string, { count: number; platforms: Partial<Record<Platform, number>> }>();
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
  const toggle = (platform: Platform) => setSelected((current) => current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform]);
  const reload = (platform: Platform) => {
    reloadPlatformRef.current = platform;
    setReloadNonce((current) => current + 1);
  };

  return (
    <section className={className} style={{ ...componentStyles.root, ...style }} aria-label={`${title} activity map`}>
      <div style={componentStyles.header}>
        <div>
          <h2 style={componentStyles.title}>{title}</h2>
          <p style={componentStyles.subtitle}>{year} · {selected.length} platform{selected.length === 1 ? '' : 's'}</p>
        </div>
        <div style={componentStyles.controls} role="group" aria-label="Activity platforms">
          {availablePlatforms.map((platform) => {
            const active = selected.includes(platform);
            return <span key={platform} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <button type="button" aria-pressed={active} onClick={() => toggle(platform)} style={{ ...componentStyles.toggle, borderColor: active ? componentColors[platform] : '#334351', color: active ? '#fff' : '#9aabb8' }}>
                <span aria-hidden="true" style={{ ...componentStyles.dot, background: active ? componentColors[platform] : '#53616c' }} />
                {platformLabels[platform]}
              </button>
              <button type="button" aria-label={`Reload ${platformLabels[platform]} activity`} title={`Reload ${platformLabels[platform]} activity`} onClick={() => reload(platform)} style={componentStyles.reload}>
                &#x21bb;
              </button>
            </span>;
          })}
        </div>
      </div>
      <div style={componentStyles.gridWrap}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }} role="grid" aria-label={`${year} monthly activity`}>
          {months.map((month) => <section key={month.label} style={componentStyles.month} aria-label={`${month.label} ${year}`}>
            <h3 style={componentStyles.monthTitle}>{month.label}</h3>
            <div style={componentStyles.weekdays} aria-hidden="true">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((weekday, index) => <span key={`${weekday}-${index}`} style={componentStyles.weekday}>{weekday}</span>)}</div>
            <div style={componentStyles.monthGrid}>
              {month.days.map((day, index) => {
                const item = day ? counts.get(day) : undefined;
                const intensity = item ? Math.min(1, item.count / maxCount) : 0;
                return <div key={`${month.label}-${index}`} role={day ? 'gridcell' : undefined} aria-hidden={!day} title={day ? `${day}: ${item?.count ?? 0} activities` : undefined} style={{ ...componentStyles.cell, height: 'auto', minHeight: 22, width: 'auto', background: day ? item ? `color-mix(in srgb, ${componentColors.high} ${Math.round(25 + intensity * 75)}%, ${componentColors.empty})` : componentColors.empty : 'transparent' }} />;
              })}
            </div>
          </section>)}
        </div>
      </div>
      {showLegend && <div style={componentStyles.legend}><span>Less</span><i style={{ ...componentStyles.dot, background: componentColors.empty }} /><i style={{ ...componentStyles.dot, background: componentColors.low }} /><i style={{ ...componentStyles.dot, background: componentColors.high }} /><span>More</span></div>}
      <div style={componentStyles.status} aria-live="polite">{loading ? 'Loading activity...' : error ? error : selected.length === 0 ? 'Select a platform to begin.' : `${[...counts.values()].reduce((total, item) => total + item.count, 0)} activities combined`}</div>
    </section>
  );
}