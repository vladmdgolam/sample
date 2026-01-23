import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["300", "400", "500", "600"],
  subsets: ["latin"],
});

// App color palette
const COLORS = {
  pageBg: "#F5F2EF",
  chassis: "#E8E4E1",
  chassisDark: "#D4CFC9",
  padRubber: "#B8C4D0",
  textDark: "#4A4A4A",
  textMuted: "#8BA4B4",
};

export const IntroScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Smooth entrance animations
  const logoProgress = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  const subtitleProgress = spring({
    frame: frame - 12,
    fps,
    config: { damping: 200 },
  });

  // Mini sampler animation
  const samplerProgress = spring({
    frame: frame - 24,
    fps,
    config: { damping: 100 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.pageBg,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Mini sampler visualization */}
      <div
        style={{
          opacity: samplerProgress,
          transform: `translateY(${interpolate(samplerProgress, [0, 1], [40, 0])}px)`,
          marginBottom: 80,
        }}
      >
        <div
          style={{
            backgroundColor: COLORS.chassis,
            borderRadius: 24,
            padding: 32,
            boxShadow: "0 8px 40px rgba(0, 0, 0, 0.08)",
          }}
        >
          {/* 4x4 pad grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 64px)",
              gap: 10,
            }}
          >
            {Array.from({ length: 16 }).map((_, i) => {
              const padDelay = 24 + i * 2;
              const padProgress = spring({
                frame: frame - padDelay,
                fps,
                config: { damping: 20 },
              });

              // Animate some pads as "playing"
              const playingPads = [0, 5, 10, 15, 3, 6, 9, 12];
              const isPlaying = playingPads.includes(i) && frame > 50 + i * 4 && frame < 70 + i * 4;

              return (
                <div
                  key={i}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 8,
                    backgroundColor: isPlaying ? "#f59e0b" : COLORS.padRubber,
                    transform: `scale(${padProgress})`,
                    boxShadow: isPlaying
                      ? "inset 0 2px 4px rgba(0,0,0,0.1), 0 0 20px rgba(245, 158, 11, 0.4)"
                      : "inset 0 2px 4px rgba(0,0,0,0.15), inset 0 -1px 2px rgba(255,255,255,0.3)",
                    border: "1px solid rgba(0,0,0,0.1)",
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Logo */}
      <div
        style={{
          opacity: logoProgress,
          transform: `translateY(${interpolate(logoProgress, [0, 1], [30, 0])}px)`,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 72,
            fontWeight: 600,
            color: COLORS.textDark,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Sample Pad
        </h1>
      </div>

      {/* Subtitle */}
      <div
        style={{
          opacity: subtitleProgress,
          transform: `translateY(${interpolate(subtitleProgress, [0, 1], [20, 0])}px)`,
          marginTop: 16,
        }}
      >
        <p
          style={{
            fontSize: 24,
            fontWeight: 400,
            color: COLORS.textMuted,
            margin: 0,
            letterSpacing: "0.02em",
          }}
        >
          Interactive music sampler
        </p>
      </div>
    </AbsoluteFill>
  );
};
