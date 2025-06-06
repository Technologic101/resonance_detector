"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Building2, Plus, Search, X } from 'lucide-react'
import { useSpaces } from '@/lib/hooks/use-database'
import { useNavigation } from '@/lib/context/navigation-context'
import { CreateSpaceForm } from '@/components/forms/create-space-form'
import { SpaceCard } from '@/components/ui/space-card'

export function SpacesPage() {
  const { spaces, loading, refetch } = useSpaces()
  const { navigateToCreateSpace, navigationState } = useNavigation()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSpaces = spaces.filter(space =>
    space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    space.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const showCreateForm = navigationState.mode === 'create'

  if (showCreateForm) {
    return <CreateSpaceForm onSuccess={refetch} />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Spaces</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Search Bar */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search spaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading spaces...</div>
          </div>
        ) : filteredSpaces.length === 0 ? (
          <div className="text-center py-12">
            {searchQuery ? (
              <>
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No spaces found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms
                </p>
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No spaces yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first space to start measuring resonance frequencies
                </p>
                <Button onClick={navigateToCreateSpace}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Space
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSpaces.map((space) => (
              <SpaceCard key={space.id} space={space} onUpdate={refetch} />
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      {!loading && spaces.length > 0 && (
        <div className="fixed bottom-20 right-6">
          <Button size="lg" className="rounded-full shadow-lg" onClick={navigateToCreateSpace}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  )
}