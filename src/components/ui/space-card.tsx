"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MoreVertical, Edit, Trash2, Mic, Eye } from 'lucide-react'
import { Space } from '@/lib/types'
import { database } from '@/lib/database'
import { useNavigation } from '@/lib/context/navigation-context'
import { getSpaceTypeLabel, formatDate } from '@/lib/utils/space-utils'

interface SpaceCardProps {
  space: Space
  onUpdate: () => void
}

export function SpaceCard({ space, onUpdate }: SpaceCardProps) {
  const { navigateToRecording, navigateToSpace } = useNavigation()
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

  const handleViewSpace = () => {
    navigateToSpace(space.id)
  }

  const handleTitleClick = () => {
    navigateToSpace(space.id)
  }

  return (
    <div className="glass-card rounded-2xl p-6 hover-lift soft-shadow transition-all duration-300 relative group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <button
            onClick={handleTitleClick}
            className="text-left hover:text-primary transition-colors"
            disabled={isDeleting}
          >
            <h3 className="font-bold text-xl mb-2 hover:underline bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {space.name}
            </h3>
          </button>
          <div className="inline-block px-3 py-1 rounded-full text-sm font-medium gradient-accent text-white">
            {getSpaceTypeLabel(space.type)}
          </div>
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMenu(!showMenu)}
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/10"
            disabled={isDeleting}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
          {showMenu && (
            <>
              <div className="absolute right-0 top-8 glass-card border border-white/20 rounded-xl shadow-xl py-2 z-20 min-w-[140px]">
                <button
                  onClick={() => {
                    setShowMenu(false)
                    // TODO: Navigate to edit
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-3 text-sm transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-3 text-red-400 text-sm transition-colors"
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
        <p className="text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
          {space.description}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-6 mb-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="icon-container p-1 rounded">
            <Mic className="h-3 w-3 text-white" />
          </div>
          <span className="font-medium">{space.sampleIds.length} samples</span>
        </div>
        <div className="font-medium">
          Created {formatDate(space.createdAt)}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRecord}
          disabled={isDeleting}
          className="group/btn"
        >
          <Mic className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
          Record
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewSpace}
          disabled={isDeleting}
          className="group/btn"
        >
          <Eye className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
          View
        </Button>
      </div>

      {/* Deleting overlay */}
      {isDeleting && (
        <div className="absolute inset-0 glass rounded-2xl flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Deleting space...</p>
          </div>
        </div>
      )}
    </div>
  )
}