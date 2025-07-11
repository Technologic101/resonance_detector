"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ProcessingOverlay } from '@/components/ui/processing-overlay'
import { ArrowLeft, Building2 } from 'lucide-react'
import { useNavigation } from '@/lib/context/navigation-context'
import { useAuth } from '@/components/auth/auth-provider'
import { useDatabase } from '@/components/providers/database-provider'
import { SpaceType } from '@/lib/types'
import { getSpaceTypeLabel } from '@/lib/utils/space-utils'

const createSpaceSchema = z.object({
  name: z.string().min(1, 'Space name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long'),
  type: z.nativeEnum(SpaceType),
})

type CreateSpaceFormData = z.infer<typeof createSpaceSchema>

interface CreateSpaceFormProps {
  onSuccess: () => void
}

export function CreateSpaceForm({ onSuccess }: CreateSpaceFormProps) {
  const { goBack, navigateToSpace } = useNavigation()
  const { user } = useAuth()
  const database = useDatabase()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateSpaceFormData>({
    resolver: zodResolver(createSpaceSchema),
    defaultValues: {
      name: '',
      description: '',
      type: SpaceType.RESIDENTIAL,
    },
  })

  const selectedType = watch('type')

  const onSubmit = async (data: CreateSpaceFormData) => {
    if (!user) {
      alert('You must be logged in to create a space')
      return
    }

    console.log('Creating space with data:', data)
    console.log('User ID:', user.id)

    setIsSubmitting(true)
    try {
      // Verify user is authenticated before making the request
      const { data: { session } } = await database.supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session found. Please sign in again.')
      }
      
      console.log('Session verified, access token present:', !!session.access_token)
      
      // Create the space using the database instance from context
      const newSpace = await database.createSpace(user, data)
      
      console.log('Space created successfully:', newSpace.id)
      
      // Call success callback to refresh spaces list
      onSuccess()
      
      // Navigate to the newly created space
      navigateToSpace(newSpace.id)
    } catch (error) {
      console.error('Failed to create space:', error)
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('row-level security')) {
        alert('Authentication error. Please sign out and sign in again.')
      } else {
        alert(`Failed to create space: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={goBack}
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Building2 className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Create Space</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Space Name *
              </label>
              <input
                {...register('name')}
                type="text"
                id="name"
                placeholder="Enter a name for this space"
                disabled={isSubmitting}
                className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Description Field */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                id="description"
                rows={3}
                placeholder="Describe this space..."
                disabled={isSubmitting}
                className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Space Type */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Space Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(SpaceType).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setValue('type', type)}
                    disabled={isSubmitting}
                    className={`p-3 border rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedType === type
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    <div className="font-medium">{getSpaceTypeLabel(type)}</div>
                  </button>
                ))}
              </div>
              {errors.type && (
                <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Creating...' : 'Create Space'}
              </Button>
            </div>
          </form>
        </main>
      </div>

      {/* Processing Overlay */}
      <ProcessingOverlay 
        isVisible={isSubmitting}
        message="Setting up your new space..."
      />
    </>
  )
}