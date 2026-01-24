import { Instances } from "@react-three/drei"
import { useThree } from "@react-three/fiber"

import { Pad } from "./Pad"

type PadsProps = {
  nodes: any
  materials: any
  boxPositions: readonly [number, number, number][]
}

export function Pads({ nodes, boxPositions }: PadsProps) {
  const { raycaster, camera } = useThree()

  return (
    <Instances
      limit={boxPositions.length}
      range={boxPositions.length}
      castShadow
      receiveShadow
      geometry={nodes.Box261.geometry}
      // raycast={raycaster.intersectObject}
    >
      <meshPhysicalMaterial color="#C4B8A8" />
      {boxPositions.map((position, index) => (
        <Pad key={index} position={position} />
      ))}
    </Instances>
  )
}
