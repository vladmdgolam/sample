/* eslint-disable @next/next/no-img-element */
"use client"

import { padSamples } from "@/app/constants"
import { NowPlayingDisplay } from "@/components/NowPlayingDisplay"
import { Pad } from "@/components/Pad"
import classNames from "classnames"
import { useCallback, useEffect, useRef, useState } from "react"
import React from "react"

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
  onTimeUpdate: () => void
  onLoadedMetadata: () => void
}

const formatLabel = (path: string) => {
  const fileName = decodeURIComponent(path.split("/").pop() ?? path)
  return fileName.replace(/\.[^/.]+$/, "").toUpperCase()
}

export const PadGrid: React.FC<PadGridProps> = ({ padKeys, keyToPadMapping, isDark = false }) => {
  const [showTips, setShowTips] = useState(false)
  const [playingTracks, setPlayingTracks] = useState<PlayingTrack[]>([])
  const [editMode, setEditMode] = useState<{ padKey: string; sampleSrc: string } | null>(null)
  const [sampleChops, setSampleChops] = useState<Record<string, { start: number; end: number }>>({})
  const [customSamples, setCustomSamples] = useState<Record<string, { url: string; name: string }>>({})
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
      const { audio, onTimeUpdate, onLoadedMetadata } = stored
      audio.removeEventListener("timeupdate", onTimeUpdate)
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
    [cleanupTrack]
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

      const onTimeUpdate = () => {
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
          })
        )
      }

      const onLoadedMetadata = () => {
        setPlayingTracks((prev) =>
          prev.map((track) => (track.id === id ? { ...track, duration: audio.duration } : track))
        )
      }

      audio.addEventListener("timeupdate", onTimeUpdate)
      audio.addEventListener("loadedmetadata", onLoadedMetadata)

      trackListeners.current.set(id, {
        audio,
        onTimeUpdate,
        onLoadedMetadata,
      })
    },
    []
  )

  const handleTrackStart = useCallback(
    (payload: { id: string; padKey: string; sampleSrc: string; audio: HTMLAudioElement }) => {
      handleTrackStartRef.current?.(payload)
    },
    []
  )

  const handleEnterEditMode = useCallback((padKey: string, sampleSrc: string) => {
    setEditMode({ padKey, sampleSrc })
  }, [])

  const handleFileDrop = useCallback((startPadKey: string, files: File[]) => {
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
  }, [padKeys])

  const handleExitEditMode = useCallback(() => {
    setEditMode(null)
  }, [])

  // Prevent browser from opening files when dragging over the grid
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

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
    []
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === " ") {
        event.preventDefault() // Prevent spacebar from scrolling the page
        setShowTips((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  useEffect(() => {
    return () => {
      trackListeners.current.forEach(({ audio, onTimeUpdate, onLoadedMetadata }) => {
        audio.removeEventListener("timeupdate", onTimeUpdate)
        audio.removeEventListener("loadedmetadata", onLoadedMetadata)
      })
      trackListeners.current.clear()
    }
  }, [])

  return (
    <div
      className={classNames("basis-[100vw]", {
        "md:basis-[50vw]": !isDark,
      })}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="p-[2.5%] pb-[1.5%] bg-[var(--container-bg)] max-w-full relative rounded-[0.5vw] grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-[1.5vw]">
        <NowPlayingDisplay
          tracks={playingTracks}
          editMode={editMode}
          onExitEditMode={handleExitEditMode}
          onApplyEdit={handleApplyEdit}
        />
        {!editMode && <div className="flex flex-col gap-[0.6vw] min-h-0">
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
        </div>}
        {/* Credits */}
        <div className="hidden md:block" /> {/* Spacer for first column */}
        <div className="text-left text-[0.75vw] text-[var(--c-text-dark)] opacity-60 pt-[0.5vw]">
          Samples: <a
            href="https://drumboii.com/products/free-808-sample-pack"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80 transition-opacity"
          >808 Pack by DRUMBOII</a> • Made by <a
            href="https://vladik.xyz/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80 transition-opacity"
          >Vlad</a>
        </div>
      </div>
    </div>
  )
}
