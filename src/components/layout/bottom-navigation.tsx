"use client"

import { Button } from '@/components/ui/button'
import { Waves, Building2, Mic, BarChart3, Settings } from 'lucide-react'
import { useNavigation, NavigationPage } from '@/lib/context/navigation-context'

const navigationItems = [
  {
    id: 'home' as NavigationPage,
    label: 'Home',
    icon: Waves,
  },
  {
    id: 'spaces' as NavigationPage,
    label: 'Spaces',
    icon: Building2,
  },
  {
    id: 'recording' as NavigationPage,
    label: 'Record',
    icon: Mic,
  },
  {
    id: 'analysis' as NavigationPage,
    label: 'Analysis',
    icon: BarChart3,
  },
  {
    id: 'settings' as NavigationPage,
    label: 'Settings',
    icon: Settings,
  },
]

export function BottomNavigation() {
  const { currentPage, setCurrentPage } = useNavigation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-card border-t border-white/10 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around py-3">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                className={`flex-col h-auto py-3 px-4 transition-all duration-300 rounded-xl ${
                  isActive 
                    ? 'icon-container text-white scale-105' 
                    : 'text-muted-foreground hover:text-white hover:bg-white/10'
                }`}
                onClick={() => setCurrentPage(item.id)}
              >
                <Icon className={`h-5 w-5 mb-1 transition-all duration-300 ${
                  isActive ? 'text-white scale-110' : ''
                }`} />
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}