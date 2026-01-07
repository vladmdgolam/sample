"use client"

import { Bounds, Center, OrbitControls, RandomizedLight } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { useRef } from "react"
import { DirectionalLight } from "three"

import { Model } from "./3d/Sampler"

const shadowCameraSize = 15

const Lights = () => {
  const dirLight = useRef<DirectionalLight>(null)
  // useHelper(dirLight as any, DirectionalLightHelper, 1, "red")

  return (
    <>
      <directionalLight
        shadow-camera-left={-shadowCameraSize}
        shadow-camera-right={shadowCameraSize}
        shadow-camera-top={shadowCameraSize}
        shadow-camera-bottom={-shadowCameraSize}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        ref={dirLight}
        position={[5, 20, 8]}
        intensity={1}
        castShadow
      />
    </>
  )
}

export const Scene = () => {
  return (
    <Canvas
      camera={{ near: 0.001, far: 1000, position: [0, 10, 0] }}
      orthographic
      // shadows={{ type: PCFSoftShadowMap }}
    >
      <Lights />
      <RandomizedLight amount={2} intensity={1.5} />
      <Bounds fit observe margin={1.3}>
        <Center>
          <Model scale={0.01} />
        </Center>
      </Bounds>
      <OrbitControls />
    </Canvas>
  )
}
