# coding-activity-map

An embeddable React component that combines coding activity from LeetCode, GitHub, Codeforces, and GeeksforGeeks into one year heatmap.

Thank you for choosing `coding-activity-map`. You are welcome to improve the package, suggest ideas, report issues, and contribute changes so the project can benefit everyone.

## Features

- Supports one platform or any combination of the four supported platforms.
- Merges activity into one daily count while preserving each platform's contribution.
- Lets visitors toggle platforms on and off.
- Provides typed custom adapters for replacing any data source.
- Supports root styles, per-element styles, and custom colors through props.
- Works with React 18 or newer.

## Installation

From npm:

```bash
npm install coding-activity-map
```

From GitHub while the package is not published to npm:

```bash
npm install github:civdix/activity-heatmap
```

The package has React as a peer dependency, so your portfolio must already use React.

## API endpoint setup

Browser applications should use a same-origin API endpoint for activity requests. LeetCode and GeeksforGeeks may reject browser requests because of CORS, and a server-side route also keeps provider requests and caching under your control. This package does not create that route for you.

Create one endpoint per platform, or one dynamic endpoint, that accepts `handle` and `year` query parameters and returns an array of daily activity records:

```json
[
  { "date": "2025-01-01", "count": 3 },
  { "date": "2025-01-02", "count": 1 }
]
```

