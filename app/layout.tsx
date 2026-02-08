import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import MobileNav from "@/components/global/MobileNav";
import {SubNavContextProvider} from "@/context/SubNavOpenContext"
import MobileHeader from "@/components/global/MobileHeader";
import { Toaster } from "@/components/ui_primitives/toaster";
import { MobileHeaderProvider } from "@/context/MobileHeaderContext";
import { MealFormProvider } from "@/context/MealFormContext";
import { Suspense } from "react";

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
    <html lang="en">
      <head>
        {/* Workaround for Next.js bug #86060 – performance.measure negative timestamp */}
        {process.env.NODE_ENV === "development" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var p=window.performance;if(!p||typeof p.measure!=="function"||p.__patched)return;var o=p.measure.bind(p);p.measure=function(){try{return o.apply(p,arguments)}catch(e){var m=(e&&e.message)||"";if(m.indexOf("negative")!==-1||m.indexOf("cannot be negative")!==-1)return;throw e}};p.__patched=true}catch(_){}})();`,
            }}
          />
        )}
      </head>
      <body className="w-full h-auto overflow-clip bg-black">
        <Suspense>
          <ClerkProvider>
            <MobileHeaderProvider>
              <MealFormProvider>
                <MobileHeader />
                <SubNavContextProvider>
                  {children}
                  <MobileNav />
                </SubNavContextProvider>
              </MealFormProvider>
            </MobileHeaderProvider>
            <Toaster />
          </ClerkProvider>
        </Suspense>
      </body>
    </html>
  )
}