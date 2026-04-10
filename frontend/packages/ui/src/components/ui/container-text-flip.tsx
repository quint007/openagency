"use client"

import { motion } from "motion/react"
import React, { useEffect, useId, useState } from "react"
import { cn } from "../../lib/utils"

export interface ContainerTextFlipProps {
  /** Array of words to cycle through in the animation */
  words?: string[]
  /** Time in milliseconds between word transitions */
  interval?: number
  /** Additional CSS classes to apply to the container */
  className?: string
  /** Additional CSS classes to apply to the text */
  textClassName?: string
  /** Duration of the transition animation in milliseconds */
  animationDuration?: number
}

export function ContainerTextFlip({
  words = ["better", "modern", "beautiful", "awesome"],
  interval = 3000,
  className,
  textClassName,
  animationDuration = 700,
}: ContainerTextFlipProps) {
  const id = useId()
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [maxWidth, setMaxWidth] = useState<number | "auto">("auto")
  const wordsRef = React.useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    // Measure all words to find the max width
    const widths = wordsRef.current.map(ref => ref?.scrollWidth || 0)
    const max = Math.max(...widths)
    if (max > 0) {
      setMaxWidth(max)
    }
  }, [words])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentWordIndex(prevIndex => (prevIndex + 1) % words.length)
    }, interval)

    return () => clearInterval(intervalId)
  }, [words, interval])

  return (
    <div className={cn("relative inline-block", className)}>
      {/* Hidden container to measure widths of all words */}
      <div className="invisible absolute flex h-0 overflow-hidden" aria-hidden="true">
        {words.map((word, index) => (
          <div
            key={`measure-${index}`}
            ref={el => {
              wordsRef.current[index] = el
            }}
            className={cn("whitespace-nowrap font-bold", textClassName)}
          >
            {word}
          </div>
        ))}
      </div>

      <motion.div
        animate={{ width: maxWidth }}
        className={cn(
          "relative inline-block text-center font-bold text-brand-primary",
          className
        )}
        key={words[currentWordIndex]}
        transition={{ duration: animationDuration / 2000 }}
      >
        <motion.div
          className={cn("inline-block", textClassName)}
          layoutId={`word-div-${words[currentWordIndex]}-${id}`}
          transition={{
            duration: animationDuration / 1000,
            ease: "easeInOut",
          }}
        >
        <motion.div className="inline-block">
          {words[currentWordIndex].split("").map((letter, index) => (
            <motion.span
              animate={{
                opacity: 1,
                filter: "blur(0px)",
              }}
              initial={{
                opacity: 0,
                filter: "blur(10px)",
              }}
              key={index}
              transition={{
                delay: index * 0.02,
              }}
            >
              {letter}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
    </div>
  )
}

export default ContainerTextFlip
