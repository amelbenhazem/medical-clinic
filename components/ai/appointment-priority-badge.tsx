'use client'

import { Badge } from '@/components/ui/badge'
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react'

type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical'

interface AppointmentPriorityBadgeProps {
  urgency: UrgencyLevel
  reason?: string
  showIcon?: boolean
  className?: string
}

const urgencyConfig: Record<UrgencyLevel, {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  icon: typeof AlertTriangle
  bgColor: string
  textColor: string
}> = {
  critical: {
    label: 'URGENCE CRITIQUE',
    variant: 'destructive',
    icon: AlertCircle,
    bgColor: 'bg-red-100',
    textColor: 'text-red-800'
  },
  high: {
    label: 'URGENT',
    variant: 'destructive',
    icon: AlertTriangle,
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800'
  },
  medium: {
    label: 'MOYEN',
    variant: 'secondary',
    icon: Info,
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800'
  },
  low: {
    label: 'NON URGENT',
    variant: 'outline',
    icon: CheckCircle,
    bgColor: 'bg-green-100',
    textColor: 'text-green-800'
  }
}

export function AppointmentPriorityBadge({
  urgency,
  reason,
  showIcon = true,
  className = ''
}: AppointmentPriorityBadgeProps) {
  const config = urgencyConfig[urgency]
  const Icon = config.icon

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge
        variant={config.variant}
        className={`${config.bgColor} ${config.textColor} font-semibold flex items-center gap-1`}
      >
        {showIcon && <Icon className="h-3 w-3" />}
        {config.label}
      </Badge>
      {reason && (
        <span className="text-xs text-neutral-600 italic">
          {reason}
        </span>
      )}
    </div>
  )
}
