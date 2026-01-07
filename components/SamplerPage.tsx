import { keyToPadMapping, padKeys } from "@/app/constants"
import { PadGrid } from "@/components/PadGrid"

export function SamplerPage({ isDark }: { isDark?: boolean }) {
  return (
    <main className="flex items-center justify-center min-h-full">
      <PadGrid padKeys={padKeys} isDark={isDark} keyToPadMapping={keyToPadMapping} />
    </main>
  )
}
