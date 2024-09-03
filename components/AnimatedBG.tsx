"use client";
import React, { useEffect } from "react";
import anime from "animejs/lib/anime.es.js";
import Image from "next/image";

const rnd = (min:number, max:number) => Math.floor(Math.random() * (max - min + 1) + min);
const colors = ["#00FF5F", "#2EFF7C", "#0866E8", "#08525C", "#04D3C4"];
const rndBorderRadius = () =>
  [...Array(4).keys()]
    .map(() => rnd(30, 85) + "%")
    .join(" ") +
  " / " +
  [...Array(4).keys()]
    .map(() => rnd(30, 85) + "%")
    .join(" ");

const createBlob = ({ id, x, y, color }) => {
  const blob = document.createElement("div");
  blob.id = `blob-${id}`;
  blob.classList.add("blob");
  blob.style.position = "absolute"; // Ensure absolute positioning for free movement
  blob.style.top = `${y}%`;
  blob.style.left = `${x}%`;
  blob.style.backgroundColor = color;
  blob.style.transform = `scale(${rnd(1.5, 2)})`;
  blob.style.borderRadius = rndBorderRadius();
  return blob;
};

const animateBlob = (id) => {
  anime({
    targets: `#blob-${id}`,
    translateX: () => `+=${rnd(-20, 20)}%`, // Smaller range for subtle movement
    translateY: () => `+=${rnd(-20, 20)}%`,
    scale: () => rnd(2, 2.35),
    rotate: () => rnd(-15, 15), // Subtle rotation for a smoother effect
    opacity: () => rnd(0.1, 0.3),
    easing: "linear",
    duration: 10000, // Longer duration for smoother transitions
    complete: () => animateBlob(id), // Loop animation
    direction: "normal",
    elasticity: 0,
  });
};

const genBlobs = () => {
  const card = document.querySelector(".card") ? document.querySelector(".card") : null;
  if (card) card.innerHTML = "";
  const blobCount = 15; // Fixed number of blobs
  [...Array(blobCount).keys()].forEach((id) => {
    const x = rnd(25, 75);
    const y = rnd(25, 75);
    const color = colors[rnd(0, colors.length)];
    const blob = createBlob({ id, x, y, color });
    if (card) card.appendChild(blob);
    animateBlob(id); // Start animation
  });
};

export default function AnimatedBG() {
  useEffect(() => {
    genBlobs();
  }, []);

  return (
    <div className="container w-full min-h-full">
        <div className="card bg-transparent"></div>
        <img className="fixed top-0 left-0 -z-10 object-cover opacity-15 blur-sm" src={"geoBG.jpg"} alt={""}/>
    </div>
  );
}
