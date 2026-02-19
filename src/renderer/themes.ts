import type { Theme } from '../types.js';

export const darkTheme: Theme = {
  name: 'dark',
  background: '#0d1117',
  surface: '#161b22',
  surfaceAlt: '#1c2333',
  text: {
    primary: '#e6edf3',
    secondary: '#8b949e',
    accent: '#58a6ff',
    muted: '#484f58',
  },
  heatmap: {
    empty: '#161b22',
    levels: ['#0e4429', '#006d32', '#26a641', '#39d353'],
  },
  border: '#30363d',
  divider: '#21262d',
  chart: {
    bar: '#58a6ff',
    barMuted: '#1c2333',
    lines: ['#58a6ff', '#bc8cff', '#f0883e', '#3fb950', '#f778ba'],
  },
};

export const lightTheme: Theme = {
  name: 'light',
  background: '#ffffff',
  surface: '#f6f8fa',
  surfaceAlt: '#eaeef2',
  text: {
    primary: '#1f2328',
    secondary: '#656d76',
    accent: '#0969da',
    muted: '#b1bac4',
  },
  heatmap: {
    empty: '#ebedf0',
    levels: ['#9be9a8', '#40c463', '#30a14e', '#216e39'],
  },
  border: '#d0d7de',
  divider: '#d8dee4',
  chart: {
    bar: '#0969da',
    barMuted: '#eaeef2',
    lines: ['#0969da', '#8250df', '#bf8700', '#1a7f37', '#cf222e'],
  },
};

export function getTheme(name: 'dark' | 'light'): Theme {
  return name === 'dark' ? darkTheme : lightTheme;
}
