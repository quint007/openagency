"use client";

import { useMemo, type CSSProperties } from 'react'

export interface CybercoreBackgroundProps {
  /** Number of animated light beams */
  beamCount?: number
}

const DEFAULT_BEAM_COUNT = 70

function seededUnit(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

const CybercoreBackground = ({ beamCount = DEFAULT_BEAM_COUNT }: CybercoreBackgroundProps) => {
  const beams = useMemo<Array<{ id: number; type: 'primary' | 'secondary'; style: CSSProperties }>>(
    () => Array.from({ length: beamCount }).map((_, i) => {
      const positionSeed = seededUnit(beamCount * 100 + i + 1)
      const widthSeed = seededUnit(beamCount * 200 + i + 1)
      const delaySeed = seededUnit(beamCount * 300 + i + 1)
      const durationSeed = seededUnit(beamCount * 400 + i + 1)
      const typeSeed = seededUnit(beamCount * 500 + i + 1)

      const riseDur = durationSeed * 3 + 5   // 5–8s rise
      const fadeDur = riseDur                // sync fade
      const type: 'primary' | 'secondary' = typeSeed < 0.15 ? 'secondary' : 'primary'
      return {
        id: i,
        type,
        style: {
          left: `${(positionSeed * 100).toFixed(4)}%`,
          width: `${Math.floor(widthSeed * 2) + 1}px`,
          animationDelay: `${(delaySeed * 6).toFixed(4)}s`,
          animationDuration: `${riseDur.toFixed(4)}s, ${fadeDur.toFixed(4)}s`,
        },
      }
    }),
    [beamCount],
  )

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .cybercore-scene {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 0;
          pointer-events: none;
          background: transparent;
        }

        .cybercore-floor {
          position: absolute;
          bottom: -50%;
          width: 200%;
          left: -50%;
          height: 100%;
          background-image: 
            linear-gradient(to right, color-mix(in srgb, var(--brand-primary) 20%, transparent) 1px, transparent 1px),
            linear-gradient(to bottom, color-mix(in srgb, var(--brand-primary) 20%, transparent) 1px, transparent 1px);
          background-size: 4rem 4rem;
          transform: perspective(600px) rotateX(60deg);
          transform-origin: center center;
          animation: moveGrid 15s linear infinite, floorGlow 4s ease-in-out infinite alternate;
          mask-image: radial-gradient(ellipse at center, black 10%, transparent 60%);
        }

        .cybercore-main-column {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          bottom: 0;
          width: 40vw;
          height: 100%;
          background: linear-gradient(to top, color-mix(in srgb, var(--brand-primary) 15%, transparent) 0%, transparent 100%);
          filter: blur(40px);
          animation: mainGlow 3s ease-in-out infinite alternate;
        }

        .cybercore-light-stream-container {
          position: absolute;
          inset: 0;
          display: flex;
          justify-content: center;
          mask-image: linear-gradient(to bottom, black 0%, black 68%, transparent 100%);
        }

        .cybercore-light-beam {
          position: absolute;
          top: 0;
          bottom: auto;
          height: 100%;
          background: linear-gradient(
            to bottom,
            color-mix(in srgb, #fff 85%, var(--brand-primary) 15%) 0%,
            color-mix(in srgb, #fff 20%, var(--brand-primary) 80%) 18%,
            color-mix(in srgb, var(--brand-primary) 28%, transparent) 52%,
            transparent 100%
          );
          border-radius: 999px;
          filter: blur(1.2px);
          animation-name: rise, fade;
          animation-iteration-count: infinite;
          animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: top center;
        }

        .cybercore-light-beam.secondary {
          background: linear-gradient(
            to bottom,
            color-mix(in srgb, #fff 70%, var(--brand-primary) 30%) 0%,
            color-mix(in srgb, #fff 15%, var(--brand-primary) 85%) 14%,
            color-mix(in srgb, var(--brand-primary) 22%, transparent) 45%,
            transparent 100%
          );
          opacity: 0.75;
        }
      `}} />
      <div
        className="cybercore-scene"
        role="img"
        aria-label="Animated cybercore grid background"
        aria-hidden="true"
      >
        <div className="cybercore-floor" />
        <div className="cybercore-main-column" />
        <div className="cybercore-light-stream-container">
          {beams.map((beam) => (
            <div
              key={beam.id}
              className={`cybercore-light-beam ${beam.type}`}
              style={beam.style}
            />
          ))}
        </div>
      </div>
    </>
  )
}

export default CybercoreBackground
