# Sample Pad

Interactive sampler/pad application built with Next.js and Three.js.

## Tech Stack

- **Next.js 14** - App Router
- **React Three Fiber** - 3D rendering with Three.js
- **Framer Motion** - Animations
- **Tailwind CSS** - Styling
- **TypeScript**

## Project Structure

```
app/
  (base)/        # Main layout and pages
    page.tsx     # Home page
    3d/          # 3D view
  dark/          # Dark theme variant
components/
  Pad.tsx        # Individual pad component
  PadGrid.tsx    # Grid of pads
  SamplerPage.tsx
  3d/            # Three.js 3D components
    Sampler.tsx
    Pad.tsx
    Pads.tsx
public/
  samples/       # Audio sample files (.wav)
  text/          # SVG assets
```

## Commands

```bash
pnpm dev    # Start dev server
pnpm build  # Production build
pnpm start  # Start production server
```

## Notes

- Audio samples are in `public/samples/`
- 3D model at `public/sampler.glb`
- Uses Leva for debug controls
