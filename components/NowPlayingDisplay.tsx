/* eslint-disable @next/next/no-img-element */
"use client"

import type { FC } from "react"
import { useEffect, useRef, useState, useCallback } from "react"

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

const MiniWaveform: FC<{ sampleSrc: string; progress: number; chop?: { start: number; end: number } }> = ({ sampleSrc, progress, chop }) => {
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
      <canvas
        ref={canvasRef}
        width={400}
        height={60}
        className="w-full h-full rounded-[0.2vw]"
      />
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

const WaveformEditor: FC<{ sampleSrc: string; padKey: string; onExit: () => void; onApply: (padKey: string, selection: { start: number; end: number }) => void }> = ({
  sampleSrc,
  padKey,
  onExit,
  onApply,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackPosition, setPlaybackPosition] = useState<number | null>(null)

  // Zoom and pan state
  const [zoom, setZoom] = useState(1)
  const [panOffset, setPanOffset] = useState(0) // 0-1 range, represents the start of visible area
  const lastTouchDistanceRef = useRef<number | null>(null)
  const lastTouchCenterRef = useRef<number | null>(null)

  // Convert screen X position to time (accounting for zoom/pan)
  const screenToTime = useCallback((screenX: number, rect: DOMRect) => {
    if (!audioBuffer) return 0
    const visibleDuration = audioBuffer.duration / zoom
    const visibleStart = panOffset * audioBuffer.duration
    const relativeX = screenX / rect.width
    return visibleStart + relativeX * visibleDuration
  }, [audioBuffer, zoom, panOffset])

  // Convert time to screen X position (accounting for zoom/pan)
  const timeToScreen = useCallback((time: number) => {
    if (!audioBuffer) return 0
    const visibleDuration = audioBuffer.duration / zoom
    const visibleStart = panOffset * audioBuffer.duration
    return ((time - visibleStart) / visibleDuration)
  }, [audioBuffer, zoom, panOffset])

  useEffect(() => {
    const loadAudio = async () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = audioContext

        const response = await fetch(sampleSrc)
        const arrayBuffer = await response.arrayBuffer()
        const buffer = await audioContext.decodeAudioData(arrayBuffer)

        setAudioBuffer(buffer)
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to load audio:", error)
        setIsLoading(false)
      }
    }

    loadAudio()

    return () => {
      audioContextRef.current?.close()
    }
  }, [sampleSrc])

  // Keyboard shortcuts: ESC to exit, Space to play/pause
  // Store refs to handlers for spacebar
  const handlePlayRef = useRef<() => void>()
  const handleStopRef = useRef<() => void>()

  useEffect(() => {
    handlePlayRef.current = () => {
      if (!selection || !sampleSrc || !audioBuffer) return

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      const audio = new Audio(sampleSrc)
      audioRef.current = audio

      const updatePlayhead = () => {
        if (!audioRef.current) return
        const currentTime = audioRef.current.currentTime
        setPlaybackPosition(currentTime / audioBuffer.duration)
        if (currentTime >= selection.end) {
          audioRef.current.pause()
          audioRef.current = null
          setIsPlaying(false)
          setPlaybackPosition(null)
          animationFrameRef.current = null
          return
        }
        animationFrameRef.current = requestAnimationFrame(updatePlayhead)
      }

      audio.addEventListener('loadedmetadata', () => {
        audio.currentTime = selection.start
        setIsPlaying(true)
        setPlaybackPosition(selection.start / audioBuffer.duration)
        animationFrameRef.current = requestAnimationFrame(updatePlayhead)
      }, { once: true })

      audio.addEventListener('ended', () => {
        setIsPlaying(false)
        setPlaybackPosition(null)
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
      }, { once: true })

      audio.play()
    }

    handleStopRef.current = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
        setIsPlaying(false)
        setPlaybackPosition(null)
      }
    }
  }, [selection, sampleSrc, audioBuffer])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onExit()
      } else if (e.key === " ") {
        e.preventDefault()
        e.stopPropagation()
        if (selection) {
          if (isPlaying) {
            handleStopRef.current?.()
          } else {
            handlePlayRef.current?.()
          }
        }
      } else if (e.key === "Enter" && selection) {
        e.preventDefault()
        handleStopRef.current?.()
        onApply(padKey, selection)
      }
    }
    window.addEventListener("keydown", handleKeyDown, true)
    return () => window.removeEventListener("keydown", handleKeyDown, true)
  }, [onExit, selection, isPlaying, onApply, padKey])

  useEffect(() => {
    if (!audioBuffer || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const data = audioBuffer.getChannelData(0)
    const amp = height / 2

    // Calculate visible range based on zoom and pan
    const visibleDuration = audioBuffer.duration / zoom
    const visibleStart = panOffset * audioBuffer.duration
    const visibleEnd = visibleStart + visibleDuration

    // Calculate which samples to draw
    const startSample = Math.floor((visibleStart / audioBuffer.duration) * data.length)
    const endSample = Math.ceil((visibleEnd / audioBuffer.duration) * data.length)
    const visibleSamples = endSample - startSample
    const step = Math.ceil(visibleSamples / width)

    // Dark green LCD background (retro edit mode)
    ctx.fillStyle = "#002F24"
    ctx.fillRect(0, 0, width, height)

    // Draw waveform in dim LCD green
    ctx.fillStyle = "#3D8C6A"
    for (let i = 0; i < width; i++) {
      let min = 1.0
      let max = -1.0
      const sampleStart = startSample + Math.floor((i / width) * visibleSamples)
      for (let j = 0; j < step; j++) {
        const datum = data[sampleStart + j]
        if (datum !== undefined) {
          if (datum < min) min = datum
          if (datum > max) max = datum
        }
      }
      ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp))
    }

    // Draw selection with LCD green highlight
    if (selection) {
      const startX = timeToScreen(selection.start) * width
      const endX = timeToScreen(selection.end) * width

      // Only draw if selection is visible
      if (endX >= 0 && startX <= width) {
        const clampedStartX = Math.max(0, startX)
        const clampedEndX = Math.min(width, endX)

        ctx.fillStyle = "rgba(127, 255, 178, 0.3)"
        ctx.fillRect(clampedStartX, 0, clampedEndX - clampedStartX, height)

        // Draw selection borders
        ctx.strokeStyle = "rgba(127, 255, 178, 0.8)"
        ctx.lineWidth = 2
        ctx.beginPath()
        if (startX >= 0 && startX <= width) {
          ctx.moveTo(startX, 0)
          ctx.lineTo(startX, height)
        }
        if (endX >= 0 && endX <= width) {
          ctx.moveTo(endX, 0)
          ctx.lineTo(endX, height)
        }
        ctx.stroke()
      }
    }
  }, [audioBuffer, selection, zoom, panOffset, timeToScreen])

  // Play from a specific time position to the end (or selection end if within selection)
  const playFromPosition = useCallback((startTime: number) => {
    if (!sampleSrc || !audioBuffer) return

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    const audio = new Audio(sampleSrc)
    audioRef.current = audio

    const endTime = audioBuffer.duration

    const updatePlayhead = () => {
      if (!audioRef.current) return
      const currentTime = audioRef.current.currentTime
      setPlaybackPosition(currentTime / audioBuffer.duration)

      if (currentTime >= endTime) {
        audioRef.current.pause()
        audioRef.current = null
        setIsPlaying(false)
        setPlaybackPosition(null)
        animationFrameRef.current = null
        return
      }
      animationFrameRef.current = requestAnimationFrame(updatePlayhead)
    }

    audio.addEventListener('loadedmetadata', () => {
      audio.currentTime = startTime
      setIsPlaying(true)
      setPlaybackPosition(startTime / audioBuffer.duration)
      animationFrameRef.current = requestAnimationFrame(updatePlayhead)
    }, { once: true })

    audio.addEventListener('ended', () => {
      setIsPlaying(false)
      setPlaybackPosition(null)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }, { once: true })

    audio.play()
  }, [sampleSrc, audioBuffer])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!audioBuffer || !canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const time = screenToTime(x, rect)

      // Clamp to valid range
      const clampedTime = Math.max(0, Math.min(audioBuffer.duration, time))

      setIsDragging(true)
      setDragStart(clampedTime)
      setSelection({ start: clampedTime, end: clampedTime })
    },
    [audioBuffer, screenToTime]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging || !audioBuffer || !canvasRef.current || dragStart === null) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const time = screenToTime(x, rect)

      // Clamp to valid range
      const clampedTime = Math.max(0, Math.min(audioBuffer.duration, time))

      setSelection({
        start: Math.min(dragStart, clampedTime),
        end: Math.max(dragStart, clampedTime),
      })
    },
    [isDragging, audioBuffer, dragStart, screenToTime]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)

    // If it's a point selection (click without drag), play from that position
    if (selection && Math.abs(selection.end - selection.start) < 0.01) {
      playFromPosition(selection.start)
    }
  }, [selection, playFromPosition])

  const handlePlaySelection = useCallback(() => {
    if (!selection || !sampleSrc || !audioBuffer) return

    // Stop any currently playing audio and animation
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    const audio = new Audio(sampleSrc)
    audioRef.current = audio

    const updatePlayhead = () => {
      if (!audioRef.current) return

      const currentTime = audioRef.current.currentTime
      setPlaybackPosition(currentTime / audioBuffer.duration)

      if (currentTime >= selection.end) {
        audioRef.current.pause()
        audioRef.current = null
        setIsPlaying(false)
        setPlaybackPosition(null)
        animationFrameRef.current = null
        return
      }

      animationFrameRef.current = requestAnimationFrame(updatePlayhead)
    }

    audio.addEventListener('loadedmetadata', () => {
      audio.currentTime = selection.start
      setIsPlaying(true)
      setPlaybackPosition(selection.start / audioBuffer.duration)
      animationFrameRef.current = requestAnimationFrame(updatePlayhead)
    }, { once: true })

    audio.addEventListener('ended', () => {
      setIsPlaying(false)
      setPlaybackPosition(null)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }, { once: true })

    audio.play()
  }, [selection, sampleSrc, audioBuffer])

  const handleStopPlayback = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setIsPlaying(false)
      setPlaybackPosition(null)
    }
  }, [])

  const handleApplyChop = useCallback(() => {
    if (!selection || !audioBuffer) return

    handleStopPlayback()
    onApply(padKey, selection)
  }, [selection, audioBuffer, onApply, padKey, handleStopPlayback])

  // Wheel zoom (trackpad pinch or mouse wheel with ctrl/cmd)
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (!audioBuffer || !containerRef.current) return

    // Check if it's a pinch gesture (ctrlKey is true for trackpad pinch)
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()

      const rect = containerRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseRatio = mouseX / rect.width

      // Calculate the time at mouse position before zoom
      const visibleDuration = audioBuffer.duration / zoom
      const visibleStart = panOffset * audioBuffer.duration
      const timeAtMouse = visibleStart + mouseRatio * visibleDuration

      // Adjust zoom (negative deltaY = zoom in)
      const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(1, Math.min(50, zoom * zoomDelta))

      // Calculate new pan to keep mouse position stable
      const newVisibleDuration = audioBuffer.duration / newZoom
      const newVisibleStart = timeAtMouse - mouseRatio * newVisibleDuration
      const maxPan = 1 - 1 / newZoom
      const newPan = Math.max(0, Math.min(maxPan, newVisibleStart / audioBuffer.duration))

      setZoom(newZoom)
      setPanOffset(newPan)
    } else if (zoom > 1) {
      // Regular scroll = pan when zoomed in
      e.preventDefault()
      const panDelta = e.deltaX !== 0 ? e.deltaX : e.deltaY
      const panAmount = (panDelta / 500) / zoom
      const maxPan = 1 - 1 / zoom
      setPanOffset(prev => Math.max(0, Math.min(maxPan, prev + panAmount)))
    }
  }, [audioBuffer, zoom, panOffset])

  // Touch handlers for pinch-to-zoom
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      const centerX = (touch1.clientX + touch2.clientX) / 2
      lastTouchDistanceRef.current = distance
      lastTouchCenterRef.current = centerX
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && lastTouchDistanceRef.current !== null && containerRef.current && audioBuffer) {
      e.preventDefault()

      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      const centerX = (touch1.clientX + touch2.clientX) / 2

      const rect = containerRef.current.getBoundingClientRect()
      const centerRatio = (centerX - rect.left) / rect.width

      // Calculate the time at center before zoom
      const visibleDuration = audioBuffer.duration / zoom
      const visibleStart = panOffset * audioBuffer.duration
      const timeAtCenter = visibleStart + centerRatio * visibleDuration

      // Calculate zoom change
      const scale = distance / lastTouchDistanceRef.current
      const newZoom = Math.max(1, Math.min(50, zoom * scale))

      // Calculate new pan to keep pinch center stable
      const newVisibleDuration = audioBuffer.duration / newZoom
      const newVisibleStart = timeAtCenter - centerRatio * newVisibleDuration
      const maxPan = 1 - 1 / newZoom
      const newPan = Math.max(0, Math.min(maxPan, newVisibleStart / audioBuffer.duration))

      setZoom(newZoom)
      setPanOffset(newPan)

      lastTouchDistanceRef.current = distance
      lastTouchCenterRef.current = centerX
    }
  }, [audioBuffer, zoom, panOffset])

  const handleTouchEnd = useCallback(() => {
    lastTouchDistanceRef.current = null
    lastTouchCenterRef.current = null
  }, [])

  // Native wheel event listener with passive: false to block browser zoom
  useEffect(() => {
    const container = containerRef.current
    if (!container || !audioBuffer) return

    const handleNativeWheel = (e: WheelEvent) => {
      // Block browser zoom on pinch gesture
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
      } else if (zoom > 1) {
        // Block scroll when panning
        e.preventDefault()
      }
    }

    container.addEventListener('wheel', handleNativeWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleNativeWheel)
  }, [audioBuffer, zoom])

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  return (
    <div className="edit-mode rounded-none border-4 border-[var(--c-lcd-bezel)] bg-[var(--c-lcd-bg)] p-[1.1vw] text-[var(--lcd-text)] shadow-[inset_0_2px_10px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-between mb-[0.9vw]">
        <div className="flex items-center gap-[0.6vw]">
          <div className="rounded-[0.3vw] bg-[var(--lcd-text)]/20 px-[0.6vw] py-[0.25vw] text-[0.7vw] font-mono font-semibold tracking-[0.2em]">
            {padKey.toUpperCase()}
          </div>
          <span className="text-[0.7vw] uppercase tracking-[0.15em] text-[var(--lcd-text-dim)] font-mono">Edit Mode</span>
        </div>
        <div className="flex gap-[0.6vw]">
          {isPlaying ? (
            <button
              onClick={handleStopPlayback}
              className="px-[0.9vw] py-[0.4vw] text-[0.7vw] font-mono font-semibold tracking-[0.15em] transition-colors text-[var(--lcd-text)] hover:text-[var(--lcd-text)]/80"
            >
              STOP <span className="opacity-60">(SPACE)</span>
            </button>
          ) : (
            <button
              onClick={handlePlaySelection}
              disabled={!selection}
              className="px-[0.9vw] py-[0.4vw] text-[0.7vw] font-mono font-semibold tracking-[0.15em] transition-colors text-[var(--lcd-text)] hover:text-[var(--lcd-text)]/80 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              PLAY <span className="opacity-60">(SPACE)</span>
            </button>
          )}
          {selection && (
            <button
              onClick={handleApplyChop}
              className="rounded-[var(--r-btn)] bg-[var(--lcd-text)]/20 hover:bg-[var(--lcd-text)]/30 px-[0.9vw] py-[0.4vw] text-[0.7vw] font-mono font-semibold tracking-[0.15em] transition-colors"
            >
              APPLY <span className="opacity-60">(Enter)</span>
            </button>
          )}
          <button
            onClick={onExit}
            className="rounded-[var(--r-btn)] bg-[var(--lcd-text)]/10 hover:bg-[var(--lcd-text)]/20 px-[0.9vw] py-[0.4vw] text-[0.7vw] font-mono font-semibold tracking-[0.15em] transition-colors"
          >
            EXIT <span className="opacity-60">(ESC)</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-[3vw] text-[0.75vw] uppercase tracking-[0.2em] text-[var(--lcd-text-dim)] font-mono">
          Loading...
        </div>
      ) : (
        <div
          ref={containerRef}
          className="relative"
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <canvas
            ref={canvasRef}
            width={800}
            height={200}
            className="w-full h-[10vw] rounded-[0.4vw] cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          {/* Playhead indicator */}
          {playbackPosition !== null && (() => {
            const screenPos = timeToScreen(playbackPosition * (audioBuffer?.duration || 1))
            // Only show if playhead is in visible range
            if (screenPos >= 0 && screenPos <= 1) {
              return (
                <div
                  className="absolute top-0 h-[10vw] w-[2px] bg-[var(--lcd-text)] pointer-events-none"
                  style={{ left: `${screenPos * 100}%` }}
                >
                  <div className="absolute -top-[0.3vw] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[0.3vw] border-r-[0.3vw] border-t-[0.4vw] border-l-transparent border-r-transparent border-t-[var(--lcd-text)]" />
                </div>
              )
            }
            return null
          })()}
          <div className="mt-[0.6vw] text-[0.65vw] text-[var(--lcd-text-dim)] text-center font-mono h-[1.2vw] flex items-center justify-center gap-[1vw]">
            {selection ? (
              <>Selection: {selection.start.toFixed(3)}s - {selection.end.toFixed(3)}s ({(selection.end - selection.start).toFixed(3)}s)</>
            ) : (
              <span className="opacity-40">Drag to select region • Pinch to zoom</span>
            )}
            {zoom > 1 && (
              <span className="opacity-60">Zoom: {zoom.toFixed(1)}x</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export const NowPlayingDisplay: FC<NowPlayingDisplayProps> = ({ tracks, editMode, onExitEditMode, onApplyEdit }) => {
  if (editMode && onExitEditMode && onApplyEdit) {
    return (
      <div className="col-span-2">
        <WaveformEditor sampleSrc={editMode.sampleSrc} padKey={editMode.padKey} onExit={onExitEditMode} onApply={onApplyEdit} />
      </div>
    )
  }
  return (
    <div className="hidden md:block relative">
      <div className="edit-mode absolute inset-0 rounded-none border-4 border-[var(--c-lcd-bezel)] bg-[var(--c-lcd-bg)] p-[1vw] shadow-[inset_0_2px_10px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden">
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
                  <div className="rounded-[0.2vw] bg-[var(--lcd-text)]/20 px-[0.5vw] py-[0.2vw] text-[0.6vw] font-mono font-bold tracking-[0.15em] text-[var(--lcd-text)] flex-shrink-0">
                    {track.padKey.toUpperCase()}
                  </div>
                  <div className="flex items-center gap-[0.5vw] text-[0.55vw] uppercase tracking-[0.1em] text-[var(--lcd-text)] font-mono min-w-0 flex-1">
                    <span className="truncate flex-1">{track.label}</span>
                    <span className="text-[var(--lcd-text-dim)] flex-shrink-0">{formatPercent(percent)}</span>
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
