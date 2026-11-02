import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ActivityMap } from '../dist/index.js';

const renderMap = (props) => renderToStaticMarkup(React.createElement(ActivityMap, props));

test('applies custom active and inactive toggle colors without overriding legacy toggle styles', () => {
  const markup = renderMap({
    usernames: { github: 'civdix', leetcode: 'goingtofar' },
    initialPlatforms: ['github'],
    styles: {
      toggle: { background: 'var(--background)', color: 'var(--legacy-color)' },
      toggleActive: { color: 'var(--foreground)' },
      toggleInactive: { color: 'var(--muted-foreground)' }
    }
  });

  assert.match(markup, /aria-pressed="true"[^>]*style="[^"]*color:var\(--foreground\)/);
  assert.match(markup, /aria-pressed="false"[^>]*style="[^"]*color:var\(--muted-foreground\)/);
});

test('selects every valid configured platform on the first render', () => {
  const markup = renderMap({
    usernames: {
      github: 'civdix',
      leetcode: 'goingtofar',
      geeksforgeeks: 'shivamdixit11'
    },
    initialPlatforms: ['github', 'leetcode', 'geeksforgeeks', 'codeforces']
  });

  assert.match(markup, />2026 · 3 platforms</);
  assert.match(markup, /aria-pressed="true"[^>]*>[\s\S]*?GitHub/);
  assert.match(markup, /aria-pressed="true"[^>]*>[\s\S]*?LeetCode/);
  assert.match(markup, /aria-pressed="true"[^>]*>[\s\S]*?GeeksforGeeks/);
  assert.doesNotMatch(markup, /Codeforces/);
});