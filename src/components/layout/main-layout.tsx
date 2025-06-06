"use client"

import { NavigationProvider } from '@/lib/context/navigation-context'
import { MainContent } from './main-content'
import { BottomNavigation } from './bottom-navigation'

export function MainLayout() {
  return (
    <NavigationProvider>
      <div className="min-h-screen bg-background pb-16">
        <MainContent />
        <BottomNavigation />
      </div>
    </NavigationProvider>
  )
}