"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MoreVertical, Edit, Trash2, Mic } from 'lucide-react'
import { Space } from '@/lib/types'
import { database } from '@/lib/database'
import { useNavigation } from '@/lib/context/navigation-context'
import { getSpaceTypeLabel, formatDate } from '@/lib/utils/space-utils'

interface SpaceCardProps {
  space: Space
  onUpdate: () => void
}

export function SpaceCard({ space, onUpdate }: SpaceCardProps) {
  const { navigateToRecording } = useNavigation()
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    const confirmMessage = space.sampleIds.length > 0 
      ? `Are you sure you want to delete "${space.name}"? This will also delete ${space.sampleIds.length} associated recording(s).`
      : `Are you sure you want to delete "${space.name}"?`
    
    if (!confirm(confirmMessage)) {
      return
    }

    setIsDeleting(true)
    setShowMenu(false)
    
    try {
      console.log(`Attempting to delete space: ${space.id}`)
      await database.deleteSpace(space.id)
      console.log(`Space ${space.id} deleted successfully`)
      
      // Refresh the spaces list
      onUpdate()
    } catch (error) {
      console.error('Failed to delete space:', error)
      alert(`Failed to delete space: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRecord = () => {
    navigateToRecording(space.id)
  }

  return (
    <div className="bg-card rounded-lg border p-6 hover:shadow-md transition-shadow relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">{space.name}</h3>
          <p className="text-sm text-primary font-medium">{getSpaceTypeLabel(space.type)}</p>
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMenu(!showMenu)}
            className="h-8 w-8"
            disabled={isDeleting}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
          {showMenu && (
            <>
              <div className="absolute right-0 top-8 bg-card border rounded-lg shadow-lg py-1 z-20 min-w-[120px]">
                <button
                  onClick={() => {
                    setShowMenu(false)
                    // TODO: Navigate to edit
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 text-sm"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 text-red-600 text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
            </>
          )}
        </div>
      </div>

      {/* Description */}
      {space.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {space.description}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Mic className="h-4 w-4" />
          <span>{space.sampleIds.length} samples</span>
        </div>
        <div>
          Created {formatDate(space.createdAt)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRecord}
          className="flex-1"
          disabled={isDeleting}
        >
          <Mic className="h-4 w-4 mr-2" />
          Record
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // TODO: Navigate to space details
          }}
          disabled={isDeleting}
        >
          View Details
        </Button>
      </div>

      {/* Deleting overlay */}
      {isDeleting && (
        <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Deleting space...</p>
          </div>
        </div>
      )}
    </div>
  )
}