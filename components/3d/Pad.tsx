import { padKeys, padSamples } from "@/app/constants"
import { Instance } from "@react-three/drei"
import { ThreeEvent, useFrame } from "@react-three/fiber"
import { useCallback, useRef, useState } from "react"
import { InstancedMesh, MathUtils } from "three"

// pad is ~132 units tall in model space
const hoverDepth = 12
const pressDepth = 30
const pressDuration = 0.12

export const Pad = ({ position, index }: { position: [number, number, number]; index: number }) => {
  const [isHovered, setIsHovered] = useState(false)
  const instanceRef = useRef<InstancedMesh>(null)
  const pressedAt = useRef(-Infinity)

  const sampleSrc = padSamples[padKeys[index]]

  const playSound = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      pressedAt.current = performance.now()
      const audio = new Audio(sampleSrc)
      audio.play().catch((error) => console.error("Playback failed", error))
    },
    [sampleSrc]
  )

  useFrame((_, delta) => {
    if (instanceRef.current) {
      const isPressed = (performance.now() - pressedAt.current) / 1000 < pressDuration
      const depth = isPressed ? pressDepth : isHovered ? hoverDepth : 0
      const newY = MathUtils.damp(instanceRef.current.position.y, position[1] - depth, 25, delta)
      instanceRef.current.position.setY(newY)
    }
  })

  return (
    <Instance
      ref={instanceRef}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation()
        setIsHovered(true)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        setIsHovered(false)
      }}
      onClick={playSound}
    />
  )
}
