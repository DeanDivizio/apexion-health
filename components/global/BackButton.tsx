"use client"
import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui_primitives/button"

export default function BackButton() {
    const router = useRouter()
    return (
        <Button variant="ghost" onClick={() => router.back()} className="p-0 px-2 bg-transparent hover:bg-transparent active:scale-95 transition-transform touch-manipulation">
            <ChevronLeft className="w-4 h-4 text-neutral-400" />
            <p className="text-xs font-medium text-neutral-400">Back</p>
        </Button>
    )
}