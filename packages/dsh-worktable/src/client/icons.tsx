/**
 * 工作台统一 SVG 图标集：界面图标一律矢量渲染，替代 emoji（跨平台字形/彩色渲染不一致）。
 * 风格与库内 ICON_SYNC / ICON_SPARK 保持一致（16 viewBox、stroke=currentColor）。
 * Icon 以名称取图：既接受语义键（'monitor'），也接受旧版 emoji 字符串（存档兼容，
 * localStorage 里已存的 '\u{1F5A5}\u{FE0F}' 等直接映射到对应 SVG）；未知名称回退到通用窗格图标。
 */
import type { ReactNode } from 'react'

type Glyph = ReactNode

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

const dot = (cx: number, cy: number, r = 0.9) => (
  <circle key={cx + '-' + cy} cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />
)

const GLYPHS: Record<string, Glyph> = {
  monitor: (
    <g {...strokeProps}>
      <rect x="1.5" y="2.5" width="13" height="9" rx="1" />
      <path d="M8 11.5v2M5.5 13.5h5" />
    </g>
  ),
  brick: (
    <g {...strokeProps}>
      <rect x="1.5" y="3" width="13" height="10" rx="0.5" />
      <path d="M1.5 6.3h13M1.5 9.7h13M6 3v3.3M11 3v3.3M3.8 6.3v3.4M8.3 6.3v3.4M6 9.7v3.3M11 9.7v3.3" />
    </g>
  ),
  home: (
    <g {...strokeProps}>
      <path d="M2.5 7.5L8 2.8l5.5 4.7" />
      <path d="M4 6.6V13h8V6.6" />
      <path d="M7 13v-3h2v3" />
    </g>
  ),
  grad: (
    <g {...strokeProps}>
      <path d="M8 3.5L14 6l-6 2.5L2 6z" />
      <path d="M4.5 7.4v2.8c0 1.1 1.6 2 3.5 2s3.5-.9 3.5-2V7.4" />
      <path d="M14 6v3.5" />
    </g>
  ),
  car: (
    <g {...strokeProps}>
      <path d="M3 10.2V8.3l1.2-2.9c.2-.4.6-.7 1-.7h5.6c.4 0 .8.3 1 .7l1.2 2.9v1.9" />
      <path d="M3 10.2h10" />
      <path d="M3 10.2v1.6h1.6M13 10.2v1.6h-1.6" />
      <circle cx="5.2" cy="12" r="1.1" />
      <circle cx="10.8" cy="12" r="1.1" />
    </g>
  ),
  plane: (
    <g {...strokeProps}>
      <path d="M14 2L7.2 8.8M14 2l-4.6 12-1.9-5.5L2 6.6z" />
    </g>
  ),
  globe: (
    <g {...strokeProps}>
      <circle cx="8" cy="8" r="6.5" />
      <path d="M1.5 8h13" />
      <path d="M8 1.5c2.2 2 2.2 11 0 13M8 1.5c-2.2 2-2.2 11 0 13" />
    </g>
  ),
  hospital: (
    <g {...strokeProps}>
      <rect x="2.5" y="2.5" width="11" height="11" rx="1" />
      <path d="M8 5.5v5M5.5 8h5" />
    </g>
  ),
  books: (
    <g {...strokeProps}>
      <path d="M2.5 2.8h2.8v10.4H2.5zM6.6 2.8h2.8v10.4H6.6z" />
      <path d="M10.9 3.6l2.7-.7 2 9.8-2.7.7z" />
    </g>
  ),
  pencil: (
    <g {...strokeProps}>
      <path d="M11.3 2.7l2 2L5 13l-2.8.8L3 11z" />
      <path d="M9.9 4.1l2 2" />
    </g>
  ),
  gear: (
    <g {...strokeProps}>
      <circle cx="8" cy="8" r="2.3" />
      <path d="M8 1.8v1.9M8 12.3v1.9M1.8 8h1.9M12.3 8h1.9M3.6 3.6L5 5M11 11l1.4 1.4M12.4 3.6L11 5M5 11l-1.4 1.4" />
    </g>
  ),
  palette: (
    <g {...strokeProps}>
      <path d="M8 1.7a6.3 6.3 0 1 0 .2 12.6c1.1 0 1.5-.7 1.1-1.5-.5-.9.2-1.9 1.2-1.9h1.5c1.2 0 2.3-1 2.3-2.2A6.3 6.3 0 0 0 8 1.7z" />
      {dot(5.3, 6.6, 0.8)}
      {dot(8, 4.9, 0.8)}
      {dot(10.8, 6.4, 0.8)}
    </g>
  ),
  gamepad: (
    <g {...strokeProps}>
      <rect x="1.5" y="5" width="13" height="7" rx="3.4" />
      <path d="M5 7.2v2.6M3.7 8.5h2.6" />
      {dot(11, 7.6, 0.8)}
      {dot(12.3, 9.3, 0.8)}
    </g>
  ),
  ruler: (
    <g {...strokeProps}>
      <path d="M2.5 13.5v-11L13.5 13.5z" />
      <path d="M5.5 13.5V9.2l4.3 4.3" />
    </g>
  ),
  flask: (
    <g {...strokeProps}>
      <path d="M6 2.5h4" />
      <path d="M6.8 2.5v4L3.6 12c-.4.8.2 1.5 1 1.5h6.8c.8 0 1.4-.7 1-1.5L9.2 6.5v-4" />
      <path d="M5 10.2h6" />
    </g>
  ),
  robot: (
    <g {...strokeProps}>
      <rect x="3" y="4.8" width="10" height="7.7" rx="1.5" />
      <path d="M8 4.8V3" />
      {dot(8, 2.4, 0.6)}
      {dot(6, 8.4, 0.9)}
      {dot(10, 8.4, 0.9)}
      <path d="M6 10.8h4" />
    </g>
  ),
  box: (
    <g {...strokeProps}>
      <path d="M8 1.8L14 4.6v6.8L8 14.2 2 11.4V4.6z" />
      <path d="M2 4.6L8 7.4l6-2.8M8 7.4v6.8" />
    </g>
  ),
  chat: (
    <g {...strokeProps}>
      <path d="M13.5 3.5v6.9H8.3L5 13.2v-2.8H2.5V3.5z" />
    </g>
  ),
  link: (
    <g {...strokeProps}>
      <path d="M6.4 9.6l3.2-3.2" />
      <path d="M5.2 8.1l-1.6 1.6a2.5 2.5 0 0 0 3.5 3.5l1.6-1.6" />
      <path d="M7.8 4.5l1.6-1.6a2.5 2.5 0 0 1 3.5 3.5l-1.6 1.6" />
    </g>
  ),
  folder: (
    <g {...strokeProps}>
      <path d="M1.5 4.2c0-.6.4-1 1-1h3.1l1.4 1.6h6.5c.6 0 1 .4 1 1V12c0 .6-.4 1-1 1h-11c-.6 0-1-.4-1-1z" />
    </g>
  ),
  folderOpen: (
    <g {...strokeProps}>
      <path d="M1.5 12V4.2c0-.6.4-1 1-1h3.1l1.4 1.6h4.6c.6 0 1 .4 1 1v1.4" />
      <path d="M1.5 12l1.5-4.3c.1-.4.4-.6.8-.6h10.8c.5 0 .9.5.7 1L14 12z" />
    </g>
  ),
  clapper: (
    <g {...strokeProps}>
      <rect x="1.5" y="6.4" width="13" height="7" rx="1" />
      <path d="M2 6.2L3 3.4l11.4 1.6-.5 1.6" />
      <path d="M5.6 3.9l1.2 2.1M9.1 4.4l1.2 2.1" />
    </g>
  ),
  branch: (
    <g {...strokeProps}>
      <circle cx="3.5" cy="4" r="1.5" />
      <circle cx="3.5" cy="12" r="1.5" />
      <circle cx="12.5" cy="8" r="1.5" />
      <path d="M5 4c3.8 0 3.2 4 6 4M5 12c3.8 0 3.2-4 6-4" />
    </g>
  ),
  check: (
    <g {...strokeProps}>
      <path d="M3 8.6l3.2 3.2L13 4.8" />
    </g>
  ),
  spark: (
    <g {...strokeProps}>
      <path d="M8 1.6l1.5 3.9 3.9 1.5-3.9 1.5L8 12.4 6.5 8.5 2.6 7l3.9-1.5z" strokeWidth={1.3} />
      <path d="M12.6 11.2l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5z" fill="currentColor" stroke="none" />
    </g>
  ),
  warning: (
    <g {...strokeProps}>
      <path d="M8 2.2L14.5 13.2h-13z" />
      <path d="M8 6.4v3" />
      {dot(8, 11.3, 0.7)}
    </g>
  ),
  puzzle: (
    <g {...strokeProps}>
      <path d="M6.1 2.9a1.5 1.5 0 1 1 3 0h2.5c.5 0 .9.4.9.9v2.3a1.5 1.5 0 1 0 0 3v2.5c0 .5-.4.9-.9.9H9.1a1.5 1.5 0 1 1-3 0H3.6c-.5 0-.9-.4-.9-.9V9.1a1.5 1.5 0 1 1 0-3V3.8c0-.5.4-.9.9-.9z" />
    </g>
  ),
  moon: (
    <g {...strokeProps}>
      <path d="M13.5 9.6A5.8 5.8 0 0 1 6.4 2.5a5.8 5.8 0 1 0 7.1 7.1z" />
    </g>
  ),
  sun: (
    <g {...strokeProps}>
      <circle cx="8" cy="8" r="2.8" />
      <path d="M8 1.5v1.8M8 12.7v1.8M1.5 8h1.8M12.7 8h1.8M3.4 3.4l1.3 1.3M11.3 11.3l1.3 1.3M12.6 3.4l-1.3 1.3M4.7 11.3l-1.3 1.3" />
    </g>
  ),
  plus: (
    <g {...strokeProps}>
      <path d="M8 3v10M3 8h10" />
    </g>
  ),
  chart: (
    <g {...strokeProps}>
      <path d="M2.5 2.5v11h11" />
      <path d="M5 10.5V7.2M8.2 10.5V4.6M11.4 10.5V6.4" />
    </g>
  ),
  terminal: (
    <g {...strokeProps}>
      <path d="M3 4.5l3.5 3.5L3 11.5M8.5 12h4.5" />
    </g>
  ),
  default: (
    <g {...strokeProps}>
      <rect x="2" y="2.5" width="12" height="11" rx="1" />
      <path d="M2 5.6h12" />
      <path d="M4 4.1h.01M5.8 4.1h.01" />
    </g>
  ),
}

