'use client'

import { useState, useCallback } from 'react'

export function useColorFilter() {
  const [selectedColorGroups, setSelectedColorGroups] = useState<string[]>([])

  const toggleColorGroup = useCallback((colorGroupName: string) => {
    setSelectedColorGroups((prev) =>
      prev.includes(colorGroupName)
        ? prev.filter((g) => g !== colorGroupName)
        : [...prev, colorGroupName]
    )
  }, [])

  const clearColorGroups = useCallback(() => setSelectedColorGroups([]), [])

  return { selectedColorGroups, toggleColorGroup, clearColorGroups }
}
