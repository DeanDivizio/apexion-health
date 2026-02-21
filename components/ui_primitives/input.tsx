import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  t9?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, t9 = false, ...props }, ref) => {
    const inputType = t9 ? "number" : type
    const numberInputClass =
      inputType === "number"
        ? "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0"
        : ""

    return (
      <input
        type={inputType}
        inputMode={t9 ? "decimal" : props.inputMode}
        pattern={t9 ? "[0-9]*" : props.pattern}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:italic focus:outline-none",
          numberInputClass,
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }