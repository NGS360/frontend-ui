import {  useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import type { VariantProps } from "class-variance-authority";


const copyableStyles = cva(
  "flex items-center [&>button]:rounded-sm [&>button]:p-[0.5em]",
  {
    variants: {
      variant: {
        default: "[&>button]:hover:bg-accent [&>button]:dark:hover:bg-accent/50",
        primary: "text-primary text-primary [&>button]:hover:bg-primary/5 [&>button]:dark:hover:bg-accent/50",
        hover: "[&>button]:hover:bg-accent [&>button]:dark:hover:bg-accent/50 [&>button]:invisible hover:[&>button]:visible",
        hoverLight: "[&>button]:hover:bg-accent [&>button]:dark:hover:bg-accent/50 [&>button]:invisible hover:[&>button]:visible text-muted-foreground",
        hoverLink: "[&>button]:hover:bg-primary/5 [&>button]:dark:hover:bg-accent/50 [&>button]:invisible hover:[&>button]:visible hover:underline text-primary group-hover:text-primary hover:text-primary"
      },
      size: {
        sm: "text-sm gap-0.25",
        md: "text-base gap-0.25",
        lg: "text-lg gap-0.25",
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
  asChild?: boolean;
}

export const CopyableText: React.FC<CopyableTextProps> = ({
  text,
  children,
  timeout = 1500,
  className,
  variant,
  size,
  asChild = false
}) => {

  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!copied) return;

    const timer = setTimeout(() => {
      setCopied(false)
    }, timeout)

    return () => clearTimeout(timer)
  }, [copied, timeout])

  const onClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
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
        {asChild ? (
          children
        ) : variant === 'hoverLink' ? (
          <a href={text} target="_blank">{children ?? text}</a>
        ) : (
          <span>
            {children ?? text}
          </span>
        )}
        <button 
          className={clsx(copied && "!visible bg-transparent")}
          onClick={(e) => onClick(e)}
        >
          {copied
            ? <Check className="size-[1em]" /> 
            : <Copy className="size-[1em]" />}
        </button>
      </div >
    </>
  )
}