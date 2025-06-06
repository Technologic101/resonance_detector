"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ArrowLeft, Building2 } from 'lucide-react'
import { useNavigation } from '@/lib/context/navigation-context'
import { database } from '@/lib/database'
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
  const { setCurrentPage } = useNavigation()
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
    setIsSubmitting(true)
    try {
      await database.createSpace(data)
      onSuccess()
      setCurrentPage('spaces')
    } catch (error) {
      console.error('Failed to create space:', error)
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage('spaces')}
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
              className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
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
              className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
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
                  className={`p-3 border rounded-lg text-left transition-colors ${
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
              onClick={() => setCurrentPage('spaces')}
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
  )
}