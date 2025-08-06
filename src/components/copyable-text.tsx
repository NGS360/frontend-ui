import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import type { VariantProps } from "class-variance-authority";
import { Button } from "@/components/ui/button";


const copyableStyles = cva(
  "flex items-center gap-2 group",
  {
    variants: {
      variant: {
        default: "",
        primary: "text-primary group-hover:text-primary hover:text-primary",
        hover: "[&>button]:invisible hover:[&>button]:visible",
        hoverLink: "[&>button]:invisible hover:[&>button]:visible hover:underline text-primary group-hover:text-primary hover:text-primary"
      },
      size: {
        sm: "text-sm gap-1",
        md: "text-base gap-2",
        lg: "text-lg gap-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

interface CopyableTextProps
  extends VariantProps<typeof copyableStyles> {
  text: string;
  timeout?: number;
  className?: string;
  children?: React.ReactNode;
}

export const CopyableText: React.FC<CopyableTextProps> = ({
  text,
  children,
  timeout = 3000,
  className,
  variant,
  size
}) => {

  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!copied) return;

    const timer = setTimeout(() => {
      setCopied(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [copied, timeout])

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch (e) {
      console.error("Copy failed: ", e)
    }
  }

  return (
    <>
      <div className={clsx(copyableStyles({ variant, size }), className)}>
        {variant === 'hoverLink' ? (
          <a href={text} target="_blank">{children ?? text}</a>
        ) : (
          <span>
            {children ?? text}
          </span>
        )}
        <Button
          variant='ghost_no_accent'
          size='icon'
          onClick={onClick}
        >
          {copied ? <Check /> : <Copy />}
        </Button>
      </div >
    </>
  )
}