/** emoji/符号 → 语义键：兼容 localStorage 里已持久化的旧图标值 */
const ALIASES: Record<string, string> = {
  '\u{1F5A5}\u{FE0F}': 'monitor',
  '\u{1F9F1}': 'brick',
  '\u{1F3E0}': 'home',
  '\u{1F393}': 'grad',
  '\u{1F697}': 'car',
  '\u{2708}\u{FE0F}': 'plane',
  '\u{1F30D}': 'globe',
  '\u{1F30F}': 'globe',
  '\u{1F310}': 'globe',
  '\u{1F3E5}': 'hospital',
  '\u{1F4DA}': 'books',
  '\u{270F}\u{FE0F}': 'pencil',
  '\u{2699}\u{FE0F}': 'gear',
  '\u{1F3A8}': 'palette',
  '\u{1F3AE}': 'gamepad',
  '\u{1F4D0}': 'ruler',
  '\u{1F9EA}': 'flask',
  '\u{1F916}': 'robot',
  '\u{1F4E6}': 'box',
  '\u{1F4AC}': 'chat',
  '\u{1F517}': 'link',
  '\u{1F4C1}': 'folder',
  '\u{1F4C2}': 'folderOpen',
  '\u{1F3AC}': 'clapper',
  '\u{1F500}': 'branch',
  '\u{2705}': 'check',
  '\u{2728}': 'spark',
  '\u{26A0}\u{FE0F}': 'warning',
  '\u{1F9E9}': 'puzzle',
  '\u{1F319}': 'moon',
  '\u{2600}\u{FE0F}': 'sun',
  '\u{2795}': 'plus',
  '▸_': 'terminal',
  '\u{1F4CA}': 'chart',
}

/** 图标组件：name 可为语义键或旧版 emoji 字符串；未知值回退通用窗格图。 */
export function Icon({ name, className }: { name: string; className?: string }) {
  const key = ALIASES[name] ?? name
  return (
    <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden className={className}>
      {GLYPHS[key] ?? GLYPHS.default}
    </svg>
  )
}
