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
  lcdBg: "#A8D5C2",
  lcdText: "#2D5A47",
  textDark: "#4A4A4A",
  textMuted: "#8BA4B4",
  btnRed: "#E8857A",
  playing: "#f59e0b",
};

type Feature = {
  title: string;
  subtitle: string;
  color: string;
};

const FEATURES: Feature[] = [
  {
    title: "68 Samples",
    subtitle: "808 drums & breakbeats",
    color: COLORS.playing,
  },
  {
    title: "Waveform Editor",
    subtitle: "Chop & trim samples",
    color: COLORS.lcdBg,
  },
  {
    title: "Drag & Drop",
    subtitle: "Load your own audio",
    color: COLORS.btnRed,
  },
  {
    title: "3D View",
    subtitle: "Interactive Three.js",
    color: COLORS.padRubber,
  },
];

export const FeaturesScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.pageBg,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 140,
          opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateY(${interpolate(frame, [0, 15], [20, 0], { extrapolateRight: "clamp" })}px)`,
        }}
      >
        <h2
          style={{
            fontSize: 42,
            fontWeight: 500,
            color: COLORS.textDark,
            margin: 0,
          }}
        >
          Features
        </h2>
      </div>

      {/* Feature list */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          width: "100%",
          maxWidth: 500,
        }}
      >
        {FEATURES.map((feature, i) => {
          const delay = 15 + i * 10;
          const progress = spring({
            frame: frame - delay,
            fps,
            config: { damping: 200 },
          });

          return (
            <div
              key={feature.title}
              style={{
                backgroundColor: COLORS.chassis,
                borderRadius: 20,
                padding: "28px 32px",
                display: "flex",
                alignItems: "center",
                gap: 24,
                opacity: progress,
                transform: `translateX(${interpolate(progress, [0, 1], [-40, 0])}px)`,
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
              }}
            >
              {/* Color indicator */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: feature.color,
                  flexShrink: 0,
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)",
                }}
              />

              {/* Text */}
              <div>
                <h3
                  style={{
                    fontSize: 24,
                    fontWeight: 600,
                    color: COLORS.textDark,
                    margin: 0,
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontSize: 16,
                    color: COLORS.textMuted,
                    margin: "6px 0 0 0",
                  }}
                >
                  {feature.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
