import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-medium tracking-[0.02em] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-mist px-5 py-3 text-canvas shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] hover:opacity-90",
        secondary:
          "bg-transparent px-5 py-3 text-ink ring-1 ring-line/70 hover:bg-accentSoft/70",
        accent: "bg-accent px-5 py-3 text-canvas hover:bg-accent/88",
        ghost: "px-4 py-2 text-slate hover:bg-accentSoft/70 hover:text-ink"
      }
    },
    defaultVariants: {
      variant: "primary"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant }), className)} {...props} />
  )
);

Button.displayName = "Button";
