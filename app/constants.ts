export const padKeys = [
  "4",
  "5",
  "6",
  "7",
  "r",
  "t",
  "y",
  "u",
  "f",
  "g",
  "h",
  "j",
  "c",
  "v",
  "b",
  "n",
]

export const allKeys = [
  // numbers
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
  // letters
  "q",
  "w",
  "e",
  "r",
  "t",
  "y",
  "u",
  "i",
  "o",
  "p",
  "a",
  "s",
  "d",
  "f",
  "g",
  "h",
  "j",
  "k",
  "l",
  "z",
  "x",
  "c",
  "v",
  "b",
  "n",
  "m",
  // additional keys
  ",",
  ".",
  "/",
  ";",
  "'",
  "[",
  "]",
  "\\",
  "-",
  "=",
]

export const keyToPadMapping = allKeys.reduce((acc, key) => {
  if (padKeys.includes(key)) {
    // Keep original mapping for padKeys
    acc[key] = key
  } else {
    // Assign other keys to pads randomly
    const randomPadKey = padKeys[Math.floor(Math.random() * padKeys.length)]
    acc[key] = randomPadKey
  }
  return acc
}, {} as Record<string, string>)

export const glowSize = 50

export const sampleFiles = [
  "samples/808/DRUMBOII_808_BOOM.wav",
  "samples/808/DRUMBOII_808_CRUNCH.wav",
  "samples/808/DRUMBOII_808_DEEP.wav",
  "samples/808/DRUMBOII_808_SHORT.wav",
  "samples/808/DRUMBOII_BELL_BASIC.wav",
  "samples/808/DRUMBOII_BELL_DETUNE.wav",
  "samples/808/DRUMBOII_CLAP_FLOAT.wav",
  "samples/808/DRUMBOII_CLAP_LONG.wav",
  "samples/808/DRUMBOII_CLAP_SMACK.wav",
  "samples/808/DRUMBOII_CLAP_SNAP.wav",
  "samples/808/DRUMBOII_CLAVE_HIGH.wav",
  "samples/808/DRUMBOII_CLAVE_NICE.wav",
  "samples/808/DRUMBOII_CLAVE_OK.wav",
  "samples/808/DRUMBOII_CRASH_DARK.wav",
  "samples/808/DRUMBOII_CRASH_FUN.wav",
  "samples/808/DRUMBOII_CRASH_SLOPE.wav",
  "samples/808/DRUMBOII_CRASH_WEAK.wav",
  "samples/808/DRUMBOII_HAT_DARK.wav",
  "samples/808/DRUMBOII_HAT_FLYING.wav",
  "samples/808/DRUMBOII_HAT_FUN.wav",
  "samples/808/DRUMBOII_HAT_OPEN.wav",
  "samples/808/DRUMBOII_HAT_TINY.wav",
  "samples/808/DRUMBOII_KICK_808.wav",
  "samples/808/DRUMBOII_KICK_808_AGAIN.wav",
  "samples/808/DRUMBOII_KICK_BASIC.wav",
  "samples/808/DRUMBOII_KICK_DISTORTED.wav",
  "samples/808/DRUMBOII_KICK_FM.wav",
  "samples/808/DRUMBOII_KICK_MUFFLED.wav",
  "samples/808/DRUMBOII_KICK_THUD.wav",
  "samples/808/DRUMBOII_SNARE_BASIC.wav",
  "samples/808/DRUMBOII_SNARE_DEEP.wav",
  "samples/808/DRUMBOII_SNARE_DONG.wav",
  "samples/808/DRUMBOII_SNARE_WOW.wav",
  "samples/808/DRUMBOII_TOM_DRAFT.wav",
  "samples/808/DRUMBOII_TOM_FLOPPY.wav",
  "samples/808/DRUMBOII_TOM_HIGH.wav",
  "samples/808/DRUMBOII_TOM_LOW.wav",
  "samples/808/DRUMBOII_TOM_MIDDLE.wav",
  "samples/808/DRUMBOII_TOM_OVERDRIVE.wav",
  "samples/808/DRUMBOII_TOM_REVERB.wav",
  "samples/808/DRUMBOII_TOM_STIFF.wav",
  "samples/808/DRUMBOII_TOM_UGH.wav",
  "samples/808/DRUMBOII_TOM_UNUSABLE.wav",
  "samples/808/DRUMBOII_TOM_WOOD.wav",
]

// Shuffle array using Fisher-Yates algorithm
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Randomly assign samples to pads (shuffled each time app loads)
const shuffledSamples = shuffleArray(sampleFiles)

export const padSamples = padKeys.reduce((acc, key, index) => {
  acc[key] = shuffledSamples[index % shuffledSamples.length]
  return acc
}, {} as Record<string, string>)
