import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import MobileNav from "@/components/global/MobileNav";
import {SubNavContextProvider} from "@/context/SubNavOpenContext"
import MobileHeader from "@/components/global/MobileHeader";
import { Toaster } from "@/components/ui_primitives/toaster";

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
        <body className="w-full h-auto overflow-clip bg-black">
        <MobileHeader />
        <SubNavContextProvider>
            {children}
          <MobileNav />
        </SubNavContextProvider>
        <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}