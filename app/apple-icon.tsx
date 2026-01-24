import { ImageResponse } from 'next/og'

export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

export default function AppleIcon() {
  // Muji-inspired natural palette
  const padColor = '#C4B8A8' // Warm taupe pad color
  const bgColor = '#E8E3DB' // Natural off-white background
  const accentColor = '#D4A574' // Warm accent for one "playing" pad
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
              background: i === 5 ? accentColor : padColor,
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
