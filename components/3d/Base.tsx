export const Base = ({ geometry }: { geometry: any }) => {
  return (
    <mesh castShadow receiveShadow geometry={geometry} position={[0.001, 12.552, 39.531]}>
      <meshStandardMaterial color="#2f2f2f" />
    </mesh>
  )
}
