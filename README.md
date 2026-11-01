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

## Basic usage

```tsx
import { ActivityMap } from 'coding-activity-map';

export function Portfolio() {
  return (
    <ActivityMap
      usernames={{
        github: 'octocat',
        leetcode: 'your-leetcode-username'
      }}
      initialPlatforms={['github', 'leetcode']}
      year={2025}
    />
  );
}
```

Only selected platforms with a configured username are fetched. The component displays controls for all four supported platforms; visitors can select or deselect them as needed.

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
    toggle: { borderRadius: 999 }
  }}
  colors={{
    high: '#e85d75',
    low: '#f3a6b5',
    empty: '#f3f5f7',
    github: '#e85d75'
  }}
/>
```

Available style slots are `root`, `header`, `title`, `subtitle`, `controls`, `toggle`, `gridWrap`, `grid`, `cell`, `legend`, `dot`, and `status`.

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