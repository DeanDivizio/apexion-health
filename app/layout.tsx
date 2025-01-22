import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import Nav from "@/components/Nav";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Sidebar";
import Footer from "@/components/Footer";
import MobileNav from "@/components/MobileNav";

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
        <body className="w-full h-auto md:h-screen bg-gradient-to-br from-blue-950/20 via-neutral-950 to-neutral-950">
        <Nav />
          <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            {children}
          </SidebarProvider>
          <MobileNav />
        </body>
      </html>
    </ClerkProvider>
  )
}