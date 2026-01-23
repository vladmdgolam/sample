import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

// App color palette
const COLORS = {
  pageBg: "#F5F2EF",
  chassis: "#E8E4E1",
  padRubber: "#B8C4D0",
  textDark: "#4A4A4A",
  textMuted: "#8BA4B4",
  playing: "#f59e0b",
};

export const OutroScene = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Main content animation
  const contentProgress = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  // Fade out at the end
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" }
  );

  // Mini pads animation
  const padsProgress = spring({
    frame: frame - 20,
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
        opacity: fadeOut,
      }}
    >
      {/* Mini pads decoration */}
      <div
        style={{
          marginBottom: 60,
          opacity: padsProgress,
          transform: `scale(${interpolate(padsProgress, [0, 1], [0.8, 1])})`,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 40px)",
            gap: 8,
          }}
        >
          {Array.from({ length: 16 }).map((_, i) => {
            const isHighlighted = [0, 5, 10, 15].includes(i);
            return (
              <div
                key={i}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 6,
                  backgroundColor: isHighlighted ? COLORS.playing : COLORS.padRubber,
                  boxShadow: isHighlighted
                    ? "0 0 12px rgba(245, 158, 11, 0.4)"
                    : "inset 0 1px 2px rgba(0,0,0,0.1)",
                  border: "1px solid rgba(0,0,0,0.08)",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Logo */}
      <div
        style={{
          opacity: contentProgress,
          transform: `translateY(${interpolate(contentProgress, [0, 1], [30, 0])}px)`,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 64,
            fontWeight: 600,
            color: COLORS.textDark,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Sample Pad
        </h1>
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: spring({
            frame: frame - 10,
            fps,
            config: { damping: 200 },
          }),
          marginTop: 16,
        }}
      >
        <p
          style={{
            fontSize: 22,
            color: COLORS.textMuted,
            margin: 0,
          }}
        >
          Make music. Have fun.
        </p>
      </div>

      {/* CTA */}
      <div
        style={{
          marginTop: 48,
          opacity: spring({
            frame: frame - 25,
            fps,
            config: { damping: 200 },
          }),
        }}
      >
        <div
          style={{
            padding: "18px 40px",
            borderRadius: 50,
            backgroundColor: COLORS.textDark,
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: "#fff",
              letterSpacing: "0.02em",
            }}
          >
            Try it now
          </span>
        </div>
      </div>

      {/* Credits */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          opacity: interpolate(frame, [30, 50], [0, 0.5], { extrapolateRight: "clamp" }),
        }}
      >
        <p
          style={{
            fontSize: 14,
            color: COLORS.textMuted,
            margin: 0,
          }}
        >
          Built with Next.js & Three.js
        </p>
      </div>
    </AbsoluteFill>
  );
};
