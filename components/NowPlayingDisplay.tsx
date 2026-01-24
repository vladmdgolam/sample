/* eslint-disable @next/next/no-img-element */
"use client"

import type { FC } from "react"
import { useEffect, useRef, useState } from "react"

import { WaveformEditor } from "./WaveformEditor"

interface NowPlayingTrack {
  id: string
  padKey: string
  label: string
  progress: number
  duration: number
  sampleSrc: string
  chop?: { start: number; end: number }
}

interface EditMode {
  padKey: string
  sampleSrc: string
  sampleName?: string
  existingChop?: { start: number; end: number }
}

interface NowPlayingDisplayProps {
  tracks: NowPlayingTrack[]
  editMode?: EditMode | null
  onExitEditMode?: () => void
  onApplyEdit?: (padKey: string, selection: { start: number; end: number }) => void
}

const formatPercent = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return "0%"
  return `${Math.min(Math.round(value * 100), 100)}%`
}

const MiniWaveform: FC<{
  sampleSrc: string
  progress: number
  chop?: { start: number; end: number }
}> = ({ sampleSrc, progress, chop }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadAudio = async () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const response = await fetch(sampleSrc)
        const arrayBuffer = await response.arrayBuffer()
        const buffer = await audioContext.decodeAudioData(arrayBuffer)

        audioBufferRef.current = buffer
        setIsLoading(false)
        audioContext.close()
      } catch (error) {
        console.error("Failed to load audio for waveform:", error)
        setIsLoading(false)
      }
    }

    loadAudio()
  }, [sampleSrc])

  useEffect(() => {
    if (!audioBufferRef.current || !canvasRef.current || isLoading) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const audioBuffer = audioBufferRef.current
    const data = audioBuffer.getChannelData(0)
    const step = Math.ceil(data.length / width)
    const amp = height / 2

    ctx.clearRect(0, 0, width, height)

    // Draw green background only for chopped region
    if (chop) {
      const startX = (chop.start / audioBuffer.duration) * width
      const endX = (chop.end / audioBuffer.duration) * width
      ctx.fillStyle = "rgba(127, 255, 178, 0.15)"
      ctx.fillRect(startX, 0, endX - startX, height)
    }

    // Draw waveform in LCD green
    ctx.fillStyle = chop ? "rgba(127, 255, 178, 0.4)" : "rgba(127, 255, 178, 0.25)"
    for (let i = 0; i < width; i++) {
      let min = 1.0
      let max = -1.0
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j]
        if (datum < min) min = datum
        if (datum > max) max = datum
      }
      ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp))
    }

    // Draw progress overlay in bright LCD green
    const progressX = progress * width
    ctx.fillStyle = "rgba(127, 255, 178, 0.9)"
    for (let i = 0; i < progressX; i++) {
      let min = 1.0
      let max = -1.0
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j]
        if (datum < min) min = datum
        if (datum > max) max = datum
      }
      ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp))
    }
  }, [isLoading, progress, chop])

  if (isLoading) {
    return <div className="h-[1.5vw] w-full rounded-[0.2vw] bg-[var(--lcd-text)]/10" />
  }

  return (
    <div className="relative w-full h-[1.5vw]">
      <canvas ref={canvasRef} width={800} height={120} className="w-full h-full rounded-[0.2vw]" />
      {/* Playhead indicator */}
      {progress > 0 && progress < 1 && (
        <div
          className="absolute top-0 h-full w-[1px] bg-[var(--lcd-text)] pointer-events-none"
          style={{ left: `${progress * 100}%` }}
        >
          <div className="absolute -top-[0.15vw] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[0.15vw] border-r-[0.15vw] border-t-[0.2vw] border-l-transparent border-r-transparent border-t-[var(--lcd-text)]" />
        </div>
      )}
    </div>
  )
}

export const NowPlayingDisplay: FC<NowPlayingDisplayProps> = ({
  tracks,
  editMode,
  onExitEditMode,
  onApplyEdit,
}) => {
  if (editMode && onExitEditMode && onApplyEdit) {
    return (
      <div className="col-span-2">
        <WaveformEditor
          sampleSrc={editMode.sampleSrc}
          sampleName={editMode.sampleName}
          padKey={editMode.padKey}
          initialChop={editMode.existingChop}
          onExit={onExitEditMode}
          onApply={onApplyEdit}
        />
      </div>
    )
  }
  return (
    <div className="hidden md:block relative">
      <div className="edit-mode absolute inset-0 rounded-[0.4vw] border-4 border-[var(--c-lcd-bezel)] bg-[var(--c-lcd-bg)] p-[1vw] shadow-perfect-sm flex flex-col overflow-hidden">
        <div className="flex items-center justify-between text-[0.6vw] uppercase tracking-[0.2em] text-[var(--lcd-text)] font-mono flex-shrink-0">
          <span>NOW PLAYING</span>
          <span>{tracks.length.toString().padStart(2, "0")}</span>
        </div>
        <div className="mt-[0.8vw] grid gap-[0.5vw] overflow-y-auto flex-1 min-h-0 content-start">
          {tracks.length === 0 ? (
            <div className="flex items-center justify-center rounded-[0.2vw] border border-dashed border-[var(--lcd-text-dim)] py-[1.2vw] text-[0.7vw] uppercase tracking-[0.15em] text-[var(--lcd-text-dim)] font-mono">
              READY
            </div>
          ) : (
            tracks.map((track) => {
              const percent = Math.min(track.progress, 1)
              return (
                <div key={track.id} className="flex flex-col gap-[0.3vw] min-w-0">
                  <div className="flex items-center justify-between gap-[0.5vw] min-w-0">
                    {/* <div className="rounded-[0.2vw] bg-[var(--lcd-text)]/20 px-[0.5vw] py-[0.2vw] text-[0.6vw] font-mono font-bold tracking-[0.15em] text-[var(--lcd-text)] flex-shrink-0">
                    {track.padKey.toUpperCase()}
                  </div> */}
                    <div className="flex items-center gap-[0.5vw] text-[0.55vw] uppercase tracking-[0.1em] text-[var(--lcd-text)] font-mono min-w-0 flex-1">
                      <span className="truncate flex-1">{track.label}</span>
                      <span className="text-[var(--lcd-text-dim)] flex-shrink-0">
                        {formatPercent(percent)}
                      </span>
                    </div>
                  </div>
                  <MiniWaveform sampleSrc={track.sampleSrc} progress={percent} chop={track.chop} />
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
