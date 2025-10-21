import { create } from 'zustand'
import { api } from '../utils/api'

interface User {
  id: number
  firstName: string
  lastName?: string
  username?: string
  languageCode?: string
  isPremium?: boolean
}

interface ClickResponse {
  myClicks: number
  globalClicks: number
}

interface LeaderboardEntry {
  rank: number
  username: string
  clicks: number
  tgUserId: string
}

interface AppState {
  // User state
  user: User | null
  myClicks: number
  globalClicks: number
  
  // Leaderboard state
  leaderboard: LeaderboardEntry[]
  
  // UI state
  isLoading: boolean
  error: string | null
  
  // Actions
  setUser: (user: User | null) => void
  setClicks: (myClicks: number, globalClicks: number) => void
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // API actions
  initializeApp: () => Promise<void>
  sendClick: (clicks: number) => Promise<void>
  fetchLeaderboard: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  user: null,
  myClicks: 0,
  globalClicks: 0,
  leaderboard: [],
  isLoading: false,
  error: null,

  // Actions
  setUser: (user) => set({ user }),
  setClicks: (myClicks, globalClicks) => set({ myClicks, globalClicks }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // API actions
  initializeApp: async () => {
    set({ isLoading: true, error: null })
    try {
      // Initialize with default values
      set({ myClicks: 0, globalClicks: 0, leaderboard: [] })
    } catch (error) {
      set({ error: 'Failed to initialize app' })
    } finally {
      set({ isLoading: false })
    }
  },

  sendClick: async (clicks: number) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post<ClickResponse>('/click', {
        clicks,
      })
      
      const { myClicks, globalClicks } = response.data
      set({ myClicks, globalClicks })
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to send click' })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  fetchLeaderboard: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get<{ entries: LeaderboardEntry[] }>('/leaderboard')
      set({ leaderboard: response.data.entries })
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch leaderboard' })
    } finally {
      set({ isLoading: false })
    }
  },
}))
