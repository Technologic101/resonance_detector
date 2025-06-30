import { useState, useEffect, useCallback } from 'react'
import { Space, Sample } from '@/lib/types'
import { useAuth } from '@/components/auth/auth-provider'
import { useDatabase } from '@/components/providers/database-provider'

export function useSpaces() {
  const { user } = useAuth()
  const database = useDatabase()
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSpaces = useCallback(async () => {
    if (!user) {
      setSpaces([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const allSpaces = await database.getAllSpaces(user)
      setSpaces(allSpaces) // Already sorted by updated_at DESC from Supabase
    } catch (err) {
      console.error('Error loading spaces:', err)
      setError(err instanceof Error ? err.message : 'Failed to load spaces')
    } finally {
      setLoading(false)
    }
  }, [user, database])

  useEffect(() => {
    loadSpaces()
  }, [loadSpaces])

  return {
    spaces,
    loading,
    error,
    refetch: loadSpaces,
  }
}

export function useSpace(id: string | null) {
  const { user } = useAuth()
  const database = useDatabase()
  const [space, setSpace] = useState<Space | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSpace = useCallback(async () => {
    if (!id || !user) {
      setSpace(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const foundSpace = await database.getSpace(user, id)
      setSpace(foundSpace || null)
    } catch (err) {
      console.error('Error loading space:', err)
      setError(err instanceof Error ? err.message : 'Failed to load space')
    } finally {
      setLoading(false)
    }
  }, [id, user, database])

  useEffect(() => {
    loadSpace()
  }, [loadSpace])

  return {
    space,
    loading,
    error,
    refetch: loadSpace,
  }
}

export function useSamples(spaceId?: string) {
  const { user } = useAuth()
  const database = useDatabase()
  const [samples, setSamples] = useState<Sample[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSamples = useCallback(async () => {
    if (!user) {
      setSamples([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const allSamples = spaceId 
        ? await database.getSamplesForSpace(user, spaceId)
        : await database.getAllSamples(user)
      setSamples(allSamples) // Already sorted by recorded_at DESC from Supabase
    } catch (err) {
      console.error('Error loading samples:', err)
      setError(err instanceof Error ? err.message : 'Failed to load samples')
    } finally {
      setLoading(false)
    }
  }, [spaceId, user, database])

  useEffect(() => {
    loadSamples()
  }, [loadSamples])

  return {
    samples,
    loading,
    error,
    refetch: loadSamples,
  }
}

export function useStats() {
  const { user } = useAuth()
  const database = useDatabase()
  const [stats, setStats] = useState({
    spaceCount: 0,
    sampleCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    if (!user) {
      setStats({ spaceCount: 0, sampleCount: 0 })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const [spaceCount, sampleCount] = await Promise.all([
        database.getSpaceCount(user),
        database.getSampleCount(user),
      ])
      
      setStats({ spaceCount, sampleCount })
    } catch (err) {
      console.error('Error loading stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to load stats')
      // Set default values on error
      setStats({ spaceCount: 0, sampleCount: 0 })
    } finally {
      setLoading(false)
    }
  }, [user, database])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return {
    stats,
    loading,
    error,
    refetch: loadStats,
  }
}

export function useRecentSamples(limit: number = 5) {
  const { user } = useAuth()
  const database = useDatabase()
  const [samples, setSamples] = useState<Sample[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRecentSamples = useCallback(async () => {
    if (!user) {
      setSamples([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const recentSamples = await database.getRecentSamples(user, limit)
      setSamples(recentSamples)
    } catch (err) {
      console.error('Error loading recent samples:', err)
      setError(err instanceof Error ? err.message : 'Failed to load recent samples')
      // Set empty array on error
      setSamples([])
    } finally {
      setLoading(false)
    }
  }, [limit, user, database])

  useEffect(() => {
    loadRecentSamples()
  }, [loadRecentSamples])

  return {
    samples,
    loading,
    error,
    refetch: loadRecentSamples,
  }
}