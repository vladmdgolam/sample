import type { Config } from "tailwindcss"

function generateSpacing() {
  const spacingValues = [
    0, 0.2, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 18, 20, 23, 24,
    25, 28, 30, 32, 33, 36, 40, 43, 44, 48, 50, 52, 56, 60, 64, 72, 75, 80, 84, 88, 90, 96, 106,
    110, 192, 212,
  ]
  const spacing: { [key: string]: string } = { px: "1px" }
  spacingValues.forEach((value) => {
    spacing[value.toString()] = `${value * 5}px`
  })
  return spacing
}

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        zinc: {
          100: "rgb(244 244 245 / var(--tw-bg-opacity))",
          150: "rgb(242 242 243 / var(--tw-bg-opacity))",
          200: "rgb(228 228 231 / var(--tw-bg-opacity))",
          300: "rgb(212 212 216 / var(--tw-bg-opacity))",
          400: "rgb(161 161 170 / var(--tw-bg-opacity))",
          700: "rgb(63 63 70 / var(--tw-bg-opacity))",
          800: "rgb(39 39 42 / var(--tw-bg-opacity))",
          900: "rgb(24 24 27 / var(--tw-bg-opacity))",
          "100/10": "hsla(240, 5%, 96%, .1)",
          "200/10": "hsla(240, 6%, 90%, .1)",
          "200/20": "hsla(240, 6%, 90%, .2)",
          "200/30": "hsla(240, 6%, 90%, .3)",
          "200/50": "hsla(240, 6%, 90%, .5)",
          "200/80": "hsla(240, 6%, 90%, .8)",
        },
      },
      spacing: generateSpacing(),
    },
  },
  plugins: [],
}

export default config
