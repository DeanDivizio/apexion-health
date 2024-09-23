"use client"

import React, { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import Image from "next/image"

const colors = ["#00FF5F", "#2EFF7C", "#0866E8", "#08525C", "#04D3C4"]
const blobCount = 8

const rnd = (min: number, max: number) => Math.random() * (max - min) + min

const Blob = ({ id }: { id: number }) => {
  const color = colors[Math.floor(Math.random() * colors.length)]
  
  return (
    <motion.div
      key={id}
      className="absolute rounded-full mix-blend-multiply filter blur-lg"
      animate={{
        x: [
          `${rnd(-10, 110)}%`,
          `${rnd(-10, 110)}%`,
          `${rnd(-10, 110)}%`,
          `${rnd(-10, 110)}%`
        ],
        y: [
          `${rnd(-10, 110)}%`,
          `${rnd(-10, 110)}%`,
          `${rnd(-10, 110)}%`,
          `${rnd(-10, 110)}%`
        ],
        scale: [1, 1.2, 0.8, 1],
        rotate: [0, 90, 180, 270],
      }}
      transition={{
        duration: rnd(60, 120),
        ease: "linear",
        repeat: Infinity,
        repeatType: "loop",
      }}
      style={{
        backgroundColor: color,
        width: `${rnd(300, 500)}px`,
        height: `${rnd(300, 500)}px`,
        opacity: 0.3,
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
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden bg-gray-100">
      {Array.from({ length: blobCount }).map((_, i) => (
        <Blob key={i} id={i} />
      ))}
      <div className="absolute inset-0 bg-white/50" />
      <Image
        src="/placeholder.svg?height=1080&width=1920"
        alt="Background"
        layout="fill"
        objectFit="cover"
        className="opacity-15 blur-sm"
      />
    </div>
  )
}