import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import Nav from "@/components/Nav";
import AnimatedBG from "@/components/AnimatedBG";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Apexion Health",
  description: "Elegant and comprehensive health data tracking.",
  manifest: 'manifest.json',
};

export const viewport:Viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="max-w-[100vw]">
          <Nav />
          {children}
          <AnimatedBG />
        </body>
      </html>
    </ClerkProvider>
  )
}