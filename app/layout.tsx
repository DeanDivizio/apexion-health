import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import { SidebarProvider, SidebarTrigger } from "@/components/ui_primitives/sidebar";
import { AppSidebar } from "@/components/global/Sidebar";
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
        <body className="w-full h-auto overflow-clip bg-gradient-to-br from-blue-950/20 via-neutral-950 to-neutral-950">
        <MobileHeader />
        <SubNavContextProvider>
          <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            <SidebarTrigger className="hidden md:block fixed top-1 left-1 z-20 text-neutral-700 scale-75 -translate-x-2 -translate-y-2 hover:scale-100 hover:translate-x-0 hover:translate-y-0 hover:text-green-400 hover:bg-transparent transition-all"/>
            {children}
          </SidebarProvider>
          <MobileNav />
        </SubNavContextProvider>
        <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}