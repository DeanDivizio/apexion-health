"use client"

import React, { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import Image from "next/image"

const colors = ["#00FF5F", "#2EFF7C", "#0866E8", "#08525C", "#04D3C4"]
const blobCount = 24

const rnd = (min: number, max: number) => Math.random() * (max - min) + min

const Blob = ({ id }: { id: number }) => {
  const color = colors[Math.floor(Math.random() * colors.length)]
  const size = `${rnd(200, 500)}px`
  
  return (
    <motion.div
      key={id}
      className="fixed rounded-full mix-blend-multiply filter blur-lg"
      initial={{
        x: `${rnd(-20, 120)}%`,
        y: `${rnd(-20, 120)}%`,
      }}
      animate={{
        x: [
          `${rnd(-20, 1500)}%`,
          `${rnd(-20, 1500)}%`,
          `${rnd(-20, 1500)}%`,
          `${rnd(-20, 1500)}%`
        ],
        y: [
          `${rnd(-20, 400)}%`,
          `${rnd(-20, 400)}%`,
          `${rnd(-20, 400)}%`,
          `${rnd(-20, 400)}%`
        ],
        scale: [1, 1.4, 0.8, 1],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: rnd(500, 1000),
        ease: "linear",
        repeat: Infinity,
        repeatType: "loop",
      }}
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        opacity: 0.2,
      }}
    />
  )
}

export default function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateBlobPositions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        containerRef.current.style.setProperty('--container-width', `${width}px`)
        containerRef.current.style.setProperty('--container-height', `${height}px`)
      }
    }

    updateBlobPositions()
    window.addEventListener('resize', updateBlobPositions)

    return () => {
      window.removeEventListener('resize', updateBlobPositions)
    }
  }, [])

  return (
    <div ref={containerRef} className="fixed top-0 -z-10 w-full h-screen overflow-hidden bg-transparent">
      {Array.from({ length: blobCount }).map((_, i) => (
        <Blob key={i} id={i} />
      ))}
      <div className="fixed inset-0" />
      <Image
        src="/geoBG.jpg"
        alt="Background"
        layout="fill"
        objectFit="cover"
        className="opacity-15 blur-sm"
      />
    </div>
  )
}