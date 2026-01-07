import { useGLTF } from "@react-three/drei"
import * as THREE from "three"
import { GLTF } from "three-stdlib"

import { Base } from "./Base"
import { Pads } from "./Pads"

type GLTFResult = GLTF & {
  nodes: {
    Solid_5799002: THREE.Mesh
    Box277: THREE.Mesh
    Plane014: THREE.Mesh
    Plane015: THREE.Mesh
    Plane016: THREE.Mesh
    Extruded007: THREE.Mesh
    Plane007: THREE.Mesh
    Plane013: THREE.Mesh
    Box279: THREE.Mesh
    Box261: THREE.Mesh
    Box262: THREE.Mesh
    Box263: THREE.Mesh
    Box264: THREE.Mesh
    Box265: THREE.Mesh
    Box266: THREE.Mesh
    Box268: THREE.Mesh
    Box269: THREE.Mesh
    Box270: THREE.Mesh
    Box271: THREE.Mesh
    Box272: THREE.Mesh
    Box273: THREE.Mesh
    Box274: THREE.Mesh
    Box275: THREE.Mesh
    Box267: THREE.Mesh
    Box276: THREE.Mesh
    Volume_Mesher: THREE.Mesh
  }
  materials: {
    ["PVC Floor Glossy 001 OffWhite 400cm"]: THREE.MeshStandardMaterial
    ["Material.009"]: THREE.MeshStandardMaterial
    ["Material.015"]: THREE.MeshStandardMaterial
    ["Material.016"]: THREE.MeshStandardMaterial
    ["Material.017"]: THREE.MeshStandardMaterial
    ["Material.010"]: THREE.MeshStandardMaterial
    ["Material.013"]: THREE.MeshStandardMaterial
    ["Material.014"]: THREE.MeshStandardMaterial
    ["Material.002"]: THREE.MeshStandardMaterial
  }
}

export function Model(props: JSX.IntrinsicElements["group"]) {
  const { nodes, materials } = useGLTF("/sampler.glb") as GLTFResult

  // Define box positions
  const boxPositions = [
    [-621.141, 12.113, -537.973],
    [-340.424, 12.113, -537.973],
    [-59.706, 12.113, -537.973],
    [221.011, 12.113, -537.973],
    [-621.141, 12.113, -257.255],
    [-340.424, 12.113, -257.255],
    [221.011, 12.113, -257.255],
    [-621.141, 12.113, 23.462],
    [-340.424, 12.113, 23.462],
    [-59.706, 12.113, 23.462],
    [221.011, 12.113, 23.462],
    [-621.141, 12.113, 304.179],
    [-340.424, 12.113, 304.179],
    [-59.706, 12.113, 304.179],
    [-59.706, 12.113, -257.255],
    [221.011, 12.113, 304.179],
  ] as readonly [number, number, number][]

  return (
    <group {...props} dispose={null}>
      <group position={[14.418, 368.34, 12.348]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Volume_Mesher.geometry}
          material={materials["PVC Floor Glossy 001 OffWhite 400cm"]}
          position={[-14.418, -368.34, -12.348]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Solid_5799002.geometry}
          material={materials["PVC Floor Glossy 001 OffWhite 400cm"]}
          position={[501.82, 12.113, -257.255]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box277.geometry}
          material={materials["Material.009"]}
          position={[-59.661, -75.287, -116.897]}
        >
          {/* <mesh
            castShadow
            receiveShadow
            geometry={nodes.Plane014.geometry}
            material={materials["Material.015"]}
            position={[562.676, 58.524, 610.574]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Plane015.geometry}
            material={materials["Material.016"]}
            position={[278.901, 58.524, 610.309]}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Plane016.geometry}
            material={materials["Material.017"]}
            position={[-374.962, 58.524, 610.322]}
          /> */}
          <Base geometry={nodes.Extruded007.geometry} />
        </mesh>
        {/* <mesh
          castShadow
          receiveShadow
          geometry={nodes.Plane007.geometry}
          material={materials["Material.013"]}
          position={[501.82, 84.76, 23.462]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Plane013.geometry}
          material={materials["Material.014"]}
          position={[501.82, 71.794, 304.179]}
        /> */}
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Box279.geometry}
          material={materials["PVC Floor Glossy 001 OffWhite 400cm"]}
          position={[501.82, 15.374, 163.821]}
        />
        <Pads nodes={nodes} materials={materials} boxPositions={boxPositions} />
      </group>
    </group>
  )
}
