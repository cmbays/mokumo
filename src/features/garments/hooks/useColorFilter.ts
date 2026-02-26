'use client'

import { useState, useCallback } from 'react'

export function useColorFilter() {
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>([])

  const toggleColor = useCallback((colorId: string) => {
    setSelectedColorIds((prev) =>
      prev.includes(colorId) ? prev.filter((id) => id !== colorId) : [...prev, colorId]
    )
  }, [])

  const clearColors = useCallback(() => setSelectedColorIds([]), [])

  return { selectedColorIds, toggleColor, clearColors }
}
