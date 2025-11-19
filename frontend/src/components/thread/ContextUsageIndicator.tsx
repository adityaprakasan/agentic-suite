"use client"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
// import { useContextUsageStore } from "@/stores/context-usage-store" // Store doesn't exist
import { useModelSelection } from "@/hooks/use-model-selection"
import { cn } from "@/lib/utils"

interface ContextUsageIndicatorProps {
  threadId: string
  modelName?: string
  radius?: number
  strokeWidth?: number
  className?: string
}

export const ContextUsageIndicator = ({
  threadId,
  modelName,
  radius: radiusProp = 28,
  strokeWidth: strokeWidthProp = 4,
  className,
}: ContextUsageIndicatorProps) => {
  // const contextUsage = useContextUsageStore((state) => state.getUsage(threadId)) // Store doesn't exist
  const { allModels } = useModelSelection()

  // Disabled - context usage store doesn't exist
  return null
}