The endpoint should call `fetchPlatformActivity` from `coding-activity-map/server` on the server and return the result. A complete Next.js route example is included in [Same-origin proxy adapter](#same-origin-proxy-adapter).

## Basic usage

```tsx
import { ActivityMap, createProxyAdapter } from 'coding-activity-map';

const adapters = {
  github: createProxyAdapter('github', '/api/activity/github'),
  leetcode: createProxyAdapter('leetcode', '/api/activity/leetcode')
};

export function Portfolio() {
  return (
    <ActivityMap
      usernames={{
        github: 'octocat',
        leetcode: 'your-leetcode-username'
      }}
      initialPlatforms={['github', 'leetcode']}
      adapters={adapters}
      year={2025}
    />
  );
}
```

Only selected platforms with a configured username are fetched. The component displays controls for all four supported platforms; visitors can select or deselect them as needed. The endpoint paths in `adapters` must match routes implemented by your application.

## Platform combinations

LeetCode only:

```tsx
<ActivityMap
  usernames={{ leetcode: 'your-leetcode-username' }}
  initialPlatforms={['leetcode']}
/>
```

All platforms:

```tsx
<ActivityMap
  usernames={{
    leetcode: 'your-leetcode-username',
    github: 'your-github-username',
    codeforces: 'your-codeforces-handle',
    geeksforgeeks: 'your-geeksforgeeks-handle'
  }}
  initialPlatforms={['leetcode', 'github', 'codeforces', 'geeksforgeeks']}
/>
```

If `initialPlatforms` is omitted, it defaults to the platforms present in `usernames`.

## Styling

Use `style` for the outer element, or override individual internal slots with `styles`. Color values can be customized independently:

```tsx
<ActivityMap
  usernames={{ github: 'octocat' }}
  style={{ maxWidth: 900, margin: '0 auto' }}
  styles={{
    root: { background: '#fff', color: '#16202a', borderRadius: 4 },
    title: { fontFamily: 'Georgia, serif', fontSize: 24 },
    toggle: { borderRadius: 999 },
    toggleActive: { color: 'var(--foreground)' },
    toggleInactive: { color: 'var(--muted-foreground)' }
  }}
  colors={{
    high: '#e85d75',
    low: '#f3a6b5',
    empty: '#f3f5f7',
    github: '#e85d75'
  }}
/>
```

The activity is presented as a compact horizontal contribution strip with seven day rows, week columns, and month labels below each month. Available style slots are `root`, `header`, `title`, `subtitle`, `controls`, `toggle`, `toggleActive`, `toggleInactive`, `reload`, `gridWrap`, `grid`, `month`, `monthTitle`, `weekdays`, `weekday`, `monthGrid`, `cell`, `legend`, `dot`, and `status`. `toggle` is the base style; `toggleActive` and `toggleInactive` are applied according to `aria-pressed` and can set state-specific colors without hard-coded inline colors overriding them.

To select every configured platform initially, pass all of their platform keys through `initialPlatforms`. Invalid keys and platforms without a username are ignored:

```tsx
<ActivityMap
  usernames={{
    github: 'civdix',
    leetcode: 'goingtofar',
    geeksforgeeks: 'shivamdixit11'
  }}
  initialPlatforms={['github', 'leetcode', 'geeksforgeeks']}
/>
```

Available color keys are the four platform names plus `empty`, `low`, and `high`.

## Props

| Prop | Type | Description |
| --- | --- | --- |
| `usernames` | `Partial<Record<Platform, string>>` | Usernames or handles for the platforms to fetch. |
| `initialPlatforms` | `Platform[]` | Platforms selected when the component first renders. |
| `adapters` | `Partial<Record<Platform, ActivityAdapter>>` | Replaces the default fetcher for one or more platforms. |
| `year` | `number` | Year displayed by the heatmap. Defaults to the current year. |
| `title` | `string` | Heading shown above the map. |
| `showLegend` | `boolean` | Shows or hides the Less/More legend. |
| `className` | `string` | CSS class for the outer element. |
| `style` | `React.CSSProperties` | Inline styles for the outer element. |
| `styles` | `ActivityMapStyles` | Inline styles for individual component slots. |
| `colors` | `ActivityMapColors` | Platform and heatmap colors. |

Supported platform values are `leetcode`, `github`, `codeforces`, and `geeksforgeeks`.

## Custom data adapters

Use a custom adapter when you need your own API proxy, authentication, caching, or a different provider. An adapter returns an array of normalized daily activity records:

```tsx
import type { ActivityAdapter } from 'coding-activity-map';

const geeksforgeeksAdapter: ActivityAdapter = {
  platform: 'geeksforgeeks',
  fetchActivity: async (username, signal) => {
    const response = await fetch(`/api/activity/geeksforgeeks/${username}`, { signal });
    if (!response.ok) throw new Error('Unable to load GeeksforGeeks activity');

    return response.json();
  }
};

<ActivityMap
  usernames={{ geeksforgeeks: 'your-handle' }}
  adapters={{ geeksforgeeks: geeksforgeeksAdapter }}
/>
```

The adapter must return this shape:

```ts
[
  { date: '2025-01-01', count: 3 },
  { date: '2025-01-02', count: 1 }
]
```

Dates must use `YYYY-MM-DD`. The optional `platforms` field can be used when an adapter returns per-platform counts:

```ts
{
  date: '2025-01-01',
  count: 3,
  platforms: { geeksforgeeks: 3 }
}
```

### Same-origin proxy adapter

For a production portfolio, use the included `createProxyAdapter` helper to call your own backend instead of calling an external platform from the browser:

```tsx
import { ActivityMap, createProxyAdapter } from 'coding-activity-map';

const geeksforgeeksAdapter = createProxyAdapter(
  'geeksforgeeks',
  '/api/activity/geeksforgeeks'
);

<ActivityMap
  usernames={{ geeksforgeeks: 'your-handle' }}
  adapters={{ geeksforgeeks: geeksforgeeksAdapter }}
/>
```

The helper sends `handle` and `year` query parameters and expects your backend to return:

```json
[
  { "date": "2025-01-01", "count": 3 },
  { "date": "2025-01-02", "count": 1 }
]
```

Your backend can then call the GeeksforGeeks or LeetCode endpoint server-side, where CORS does not apply, and cache the result before returning it to the portfolio.

For Next.js, add `app/api/activity/[platform]/route.ts` to implement that backend route:

```ts
import { fetchPlatformActivity } from 'coding-activity-map/server';
import type { Platform } from 'coding-activity-map';

const supportedPlatforms: Platform[] = [
  'leetcode',
  'github',
  'codeforces',
  'geeksforgeeks'
];

export async function GET(
  request: Request,
  context: { params: Promise<{ platform: string }> }
) {
  const { platform } = await context.params;
  const url = new URL(request.url);
  const username = url.searchParams.get('handle');
  const year = Number(url.searchParams.get('year'));

  if (!supportedPlatforms.includes(platform as Platform) || !username || !Number.isInteger(year)) {
    return Response.json({ error: 'Invalid platform, handle, or year' }, { status: 400 });
  }

  try {
    const activity = await fetchPlatformActivity(platform as Platform, username, year);
    return Response.json(activity, { headers: { 'Cache-Control': 's-maxage=3600' } });
  } catch {
    return Response.json({ error: 'Unable to load activity' }, { status: 502 });
  }
}
```

Then point the component at the route:

```tsx
const adapters = Object.fromEntries(
  (['leetcode', 'github', 'codeforces', 'geeksforgeeks'] as const).map((platform) => [
    platform,
    createProxyAdapter(platform, `/api/activity/${platform}`)
  ])
);

<ActivityMap usernames={usernames} adapters={adapters} />
```

## Built-in endpoints and production considerations

The built-in adapters currently use these endpoints:

- GitHub: `github-contributions-api.jogruber.de`
- LeetCode: `leetcode.com/graphql/` with the `userProfileCalendar` query
- Codeforces: `codeforces.com/api/user.status`
- GeeksforGeeks: `practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/`

The LeetCode GraphQL and GeeksforGeeks requests are the formats used by their websites, but they are not documented public SDK contracts. Any source may enforce CORS rules, rate limits, or change its response format. For a production portfolio, proxy requests through your own server and provide custom adapters through the `adapters` prop.

Never put private API keys, GitHub tokens, or other secrets in the portfolio's client-side code.

## Development

```bash
npm install
npm run typecheck
npm run build
```

The compiled package is written to `dist/`.

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository.
2. Create a focused branch for your change.
3. Install dependencies with `npm install`.
4. Run `npm run typecheck` and `npm run build`.
5. Open a pull request with a clear description of the improvement.

Please keep changes focused, document new public props or adapters, and include validation steps in your pull request.