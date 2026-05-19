import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Campus Bulletin — INTI campus announcement board'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    <div
      style={{
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
      }}
    >
      {/* Pulsing INTI dot */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          right: 60,
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: '#C8102E',
          boxShadow: '0 0 72px rgba(200,16,46,0.55)',
        }}
      />

      {/* Eyebrow */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 28,
          color: '#C8102E',
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: 5,
          textTransform: 'uppercase',
        }}
      >
        INTI Campus Board
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 88,
          fontWeight: 800,
          color: '#f5f0e8',
          lineHeight: 0.88,
          maxWidth: 820,
        }}
      >
        Campus Bulletin
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: 26,
          color: '#8a7f6e',
          marginTop: 32,
          maxWidth: 660,
          lineHeight: 1.4,
        }}
      >
        Official notices, student clubs, deadlines, and campus events — all in one public board.
      </div>
    </div>,
    { ...size }
  )
}
