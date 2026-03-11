import { create } from 'zustand'

// ---------------------------------------------------------------------------
// Cross-cutting UI state — sidebar, command palette, mobile drawer.
// NOT for navigational state (filters, search, pagination → URL params).
// ---------------------------------------------------------------------------

type UIState = {
  sidebarOpen: boolean
  commandPaletteOpen: boolean
}

type UIActions = {
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleCommandPalette: () => void
  setCommandPaletteOpen: (open: boolean) => void
}

export const useUIStore = create<UIState & UIActions>()((set) => ({
  sidebarOpen: true,
  commandPaletteOpen: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
}))
