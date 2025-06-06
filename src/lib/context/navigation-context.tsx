"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'

export type NavigationPage = 'home' | 'spaces' | 'recording' | 'analysis' | 'settings'

interface NavigationContextType {
  currentPage: NavigationPage
  setCurrentPage: (page: NavigationPage) => void
  navigateToSpace: (spaceId: string) => void
  navigateToCreateSpace: () => void
  navigateToEditSpace: (spaceId: string) => void
  navigateToSample: (sampleId: string) => void
  navigateToRecording: (spaceId?: string) => void
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

  const navigateToSpace = useCallback((spaceId: string) => {
    setNavigationState({
      selectedSpaceId: spaceId,
      mode: 'view',
    })
    setCurrentPage('spaces')
  }, [])

  const navigateToCreateSpace = useCallback(() => {
    setNavigationState({
      mode: 'create',
    })
    setCurrentPage('spaces')
  }, [])

  const navigateToEditSpace = useCallback((spaceId: string) => {
    setNavigationState({
      selectedSpaceId: spaceId,
      mode: 'edit',
    })
    setCurrentPage('spaces')
  }, [])

  const navigateToSample = useCallback((sampleId: string) => {
    setNavigationState({
      selectedSampleId: sampleId,
      mode: 'view',
    })
    setCurrentPage('analysis')
  }, [])

  const navigateToRecording = useCallback((spaceId?: string) => {
    setNavigationState({
      selectedSpaceId: spaceId,
      mode: 'create',
    })
    setCurrentPage('recording')
  }, [])

  const handleSetCurrentPage = useCallback((page: NavigationPage) => {
    setCurrentPage(page)
    // Clear navigation state when switching pages
    if (page !== currentPage) {
      setNavigationState({})
    }
  }, [currentPage])

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