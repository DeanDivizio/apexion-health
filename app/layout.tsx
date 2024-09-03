import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import Nav from "@/components/Nav";
import AnimatedBG from "@/components/AnimatedBG";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Apexion Health",
  description: "Elegant and comprehensive health data tracking.",
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <Nav />
          {children}
          <AnimatedBG />
        </body>
      </html>
    </ClerkProvider>
  )
}