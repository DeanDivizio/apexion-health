"use client"

import { getVariationOptionLabel, VARIATION_TEMPLATE_MAP } from "@/lib/gym"

interface VariationChipsProps {
  variations?: Record<string, string>
}

export function VariationChips({ variations }: VariationChipsProps) {
  if (!variations || Object.keys(variations).length === 0) return null

  const chips = Object.entries(variations).map(([templateId, optionKey]) => {
    const template = VARIATION_TEMPLATE_MAP.get(templateId)
    const label = template?.label ?? templateId
    const value = getVariationOptionLabel(templateId, optionKey) ?? optionKey
    const isUntracked = optionKey === "untracked"

    return (
      <span
        key={`${templateId}:${optionKey}`}
        className={`inline-flex items-center border px-1.5 py-0.5 rounded text-[10px] leading-tight ${
          isUntracked
            ? "border-red-500/50 bg-red-500/10 text-red-300"
            : "border-white/10 bg-white/5 text-muted-foreground"
        }`}
      >
        <span className={isUntracked ? "text-red-200" : "text-foreground/80"}>{label}</span>
        <span className="mx-0.5 opacity-50">:</span>
        <span>{value}</span>
      </span>
    )
  })

  return <div className="flex flex-wrap gap-1 mt-1">{chips}</div>
}
