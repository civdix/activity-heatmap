import type { CSSProperties } from 'react';
export type Platform = 'leetcode' | 'github' | 'codeforces' | 'geeksforgeeks';
export type ActivityDay = {
    date: string;
    count: number;
    platforms?: Partial<Record<Platform, number>>;
};
export type ActivityAdapter = {
    platform: Platform;
    fetchActivity: (username: string, signal?: AbortSignal, year?: number) => Promise<ActivityDay[]>;
};
export type ActivityMapStyles = Partial<{
    root: CSSProperties;
    header: CSSProperties;
    title: CSSProperties;
    subtitle: CSSProperties;
    controls: CSSProperties;
    toggle: CSSProperties;
    toggleActive: CSSProperties;
    toggleInactive: CSSProperties;
    reload: CSSProperties;
    gridWrap: CSSProperties;
    grid: CSSProperties;
    month: CSSProperties;
    monthTitle: CSSProperties;
    weekdays: CSSProperties;
    weekday: CSSProperties;
    monthGrid: CSSProperties;
    cell: CSSProperties;
    legend: CSSProperties;
    dot: CSSProperties;
    status: CSSProperties;
}>;
export type ActivityMapColors = Partial<{
    leetcode: string;
    github: string;
    codeforces: string;
    geeksforgeeks: string;
    empty: string;
    low: string;
    high: string;
}>;
export type ActivityMapProps = {
    usernames: Partial<Record<Platform, string>>;
    initialPlatforms?: Platform[];
    adapters?: Partial<Record<Platform, ActivityAdapter>>;
    year?: number;
    className?: string;
    style?: CSSProperties;
    styles?: ActivityMapStyles;
    colors?: ActivityMapColors;
    title?: string;
    showLegend?: boolean;
};
