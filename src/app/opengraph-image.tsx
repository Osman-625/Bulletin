import { ImageResponse } from 'next/og'
import type { CSSProperties } from 'react'

export const runtime = 'edge'
export const alt = 'Campus Bulletin, INTI campus announcement board'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const OG_ROOT_STYLE = {
  background: '#1a1410',
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'flex-end',
  padding: '80px',
  fontFamily: 'system-ui, sans-serif',
  position: 'relative',
} satisfies CSSProperties

const OG_SIGNAL_STYLE = {
  position: 'absolute',
  top: 60,
  right: 60,
  width: 72,
  height: 72,
  borderRadius: '50%',
  background: '#C8102E',
  boxShadow: '0 0 72px rgba(200,16,46,0.55)',
} satisfies CSSProperties

const OG_EYEBROW_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 28,
  color: '#C8102E',
  fontSize: 15,
  fontWeight: 700,
  letterSpacing: 5,
  textTransform: 'uppercase',
} satisfies CSSProperties

const OG_TITLE_STYLE = {
  fontSize: 88,
  fontWeight: 800,
  color: '#f5f0e8',
  lineHeight: 0.88,
  maxWidth: 820,
} satisfies CSSProperties

const OG_SUBTITLE_STYLE = {
  fontSize: 26,
  color: '#8a7f6e',
  marginTop: 32,
  maxWidth: 660,
  lineHeight: 1.4,
} satisfies CSSProperties

export default function Image() {
  return new ImageResponse(
    <div style={OG_ROOT_STYLE}>
      {/* Pulsing INTI dot */}
      <div style={OG_SIGNAL_STYLE} />

      {/* Eyebrow */}
      <div style={OG_EYEBROW_STYLE}>INTI Campus Board</div>

      {/* Title */}
      <div style={OG_TITLE_STYLE}>Campus Bulletin</div>

      {/* Subtitle */}
      <div style={OG_SUBTITLE_STYLE}>
        Official notices, student clubs, deadlines, and campus events, all in one public board.
      </div>
    </div>,
    { ...size }
  )
}
