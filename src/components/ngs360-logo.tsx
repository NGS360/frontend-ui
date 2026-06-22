import circosLogo from '@/img/circos_color.svg'
import { NGS360_LETTERS } from '@/lib/ngs360-brand'

interface NGS360LogoProps {
  showIcon?: boolean
  iconSize?: string
  textSize?: string
  gap?: string
  className?: string
}

export function NGS360Logo({
  showIcon = true,
  iconSize = 'h-12 w-12',
  textSize = 'text-4xl',
  gap = 'gap-3',
  className = '',
}: NGS360LogoProps) {
  return (
    <div className={`flex items-center justify-center ${gap} ${className}`}>
      {showIcon && <img src={circosLogo} alt="Circos Logo" className={iconSize} />}
      <div className="flex items-center gap-0.5">
        {NGS360_LETTERS.map(([letter, color], index) => (
          <span
            key={index}
            style={{ color }}
            className={`${textSize} font-bold tracking-tight`}
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  )
}
