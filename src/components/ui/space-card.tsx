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
    if (!confirm(`Are you sure you want to delete "${space.name}"? This will also delete all associated recordings.`)) {
      return
    }

    setIsDeleting(true)
    try {
      await database.deleteSpace(space.id)
      onUpdate()
    } catch (error) {
      console.error('Failed to delete space:', error)
      // TODO: Show error toast
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRecord = () => {
    navigateToRecording(space.id)
  }

  return (
    <div className="bg-card rounded-lg border p-6 hover:shadow-md transition-shadow">
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
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
          {showMenu && (
            <div className="absolute right-0 top-8 bg-card border rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
              <button
                onClick={() => {
                  setShowMenu(false)
                  // TODO: Navigate to edit
                }}
                className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => {
                  setShowMenu(false)
                  handleDelete()
                }}
                disabled={isDeleting}
                className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
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
        >
          View Details
        </Button>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  )
}