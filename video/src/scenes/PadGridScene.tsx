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
  chassisDark: "#D4CFC9",
  padRubber: "#B8C4D0",
  lcdBg: "#A8D5C2",
  lcdBezel: "#6B8F80",
  lcdText: "#2D5A47",
  textDark: "#4A4A4A",
  textMuted: "#8BA4B4",
  playing: "#f59e0b",
};

const KEYBOARD_KEYS = [
  "1", "2", "3", "4",
  "Q", "W", "E", "R",
  "A", "S", "D", "F",
  "Z", "X", "C", "V",
];

export const PadGridScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance animation for sampler
  const samplerProgress = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  // Sequence of pad presses (diagonal wave pattern)
  const pressSequence = [0, 5, 10, 15, 1, 6, 11, 4, 9, 14, 2, 7, 3, 8, 13, 12];
  const pressStartFrame = 25;
  const pressInterval = 6;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.pageBg,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
      }}
    >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 120,
          opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <h2
          style={{
            fontSize: 36,
            fontWeight: 500,
            color: COLORS.textDark,
            margin: 0,
          }}
        >
          Tap to play
        </h2>
      </div>

      {/* Main sampler container */}
      <div
        style={{
          backgroundColor: COLORS.chassis,
          borderRadius: 32,
          padding: 48,
          boxShadow: "0 12px 60px rgba(0, 0, 0, 0.1)",
          opacity: samplerProgress,
          transform: `scale(${interpolate(samplerProgress, [0, 1], [0.9, 1])})`,
        }}
      >
        {/* LCD Display */}
        <div
          style={{
            backgroundColor: COLORS.lcdBg,
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
            border: `3px solid ${COLORS.lcdBezel}`,
          }}
        >
          <div style={{ color: COLORS.lcdText, fontSize: 14, fontWeight: 600, marginBottom: 8, letterSpacing: "0.05em" }}>
            NOW PLAYING
          </div>
          {/* Waveform visualization */}
          <div style={{ display: "flex", gap: 2, height: 32, alignItems: "flex-end" }}>
            {Array.from({ length: 40 }).map((_, i) => {
              const barHeight = 8 + Math.sin(frame * 0.15 + i * 0.4) * 12;
              return (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: Math.max(4, barHeight),
                    backgroundColor: COLORS.lcdText,
                    borderRadius: 1,
                    opacity: 0.8,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Pad grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 100px)",
            gap: 12,
          }}
        >
          {Array.from({ length: 16 }).map((_, i) => {
            // Stagger entrance
            const entranceDelay = i * 1.5;
            const entrance = spring({
              frame: frame - entranceDelay,
              fps,
              config: { damping: 25 },
            });

            // Check if pad is being pressed
            const pressIndex = pressSequence.indexOf(i);
            const pressFrame = pressStartFrame + pressIndex * pressInterval;
            const timeSincePress = frame - pressFrame;
            const isPressed = timeSincePress >= 0 && timeSincePress < 15;

            // Press animation
            const pressScale = isPressed
              ? interpolate(timeSincePress, [0, 4, 15], [1, 0.92, 1], { extrapolateRight: "clamp" })
              : 1;

            // Glow intensity
            const glowIntensity = isPressed
              ? interpolate(timeSincePress, [0, 8, 15], [0, 1, 0], { extrapolateRight: "clamp" })
              : 0;

            return (
              <div
                key={i}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 10,
                  backgroundColor: isPressed ? COLORS.playing : COLORS.padRubber,
                  transform: `scale(${entrance * pressScale})`,
                  boxShadow: isPressed
                    ? `inset 0 2px 4px rgba(0,0,0,0.1), 0 0 ${glowIntensity * 30}px rgba(245, 158, 11, ${glowIntensity * 0.5})`
                    : "inset 0 2px 4px rgba(0,0,0,0.15), inset 0 -1px 2px rgba(255,255,255,0.3), 1px 1px 3px rgba(0,0,0,0.1)",
                  border: "1px solid rgba(0,0,0,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    color: isPressed ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.25)",
                  }}
                >
                  {KEYBOARD_KEYS[i]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hint */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          opacity: interpolate(frame, [40, 60], [0, 0.7], { extrapolateRight: "clamp" }),
        }}
      >
        <p
          style={{
            fontSize: 18,
            color: COLORS.textMuted,
            margin: 0,
          }}
        >
          Use keyboard or click pads
        </p>
      </div>
    </AbsoluteFill>
  );
};
