"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'

export type NavigationPage = 'home' | 'spaces' | 'recording' | 'analysis' | 'settings'

interface NavigationHistory {
  page: NavigationPage
  state?: any
}

interface NavigationContextType {
  currentPage: NavigationPage
  setCurrentPage: (page: NavigationPage) => void
  navigateToSpace: (spaceId: string) => void
  navigateToCreateSpace: () => void
  navigateToEditSpace: (spaceId: string) => void
  navigateToSample: (sampleId: string) => void
  navigateToRecording: (spaceId?: string) => void
  goBack: () => void
  navigationState: {
    selectedSpaceId?: string
    selectedSampleId?: string
    mode?: 'create' | 'edit' | 'view'
  }
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('home')
  const [navigationState, setNavigationState] = useState<{
    selectedSpaceId?: string
    selectedSampleId?: string
    mode?: 'create' | 'edit' | 'view'
  }>({})
  const [history, setHistory] = useState<NavigationHistory[]>([{ page: 'home' }])

  const navigateToSpace = useCallback((spaceId: string) => {
    setHistory(prev => [...prev, { page: currentPage, state: navigationState }])
    setNavigationState({
      selectedSpaceId: spaceId,
      mode: 'view',
    })
    setCurrentPage('spaces')
  }, [currentPage, navigationState])

  const navigateToCreateSpace = useCallback(() => {
    setHistory(prev => [...prev, { page: currentPage, state: navigationState }])
    setNavigationState({
      mode: 'create',
    })
    setCurrentPage('spaces')
  }, [currentPage, navigationState])

  const navigateToEditSpace = useCallback((spaceId: string) => {
    setHistory(prev => [...prev, { page: currentPage, state: navigationState }])
    setNavigationState({
      selectedSpaceId: spaceId,
      mode: 'edit',
    })
    setCurrentPage('spaces')
  }, [currentPage, navigationState])

  const navigateToSample = useCallback((sampleId: string) => {
    setHistory(prev => [...prev, { page: currentPage, state: navigationState }])
    setNavigationState({
      selectedSampleId: sampleId,
      mode: 'view',
    })
    setCurrentPage('analysis')
  }, [currentPage, navigationState])

  const navigateToRecording = useCallback((spaceId?: string) => {
    setHistory(prev => [...prev, { page: currentPage, state: navigationState }])
    setNavigationState({
      selectedSpaceId: spaceId,
      mode: 'create',
    })
    setCurrentPage('recording')
  }, [currentPage, navigationState])

  const goBack = useCallback(() => {
    if (history.length > 1) {
      const newHistory = [...history]
      const previous = newHistory.pop()
      const current = newHistory[newHistory.length - 1]
      
      setHistory(newHistory)
      setCurrentPage(current.page)
      setNavigationState(current.state || {})
    } else {
      // Fallback to home if no history
      setCurrentPage('home')
      setNavigationState({})
    }
  }, [history])

  const handleSetCurrentPage = useCallback((page: NavigationPage) => {
    if (page !== currentPage) {
      setHistory(prev => [...prev, { page: currentPage, state: navigationState }])
    }
    setCurrentPage(page)
    // Clear navigation state when switching pages via bottom nav
    if (page !== currentPage) {
      setNavigationState({})
    }
  }, [currentPage, navigationState])

  return (
    <NavigationContext.Provider
      value={{
        currentPage,
        setCurrentPage: handleSetCurrentPage,
        navigateToSpace,
        navigateToCreateSpace,
        navigateToEditSpace,
        navigateToSample,
        navigateToRecording,
        goBack,
        navigationState,
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}