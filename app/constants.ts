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
  "samples/kid-be-kid/BD .wav",
  "samples/kid-be-kid/HH beatbox chorus.wav",
  "samples/kid-be-kid/HH prechorus beatbox.wav",
  "samples/kid-be-kid/PIANO.wav",
  "samples/kid-be-kid/SN.wav",
  "samples/kid-be-kid/arp.wav",
  "samples/kid-be-kid/bank2 73 blubber2.wav",
  "samples/kid-be-kid/bank2 74 chime.wav",
  "samples/kid-be-kid/bank2 77 hammond glas.wav",
  "samples/kid-be-kid/bank2 82 filter chant.wav",
  "samples/kid-be-kid/bank2 88 forbitten planet.wav",
  "samples/kid-be-kid/bass.wav",
  "samples/kid-be-kid/beat verb.wav",
  "samples/kid-be-kid/leadvocals fx.wav",
  "samples/kid-be-kid/leadvocals.wav",
  "samples/kid-be-kid/vocals 2.wav",
]

export const padSamples = padKeys.reduce((acc, key, index) => {
  const sample = sampleFiles[index % sampleFiles.length]
  acc[key] = sample
  return acc
}, {} as Record<string, string>)
