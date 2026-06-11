import { Toaster as Sonner } from "sonner"
import type { ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      richColors
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--error-bg": "var(--popover)",
          "--error-text": "var(--destructive)",
          "--error-border": "color-mix(in oklab, var(--destructive) 30%, transparent)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
