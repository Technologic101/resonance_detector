import { useState, useEffect, useCallback } from 'react'
import { database } from '@/lib/supabase/database'
import { Space, Sample } from '@/lib/types'

export function useSpaces() {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSpaces = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const allSpaces = await database.getAllSpaces()
      setSpaces(allSpaces) // Already sorted by updated_at DESC from Supabase
    } catch (err) {
      console.error('Error loading spaces:', err)
      setError(err instanceof Error ? err.message : 'Failed to load spaces')
    } finally {
      setLoading(false)
    }
  }, [])

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
  const [space, setSpace] = useState<Space | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSpace = useCallback(async () => {
    if (!id) {
      setSpace(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const foundSpace = await database.getSpace(id)
      setSpace(foundSpace || null)
    } catch (err) {
      console.error('Error loading space:', err)
      setError(err instanceof Error ? err.message : 'Failed to load space')
    } finally {
      setLoading(false)
    }
  }, [id])

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
  const [samples, setSamples] = useState<Sample[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSamples = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const allSamples = spaceId 
        ? await database.getSamplesForSpace(spaceId)
        : await database.getAllSamples()
      setSamples(allSamples) // Already sorted by recorded_at DESC from Supabase
    } catch (err) {
      console.error('Error loading samples:', err)
      setError(err instanceof Error ? err.message : 'Failed to load samples')
    } finally {
      setLoading(false)
    }
  }, [spaceId])

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
  const [stats, setStats] = useState({
    spaceCount: 0,
    sampleCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [spaceCount, sampleCount] = await Promise.all([
        database.getSpaceCount(),
        database.getSampleCount(),
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
  }, [])

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
  const [samples, setSamples] = useState<Sample[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRecentSamples = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const recentSamples = await database.getRecentSamples(limit)
      setSamples(recentSamples)
    } catch (err) {
      console.error('Error loading recent samples:', err)
      setError(err instanceof Error ? err.message : 'Failed to load recent samples')
      // Set empty array on error
      setSamples([])
    } finally {
      setLoading(false)
    }
  }, [limit])

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