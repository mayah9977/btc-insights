'use client'

import { create } from 'zustand'

export type GuideTab = 'HOW_TO_USE' | 'DESCRIPTION'

interface SystemGuideState {
  isOpen: boolean
  activeTab: GuideTab
  hasSeen: boolean

  open: (tab: GuideTab) => void
  close: () => void
  setTab: (tab: GuideTab) => void
  markAsSeen: () => void
  initialize: () => void
}

export const useSystemGuideStore = create<SystemGuideState>((set) => ({
  isOpen: false,
  activeTab: 'HOW_TO_USE',
  hasSeen: false,

  open: (tab) =>
    set({
      isOpen: true,
      activeTab: tab,
    }),

  close: () =>
    set({
      isOpen: false,
    }),

  setTab: (tab) =>
    set({
      activeTab: tab,
    }),

  markAsSeen: () => {
    localStorage.setItem('vip_system_guide_seen', 'true')
    set({ hasSeen: true })
  },

  initialize: () => {
    const seen = localStorage.getItem('vip_system_guide_seen')
    if (seen === 'true') {
      set({ hasSeen: true })
    }
  },
}))
