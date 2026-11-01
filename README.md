# coding-activity-map

An embeddable React component that combines activity from LeetCode, GitHub, Codeforces, and GeeksforGeeks into one year heatmap.

## Install

```bash
npm install coding-activity-map
```

## Usage

```tsx
import { ActivityMap } from 'coding-activity-map';

export function Portfolio() {
  return (
    <ActivityMap
      usernames={{ github: 'octocat', leetcode: 'neal' }}
      initialPlatforms={['github', 'leetcode']}
      year={2025}
    />
  );
}
```

Only configured usernames are fetched. Visitors can toggle any configured platform on and off, or start with one platform by setting `initialPlatforms={['leetcode']}`.

## Custom styling

Use `style` for the outer element, or override individual internal slots with `styles`. Colors can be customized independently:

```tsx
<ActivityMap
  usernames={{ github: 'octocat' }}
  style={{ maxWidth: 900, margin: '0 auto' }}
  styles={{
    root: { background: '#fff', color: '#16202a', borderRadius: 4 },
    title: { fontFamily: 'Georgia, serif', fontSize: 24 },
    toggle: { borderRadius: 999 }
  }}
  colors={{ high: '#e85d75', low: '#f3a6b5', empty: '#f3f5f7', github: '#e85d75' }}
/>
```

Available style slots are `root`, `header`, `title`, `subtitle`, `controls`, `toggle`, `gridWrap`, `grid`, `cell`, `legend`, `dot`, and `status`.

## Custom adapters

LeetCode and GeeksforGeeks do not provide stable public browser APIs. Replace any default endpoint with an adapter that returns normalized days:

```tsx
const myAdapter = {
  platform: 'geeksforgeeks' as const,
  fetchActivity: async (username: string) => [
    { date: '2025-01-01', count: 3 }
  ]
};

<ActivityMap usernames={{ geeksforgeeks: 'your-handle' }} adapters={{ geeksforgeeks: myAdapter }} />
```

For production portfolios, proxy third-party requests through your own server to handle CORS, rate limits, and API changes.