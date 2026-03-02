import { ReactNode } from 'react'

type OutlineProps = {
  children: ReactNode
  className?: string
}

/**
 * Outline — flexible hierarchical grouping component.
 * Groups items under customizable headers (dates, departments, statuses, etc).
 *
 * Usage:
 * <Outline>
 *   <OutlineGroup label="Feb 24 – Mar 2">
 *     <OutlineItem icon={CheckCircle} label="Job completed" />
 *     <OutlineItem icon={AlertCircle} color="warning" label="Quote pending" />
 *   </OutlineGroup>
 *   <OutlineGroup label="Feb 17 – Feb 23">
 *     <OutlineItem icon={Clock} label="Screen burning started" />
 *   </OutlineGroup>
 * </Outline>
 */
export function Outline({ children, className = '' }: OutlineProps) {
  return <div className={`flex flex-col gap-6 ${className}`}>{children}</div>
}
