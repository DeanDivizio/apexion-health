"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full [&[data-state=closed][data-dismiss-direction=default]]:slide-out-to-top-full [&[data-state=closed][data-dismiss-direction=default]]:sm:slide-out-to-right-full [&[data-state=closed][data-dismiss-direction=left]]:slide-out-to-left-full [&[data-state=closed][data-dismiss-direction=right]]:slide-out-to-right-full [&[data-state=closed][data-dismiss-direction=up]]:slide-out-to-top-full [&[data-state=closed][data-dismiss-direction=down]]:slide-out-to-bottom-full",
  {
    variants: {
      variant: {
        default:
          "border-emerald-950/90 bg-gradient-to-br from-blue-950/350 via-slate-950/50 to-black text-foreground ring-1 ring-white/10 backdrop-blur-xl rounded-xl",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  type DismissDirection = "left" | "right" | "up" | "down"
  const SWIPE_DISMISS_DISTANCE = 64
  const SWIPE_DISMISS_VELOCITY = 0.35
  const pointerStartRef = React.useRef<{
    x: number
    y: number
    time: number
    pointerId: number
  } | null>(null)
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = React.useState(false)
  const [dismissDirection, setDismissDirection] =
    React.useState<DismissDirection | null>(null)
  const [dismissQueued, setDismissQueued] = React.useState(false)

  React.useEffect(() => {
    if (!dismissQueued) return

    const timeoutId = window.setTimeout(() => {
      props.onOpenChange?.(false)
      setDismissQueued(false)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [dismissQueued, props])

  const resetDragState = React.useCallback(() => {
    pointerStartRef.current = null
    setIsDragging(false)
    setDragOffset({ x: 0, y: 0 })
    setDismissDirection(null)
    setDismissQueued(false)
  }, [])

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLLIElement>) => {
      if (event.button !== 0) return

      setDismissQueued(false)
      setDismissDirection(null)
      pointerStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        time: performance.now(),
        pointerId: event.pointerId,
      }
      setIsDragging(true)
    },
    []
  )

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLLIElement>) => {
      const start = pointerStartRef.current
      if (!start || start.pointerId !== event.pointerId) return

      setDragOffset({
        x: event.clientX - start.x,
        y: event.clientY - start.y,
      })
    },
    []
  )

  const handlePointerEnd = React.useCallback(
    (event: React.PointerEvent<HTMLLIElement>) => {
      const start = pointerStartRef.current
      if (!start || start.pointerId !== event.pointerId) return

      const deltaX = event.clientX - start.x
      const deltaY = event.clientY - start.y
      const elapsedMs = Math.max(1, performance.now() - start.time)
      const dominantDistance = Math.max(Math.abs(deltaX), Math.abs(deltaY))
      const velocity = dominantDistance / elapsedMs

      pointerStartRef.current = null
      setIsDragging(false)

      const shouldDismiss =
        dominantDistance >= SWIPE_DISMISS_DISTANCE ||
        (dominantDistance >= 24 && velocity >= SWIPE_DISMISS_VELOCITY)

      if (shouldDismiss) {
        const direction: DismissDirection =
          Math.abs(deltaX) >= Math.abs(deltaY)
            ? deltaX >= 0
              ? "right"
              : "left"
            : deltaY >= 0
              ? "down"
              : "up"
        setDismissDirection(direction)
        setDismissQueued(true)
        return
      }

      setDragOffset({ x: 0, y: 0 })
    },
    [props]
  )

  return (
    <ToastPrimitives.Root
      ref={ref}
      {...props}
      className={cn(toastVariants({ variant }), className)}
      data-dismiss-direction={dismissDirection ?? "default"}
      style={{
        ...props.style,
        transform:
          isDragging || dragOffset.x !== 0 || dragOffset.y !== 0
            ? `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`
            : undefined,
        transition: isDragging ? "none" : "transform 180ms ease-out",
        opacity: isDragging
          ? Math.max(0.6, 1 - Math.hypot(dragOffset.x, dragOffset.y) / 180)
          : undefined,
      }}
      onPointerDown={(event) => {
        props.onPointerDown?.(event)
        if (event.defaultPrevented) return
        handlePointerDown(event)
      }}
      onPointerMove={(event) => {
        props.onPointerMove?.(event)
        if (event.defaultPrevented) return
        handlePointerMove(event)
      }}
      onPointerUp={(event) => {
        props.onPointerUp?.(event)
        if (event.defaultPrevented) return
        handlePointerEnd(event)
      }}
      onPointerCancel={(event) => {
        props.onPointerCancel?.(event)
        if (event.defaultPrevented) return
        resetDragState()
      }}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
