import { ImageResponse } from 'next/og'

export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

export default function AppleIcon() {
  const padColor = '#f59e0b' // Amber glow color
  const bgColor = '#1a1a1a'
  const gap = 8
  const padding = 16
  const padSize = (180 - padding * 2 - gap * 3) / 4

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexWrap: 'wrap',
          gap: `${gap}px`,
          padding: `${padding}px`,
          background: bgColor,
          borderRadius: '24px',
        }}
      >
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: `${padSize}px`,
              height: `${padSize}px`,
              background: padColor,
              borderRadius: '4px',
            }}
          />
        ))}
      </div>
    ),
    {
      ...size,
    }
  )
}
