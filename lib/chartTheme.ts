import type { CSSProperties } from 'react';

// Presentational-only constants shared across chart components.
// Orange family only, per design system (green/red are reserved for
// positive/negative deltas elsewhere and never used as categorical hues).

export const CHART_COLORS = ['#E0672E', '#F2A57C', '#B84E1F', '#7A3413', '#F7C59F', '#C9C0B6'];

export const GRID_STROKE = '#EEE8E1';
export const AXIS_TICK = { fontSize: 11, fill: '#211B18', fillOpacity: 0.55 };
export const AXIS_LINE = { stroke: '#EBE5DF' };

export const TOOLTIP_CONTENT_STYLE: CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #EBE5DF',
  borderRadius: 12,
  boxShadow: '0 8px 24px -8px rgba(33,27,24,0.18)',
  padding: '8px 12px',
  fontSize: 12
};

export const TOOLTIP_LABEL_STYLE: CSSProperties = {
  color: '#211B18',
  fontWeight: 600,
  marginBottom: 4
};

export const TOOLTIP_ITEM_STYLE: CSSProperties = {
  color: '#211B18',
  opacity: 0.8,
  padding: 0
};

export const LEGEND_STYLE: CSSProperties = {
  fontSize: 12,
  opacity: 0.75
};

export const TOOLTIP_CURSOR = { fill: 'rgba(224,103,46,0.06)' };

/** Truncate a long category label (e.g. restaurant name) for axis ticks. */
export function truncateLabel(label: string, maxLen = 18): string {
  if (!label) return label;
  return label.length > maxLen ? `${label.slice(0, maxLen - 1)}…` : label;
}
