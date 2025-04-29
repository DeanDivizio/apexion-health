import { useToast as useShadcnToast } from "@/components/ui_primitives/use-toast"

export function useToast() {
    const { toast } = useShadcnToast()

    const showToast = (title: string, description?: string, variant: "default" | "destructive" = "default") => {
        toast({
            title,
            description,
            variant,
        })
    }

    return { showToast }
} 