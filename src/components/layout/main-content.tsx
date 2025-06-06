"use client"

import { useNavigation } from '@/lib/context/navigation-context'
import { HomePage } from '@/components/pages/home-page'
import { SpacesPage } from '@/components/pages/spaces-page'
import { RecordingPage } from '@/components/pages/recording-page'
import { AnalysisPage } from '@/components/pages/analysis-page'
import { SettingsPage } from '@/components/pages/settings-page'

export function MainContent() {
  const { currentPage } = useNavigation()

  switch (currentPage) {
    case 'home':
      return <HomePage />
    case 'spaces':
      return <SpacesPage />
    case 'recording':
      return <RecordingPage />
    case 'analysis':
      return <AnalysisPage />
    case 'settings':
      return <SettingsPage />
    default:
      return <HomePage />
  }
}