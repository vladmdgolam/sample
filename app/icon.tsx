import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  const padColor = '#f59e0b' // Amber glow color
  const bgColor = '#1a1a1a'
  const gap = 2
  const padding = 3
  const padSize = (32 - padding * 2 - gap * 3) / 4

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
          borderRadius: '4px',
        }}
      >
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: `${padSize}px`,
              height: `${padSize}px`,
              background: padColor,
              borderRadius: '1px',
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
