"use client"

import { glowSize } from "@/app/constants"
import classNames from "classnames"
import { motion, useAnimationFrame } from "framer-motion"
import { useCallback, useEffect, useRef, useState, memo } from "react"

interface PadProps {
  padKey: string
  triggerKeys: string[]
  showTips: boolean
  sampleSrc: string
  customSampleName?: string
  chop?: { start: number; end: number }
  onTrackStart?: (payload: { id: string; padKey: string; sampleSrc: string; audio: HTMLAudioElement }) => void
  onTrackEnd?: (id: string) => void
  onEnterEditMode?: (padKey: string, sampleSrc: string) => void
  onFileDrop?: (padKey: string, files: File[]) => void
}

interface ActiveAudio {
  audio: HTMLAudioElement
  id: string
  onEnded: () => void
}

const createTrackId = (padKey: string) => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${padKey}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const PadComponent: React.FC<PadProps> = ({
  padKey,
  triggerKeys,
  showTips,
  sampleSrc,
  customSampleName,
  chop,
  onTrackStart,
  onTrackEnd,
  onEnterEditMode,
  onFileDrop,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const glowRef = useRef<HTMLDivElement>(null)
  const padRef = useRef<HTMLDivElement>(null)
  const activeAudios = useRef<ActiveAudio[]>([])
  const onTrackStartRef = useRef(onTrackStart)
  const onTrackEndRef = useRef(onTrackEnd)
  const maxConcurrentSounds = 8 // Limit concurrent sounds to prevent performance issues

  // Keep refs up to date
  useEffect(() => {
    onTrackStartRef.current = onTrackStart
    onTrackEndRef.current = onTrackEnd
  }, [onTrackStart, onTrackEnd])

  const triggerSample = useCallback(() => {
    if (!sampleSrc) {
      return
    }

    const audio = new Audio(sampleSrc)
    const id = createTrackId(padKey)

    // Apply chop if exists
    if (chop) {
      audio.addEventListener('loadedmetadata', () => {
        audio.currentTime = chop.start
      }, { once: true })
    }

    const handleEnded = () => {
      // console.log(`[${padKey}] handleEnded called for id: ${id}`)
      activeAudios.current = activeAudios.current.filter((entry) => entry.id !== id)
      if (activeAudios.current.length === 0) {
        // console.log(`[${padKey}] No more active audios, setting isPlaying to false`)
        setIsPlaying(false)
      }
      audio.removeEventListener("ended", handleEnded)
      onTrackEndRef.current?.(id)
    }

    // Monitor playback to stop at chop end
    let timeUpdateHandler: (() => void) | null = null
    if (chop) {
      timeUpdateHandler = () => {
        if (audio.currentTime >= chop.end) {
          audio.pause()
          handleEnded()
        }
      }
      audio.addEventListener('timeupdate', timeUpdateHandler)
    }

    activeAudios.current.push({ audio, id, onEnded: handleEnded })
    // console.log(`[${padKey}] Active audios count: ${activeAudios.current.length}`)

    // Limit the number of concurrent sounds
    if (activeAudios.current.length > maxConcurrentSounds) {
      const oldest = activeAudios.current.shift()
      if (oldest) {
        // console.log(`[${padKey}] Removing oldest audio: ${oldest.id}`)
        oldest.audio.pause()
        oldest.audio.currentTime = 0
        oldest.audio.removeEventListener("ended", oldest.onEnded)
        onTrackEndRef.current?.(oldest.id)
      }
    }

    setIsPlaying(true)
    // console.log(`[${padKey}] Calling onTrackStart for id: ${id}`)
    onTrackStartRef.current?.({ id, padKey, sampleSrc, audio })

    audio.addEventListener("ended", handleEnded)
    // console.log(`[${padKey}] Starting playback for id: ${id}`)
    const playPromise = audio.play()
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((error) => {
        console.error(`[${padKey}] Play failed for id: ${id}`, error)
        audio.removeEventListener("ended", handleEnded)
        if (timeUpdateHandler) {
          audio.removeEventListener('timeupdate', timeUpdateHandler)
        }
        handleEnded()
      })
    }
  }, [padKey, sampleSrc, chop])

  // Store triggerSample in a ref so we can use it without adding it to dependencies
  const triggerSampleRef = useRef(triggerSample)
  useEffect(() => {
    triggerSampleRef.current = triggerSample
  }, [triggerSample])

  useEffect(() => {
    // console.log(`[${padKey}] Setting up keyboard listener, triggerKeys:`, triggerKeys)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (triggerKeys.includes(event.key.toLowerCase())) {
        // console.log(`[${padKey}] Key pressed: ${event.key}`)
        triggerSampleRef.current()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      // console.log(`[${padKey}] CLEANUP - Removing keyboard listener and stopping ${activeAudios.current.length} audios`)
      window.removeEventListener("keydown", handleKeyDown)
      // Clean up any playing audio when component unmounts
      activeAudios.current.forEach(({ audio, onEnded, id }) => {
        // console.log(`[${padKey}] CLEANUP - Stopping audio id: ${id}`)
        audio.pause()
        audio.removeEventListener("ended", onEnded)
        onTrackEndRef.current?.(id)
      })
      activeAudios.current = []
    }
  }, [triggerKeys, padKey])

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (padRef.current) {
      const rect = padRef.current.getBoundingClientRect()
      setMousePosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      })
    }
  }, [])

  useAnimationFrame(() => {
    if (isHovered && glowRef.current && padRef.current) {
      glowRef.current.style.backgroundPosition = `${mousePosition.x - glowSize / 2}px ${
        mousePosition.y - glowSize / 2
      }px`
    }
  })

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    onEnterEditMode?.(padKey, sampleSrc)
  }, [padKey, sampleSrc, onEnterEditMode])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const items = Array.from(e.dataTransfer.items)
    const audioFiles: File[] = []

    const isAudioFile = (name: string) => /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(name)

    const readDirectory = async (entry: FileSystemDirectoryEntry): Promise<File[]> => {
      const files: File[] = []
      const reader = entry.createReader()

      const readEntries = (): Promise<FileSystemEntry[]> => {
        return new Promise((resolve, reject) => {
          reader.readEntries(resolve, reject)
        })
      }

      const getFile = (fileEntry: FileSystemFileEntry): Promise<File> => {
        return new Promise((resolve, reject) => {
          fileEntry.file(resolve, reject)
        })
      }

      let entries = await readEntries()
      while (entries.length > 0) {
        for (const entry of entries) {
          if (entry.isFile && isAudioFile(entry.name)) {
            const file = await getFile(entry as FileSystemFileEntry)
            files.push(file)
          } else if (entry.isDirectory) {
            const subFiles = await readDirectory(entry as FileSystemDirectoryEntry)
            files.push(...subFiles)
          }
        }
        entries = await readEntries()
      }

      return files
    }

    for (const item of items) {
      const entry = item.webkitGetAsEntry?.()
      if (entry) {
        if (entry.isDirectory) {
          const folderFiles = await readDirectory(entry as FileSystemDirectoryEntry)
          audioFiles.push(...folderFiles)
        } else if (entry.isFile && isAudioFile(entry.name)) {
          const file = item.getAsFile()
          if (file) audioFiles.push(file)
        }
      } else {
        // Fallback for browsers without webkitGetAsEntry
        const file = item.getAsFile()
        if (file && (file.type.startsWith("audio/") || isAudioFile(file.name))) {
          audioFiles.push(file)
        }
      }
    }

    // Sort by filename for consistent ordering
    audioFiles.sort((a, b) => a.name.localeCompare(b.name))

    if (audioFiles.length > 0 && onFileDrop) {
      onFileDrop(padKey, audioFiles)
    }
  }, [padKey, onFileDrop])

  return (
    <div
      className="center flex flex-col z-30 aspect-square w-full h-full"
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      onClick={triggerSample}
      onContextMenu={handleContextMenu}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      ref={padRef}
    >
      <motion.div
        className={classNames(
          "flex flex-col shadow-md transition-all ease-out rounded-[0.68vw] w-full h-full center z-30 pad relative overflow-hidden",
          {
            "pad-hovered": isHovered,
            "pad-playing": isPlaying,
            "ring-2 ring-amber-400 ring-inset": isDragOver,
          }
        )}
        animate={{
          scale: isHovered && !isPlaying ? 0.98 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {showTips && (
          <div className="grid h-full place-content-center text-white/70">
            <span className="text-[1vw] font-bold text-center drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">{padKey.toUpperCase()}</span>
            <span className="text-[0.5vw] opacity-60 text-center">{triggerKeys.join(", ")}</span>
          </div>
        )}
        {chop && (
          <div className="absolute top-[0.3vw] right-[0.3vw] bg-amber-500/90 text-black px-[0.4vw] py-[0.1vw] rounded-[0.15vw] text-[0.4vw] font-bold uppercase tracking-wider">
            CHOPPED
          </div>
        )}
        {(showTips || customSampleName) && (
          <div className="absolute bottom-[0.3vw] left-[0.3vw] right-[0.3vw] bg-black/70 text-white/90 px-[0.4vw] py-[0.15vw] rounded-[0.15vw] text-[0.45vw] font-mono truncate text-center">
            {customSampleName || sampleSrc.split("/").pop()?.replace(/\.[^/.]+$/, "")}
          </div>
        )}
        {isDragOver && (
          <div className="absolute inset-0 bg-amber-500/30 flex items-center justify-center rounded-[0.5vw]">
            <span className="text-[0.7vw] font-bold text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">DROP</span>
          </div>
        )}
        <motion.div
          ref={glowRef}
          className="absolute inset-0 z-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{
            backgroundImage:
              "radial-gradient(circle, rgb(255, 255, 255) 15%, rgba(255,255,255,0) 70%)",
            backgroundSize: `${glowSize}px ${glowSize}px`,
            backgroundRepeat: "no-repeat",
            filter: "blur(15px)",
          }}
        />
      </motion.div>
    </div>
  )
}

export const Pad = memo(PadComponent)
