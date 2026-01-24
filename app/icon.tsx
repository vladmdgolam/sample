import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  // Muji-inspired natural palette
  const padColor = '#C4B8A8' // Warm taupe pad color
  const bgColor = '#E8E3DB' // Natural off-white background
  const accentColor = '#D4A574' // Warm accent for one "playing" pad
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
              background: i === 5 ? accentColor : padColor,
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
