/* eslint-disable @next/next/no-img-element */
import classNames from "classnames"
import { motion } from "framer-motion"

interface DryWetSelectorProps {
  mode: "dry" | "wet" | null
  setMode: (mode: "dry" | "wet") => void
  className?: string
}

export const DryWetSelector: React.FC<DryWetSelectorProps> = ({ mode, setMode, className }) => {
  return (
    <div
      className={classNames(
        "flex flex-col shadow-md transition-all ease-out rounded-[0.68vw] center z-30 pad relative overflow-hidden center justify-between gap-[0.42vw]",
        className
      )}
    >
      <DryWetButton mode="wet" currentMode={mode} setMode={setMode} />
      <DryWetButton mode="dry" currentMode={mode} setMode={setMode} />
    </div>
  )
}

interface DryWetButtonProps {
  mode: "dry" | "wet"
  currentMode: "dry" | "wet" | null
  setMode: (mode: "dry" | "wet") => void
}

const DryWetButton: React.FC<DryWetButtonProps> = ({ mode, currentMode, setMode }) => {
  const isActive = currentMode === mode

  return (
    <motion.div
      className={classNames("aspect-square w-full grid place-content-center p-[7%]")}
      onClick={() => setMode(mode)}
    >
      <div
        className={classNames("pad-circle rounded-full", {
          active: isActive,
        })}
      >
        <svg
          width="189"
          height="189"
          viewBox="0 0 189 189"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {mode === "dry" && (
            <path
              d="M77.8377 99.492C80.9397 99.492 82.6337 98.238 82.6337 95.026V93.684C82.6337 90.56 80.9397 89.328 77.8377 89.328H72.6017V99.492H77.8377ZM69.5217 86.82H78.0137C83.0737 86.82 85.7577 88.888 85.7577 94.41C85.7577 99.844 83.0737 102 78.0137 102H69.5217V86.82ZM88.4924 86.82H98.0184C101.406 86.82 103.232 88.514 103.232 91.528C103.232 93.926 102.132 95.466 100.064 96.038L103.782 102H100.35L96.8084 96.302H91.5724V102H88.4924V86.82ZM100.13 91.836V91.286C100.13 89.988 99.4264 89.13 97.6004 89.13H91.5724V93.97H97.6004C99.4044 93.97 100.13 93.112 100.13 91.836ZM111.139 95.686L103.879 86.82H107.399L112.811 93.508L117.893 86.82H121.017L114.219 95.686V102H111.139V95.686Z"
              fill="currentColor"
              style={{ color: "var(--dry-wet-text-color)", opacity: 0.6 }}
            />
          )}
          {mode === "wet" && (
            <path
              d="M87.0328 86.82H89.8048L85.9328 102H81.9068L78.4748 89.636L74.9328 102H71.0168L67.2768 86.82H70.3568L73.3708 99.25L76.9348 86.82H80.4988L83.9088 99.206L87.0328 86.82ZM91.8439 86.82H104.868V89.218H94.9239V93.09H102.58V95.4H94.9239V99.602H104.956V102H91.8439V86.82ZM112.432 89.328H106.228V86.82H121.716V89.328H115.512V102H112.432V89.328Z"
              fill="currentColor"
              style={{ color: "var(--dry-wet-text-color)", opacity: 0.6 }}
            />
          )}
        </svg>
      </div>
    </motion.div>
  )
}
