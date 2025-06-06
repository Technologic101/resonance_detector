"use client"

import { useNavigation } from '@/lib/context/navigation-context'
import { HomePage } from '@/components/pages/home-page'
import { SpacesPage } from '@/components/pages/spaces-page'
import { RecordingPage } from '@/components/pages/recording-page'
import { AnalysisPage } from '@/components/pages/analysis-page'
import { SettingsPage } from '@/components/pages/settings-page'
import { SampleAnalysisPage } from '@/components/pages/sample-analysis-page'

export function MainContent() {
  const { currentPage, navigationState } = useNavigation()

  // Show sample analysis page when a sample is selected
  if (currentPage === 'analysis' && navigationState.selectedSampleId) {
    return <SampleAnalysisPage />
  }

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