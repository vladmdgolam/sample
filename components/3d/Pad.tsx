import { sampleFiles } from "@/app/constants"
import { Instance } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useCallback, useMemo, useRef, useState } from "react"
import { InstancedMesh, MathUtils } from "three"

export const Pad = ({ position }: { position: [number, number, number] }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const instanceRef = useRef<InstancedMesh>(null)
  const [audio] = useState(() => new Audio())

  const randomSample = useMemo(() => {
    return sampleFiles[Math.floor(Math.random() * sampleFiles.length)]
  }, [])

  const playRandomSound = useCallback(() => {
    audio.src = randomSample
    audio.play()
    setIsPlaying(true)
    audio.onended = () => setIsPlaying(false)
  }, [audio, randomSample])

  useFrame(() => {
    if (instanceRef.current) {
      const targetY = isHovered ? position[1] * -5 : position[1]
      const newY = MathUtils.lerp(instanceRef.current.position.y, targetY, 0.3)
      instanceRef.current.position.setY(newY)
    }
  })

  return (
    <Instance
      ref={instanceRef}
      position={position}
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
      onClick={playRandomSound}
      // scale={isPlaying ? 0.9 : 1}
    />
  )
}
