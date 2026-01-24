/* eslint-disable @next/next/no-img-element */
"use client"

import { padSamples } from "@/app/constants"
import { NowPlayingDisplay } from "@/components/NowPlayingDisplay"
import { Pad } from "@/components/Pad"
import { Kbd } from "@/components/ui/kbd"
import classNames from "classnames"
import { useCallback, useEffect, useRef, useState } from "react"
import React from "react"

interface SamplerConfig {
  version: number
  chops: Record<string, { start: number; end: number }>
}

interface PadGridProps {
  padKeys: string[]
  keyToPadMapping: Record<string, string>
  isDark?: boolean
}

interface PlayingTrack {
  id: string
  padKey: string
  sampleSrc: string
  label: string
  progress: number
  duration: number
  chop?: { start: number; end: number }
}

interface TrackListener {
  audio: HTMLAudioElement
  animationFrameId: number | null
  onLoadedMetadata: () => void
}

const formatLabel = (path: string) => {
  const fileName = decodeURIComponent(path.split("/").pop() ?? path)
  return fileName.replace(/\.[^/.]+$/, "").toUpperCase()
}

export const PadGrid: React.FC<PadGridProps> = ({ padKeys, keyToPadMapping, isDark = false }) => {
  const [showTips, setShowTips] = useState(false)
  const [playingTracks, setPlayingTracks] = useState<PlayingTrack[]>([])
  const [editMode, setEditMode] = useState<{
    padKey: string
    sampleSrc: string
    sampleName?: string
    existingChop?: { start: number; end: number }
  } | null>(null)
  const [sampleChops, setSampleChops] = useState<Record<string, { start: number; end: number }>>({})
  const [customSamples, setCustomSamples] = useState<Record<string, { url: string; name: string }>>(
    {},
  )
  const trackListeners = useRef<Map<string, TrackListener>>(new Map())

  // Memoize trigger keys mapping to prevent recreating arrays on every render
  const padToTriggerKeys = React.useMemo(() => {
    const mapping: Record<string, string[]> = {}
    padKeys.forEach((key) => {
      mapping[key] = Object.entries(keyToPadMapping)
        .filter(([_, value]) => value === key)
        .map(([k]) => k)
    })
    return mapping
  }, [padKeys, keyToPadMapping])

  const cleanupTrack = useCallback((id: string) => {
    const stored = trackListeners.current.get(id)
    if (stored) {
      const { audio, animationFrameId, onLoadedMetadata } = stored
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
      }
      audio.removeEventListener("loadedmetadata", onLoadedMetadata)
      trackListeners.current.delete(id)
    }
  }, [])

  const handleTrackEndRef = useRef<(id: string) => void>()

  handleTrackEndRef.current = useCallback(
    (id: string) => {
      cleanupTrack(id)
      setPlayingTracks((prev) => prev.filter((track) => track.id !== id))
    },
    [cleanupTrack],
  )

  const handleTrackEnd = useCallback((id: string) => {
    handleTrackEndRef.current?.(id)
  }, [])

  const handleTrackStartRef =
    useRef<
      (payload: { id: string; padKey: string; sampleSrc: string; audio: HTMLAudioElement }) => void
    >()

  // Store sampleChops in ref so it's always current
  const sampleChopsRef = useRef(sampleChops)
  useEffect(() => {
    sampleChopsRef.current = sampleChops
  }, [sampleChops])

  handleTrackStartRef.current = useCallback(
    ({
      id,
      padKey,
      sampleSrc,
      audio,
    }: {
      id: string
      padKey: string
      sampleSrc: string
      audio: HTMLAudioElement
    }) => {
      const label = formatLabel(sampleSrc)

      setPlayingTracks((prev) => {
        const filtered = prev.filter((track) => track.id !== id)
        return [
          ...filtered,
          {
            id,
            padKey,
            sampleSrc,
            label,
            progress: 0,
            duration: Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0,
            chop: sampleChopsRef.current[padKey],
          },
        ]
      })

      // Use requestAnimationFrame for smooth 60fps progress updates
      const updateProgress = () => {
        if (audio.paused || audio.ended) {
          const stored = trackListeners.current.get(id)
          if (stored) {
            stored.animationFrameId = null
          }
          return
        }

        setPlayingTracks((prev) =>
          prev.map((track) => {
            if (track.id !== id) return track
            const duration =
              Number.isFinite(audio.duration) && audio.duration > 0
                ? audio.duration
                : track.duration
            const progress = duration > 0 ? audio.currentTime / duration : 0
            return {
              ...track,
              duration,
              progress: Math.min(progress, 1),
            }
          }),
        )

        const stored = trackListeners.current.get(id)
        if (stored) {
          stored.animationFrameId = requestAnimationFrame(updateProgress)
        }
      }

      const onLoadedMetadata = () => {
        setPlayingTracks((prev) =>
          prev.map((track) => (track.id === id ? { ...track, duration: audio.duration } : track)),
        )
        // Start the animation loop
        const stored = trackListeners.current.get(id)
        if (stored) {
          stored.animationFrameId = requestAnimationFrame(updateProgress)
        }
      }

      audio.addEventListener("loadedmetadata", onLoadedMetadata)

      trackListeners.current.set(id, {
        audio,
        animationFrameId: null,
        onLoadedMetadata,
      })

      // If metadata already loaded, start animation immediately
      if (audio.readyState >= 1) {
        const stored = trackListeners.current.get(id)
        if (stored) {
          stored.animationFrameId = requestAnimationFrame(updateProgress)
        }
      }
    },
    [],
  )

  const handleTrackStart = useCallback(
    (payload: { id: string; padKey: string; sampleSrc: string; audio: HTMLAudioElement }) => {
      handleTrackStartRef.current?.(payload)
    },
    [],
  )

  const handleEnterEditMode = useCallback(
    (padKey: string, sampleSrc: string) => {
      setEditMode({
        padKey,
        sampleSrc,
        sampleName: customSamples[padKey]?.name,
        existingChop: sampleChops[padKey],
      })
    },
    [sampleChops, customSamples],
  )

  const handleFileDrop = useCallback(
    (startPadKey: string, files: File[]) => {
      const startIndex = padKeys.indexOf(startPadKey)
      if (startIndex === -1) return

      const newCustomSamples: Record<string, { url: string; name: string }> = {}
      const chopsToRemove: string[] = []

      files.forEach((file, i) => {
        const targetIndex = startIndex + i
        if (targetIndex < padKeys.length) {
          const targetPadKey = padKeys[targetIndex]
          const url = URL.createObjectURL(file)
          const name = file.name.replace(/\.[^/.]+$/, "") // Remove extension
          newCustomSamples[targetPadKey] = { url, name }
          chopsToRemove.push(targetPadKey)
        }
      })

      setCustomSamples((prev) => ({
        ...prev,
        ...newCustomSamples,
      }))

      // Clear any existing chops for the affected pads
      setSampleChops((prev) => {
        const updated = { ...prev }
        chopsToRemove.forEach((key) => delete updated[key])
        return updated
      })
    },
    [padKeys],
  )

  const handleExitEditMode = useCallback(() => {
    setEditMode(null)
  }, [])

  // Export current config
  const handleExportConfig = useCallback(() => {
    const config: SamplerConfig = {
      version: 1,
      chops: sampleChops,
    }
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sampler-config-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [sampleChops])

  // Import config from JSON file
  const handleImportConfig = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string) as SamplerConfig
        if (config.version === 1 && config.chops) {
          setSampleChops(config.chops)
        }
      } catch (err) {
        console.error("Failed to parse config file:", err)
      }
    }
    reader.readAsText(file)
  }, [])

  // Prevent browser from opening files when dragging over the grid
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      // Check if it's a JSON config file
      const files = Array.from(e.dataTransfer.files)
      const jsonFile = files.find((f) => f.name.endsWith(".json"))
      if (jsonFile) {
        handleImportConfig(jsonFile)
      }
    },
    [handleImportConfig],
  )

  const handleApplyEdit = useCallback(
    (padKey: string, selection: { start: number; end: number }) => {
      // Save the chop selection for this pad
      setSampleChops((prev) => ({
        ...prev,
        [padKey]: selection,
      }))

      // Stop all currently playing audio
      trackListeners.current.forEach(({ audio }) => {
        audio.pause()
      })
      trackListeners.current.clear()

      // Clear all playing tracks
      setPlayingTracks([])
      // Exit edit mode
      setEditMode(null)
    },
    [],
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === " ") {
        event.preventDefault() // Prevent spacebar from scrolling the page
        setShowTips((prev) => !prev)
      } else if (event.key === "ArrowDown" && Object.keys(sampleChops).length > 0) {
        event.preventDefault()
        handleExportConfig()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [sampleChops, handleExportConfig])

  useEffect(() => {
    return () => {
      trackListeners.current.forEach(({ audio, animationFrameId, onLoadedMetadata }) => {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId)
        }
        audio.removeEventListener("loadedmetadata", onLoadedMetadata)
      })
      trackListeners.current.clear()
    }
  }, [])

  // Page-level drag-drop for JSON config files
  useEffect(() => {
    const handleDocDragOver = (e: DragEvent) => {
      e.preventDefault()
    }

    const handleDocDrop = (e: DragEvent) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer?.files || [])
      const jsonFile = files.find((f) => f.name.endsWith(".json"))
      if (jsonFile) {
        handleImportConfig(jsonFile)
      }
    }

    document.addEventListener("dragover", handleDocDragOver)
    document.addEventListener("drop", handleDocDrop)

    return () => {
      document.removeEventListener("dragover", handleDocDragOver)
      document.removeEventListener("drop", handleDocDrop)
    }
  }, [handleImportConfig])

  return (
    <div
      className={classNames("basis-[100vw]", {
        "md:basis-[50vw]": !isDark,
      })}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="p-[4vw] md:p-[2.5%] pb-[3vw] md:pb-[1.5%] bg-[var(--container-bg)] max-w-full relative rounded-[2vw] md:rounded-[0.5vw] grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-[1.5vw] mx-[3vw] md:mx-0 shadow-device">
        <NowPlayingDisplay
          tracks={playingTracks}
          editMode={editMode}
          onExitEditMode={handleExitEditMode}
          onApplyEdit={handleApplyEdit}
        />
        {!editMode && (
          <div className="flex flex-col gap-[0.6vw] min-h-0">
            <div className="grid grid-cols-4 pads_grid">
              {padKeys.map((key, index) => {
                const custom = customSamples[key]
                return (
                  <Pad
                    key={index}
                    padKey={key}
                    triggerKeys={padToTriggerKeys[key]}
                    showTips={showTips}
                    sampleSrc={custom?.url ?? padSamples[key]}
                    customSampleName={custom?.name}
                    chop={sampleChops[key]}
                    onTrackStart={handleTrackStart}
                    onTrackEnd={handleTrackEnd}
                    onEnterEditMode={handleEnterEditMode}
                    onFileDrop={handleFileDrop}
                  />
                )
              })}
            </div>
          </div>
        )}
        {/* Footer - hidden in edit mode */}
        {!editMode && (
          <>
            <div className="hidden md:block" /> {/* Spacer for first column */}
            <div className="flex flex-col gap-[1vw] md:gap-[0.3vw] pt-[3vw] md:pt-[0.5vw]">
              <div className="text-center md:text-left text-[2.5vw] md:text-[0.75vw] text-[var(--c-text-dark)] opacity-70">
                Samples by{" "}
                <a
                  href="https://drumboii.com/products/free-808-sample-pack"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-80 transition-opacity"
                >
                  Drumboii
                </a>{" "}
                • Made by{" "}
                <a
                  href="https://vladik.xyz/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-80 transition-opacity"
                >
                  Vlad
                </a>
              </div>
              <div className="hidden md:flex items-center gap-[0.8vw] text-[0.6vw] text-[var(--c-text-dark)] opacity-50">
                <span className="flex items-center gap-[0.25vw]">
                  <Kbd className="h-auto px-[0.35vw] py-[0.1vw] text-[0.5vw]">Space</Kbd>
                  <span>to see hotkeys</span>
                </span>
                <span className="flex items-center gap-[0.25vw]">
                  <span>press</span>
                  <Kbd className="h-auto px-[0.35vw] py-[0.1vw] text-[0.5vw]">RMB</Kbd>
                  <span>on a pad to chop</span>
                </span>
                •
                <span className="flex items-center gap-[0.25vw]">
                  <span>drop a file on a pad</span>
                </span>
                {Object.keys(sampleChops).length > 0 && (
                  <>
                    •
                    <button
                      onClick={handleExportConfig}
                      className="flex items-center gap-[0.25vw] hover:opacity-80 transition-opacity"
                    >
                      <span>export</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
