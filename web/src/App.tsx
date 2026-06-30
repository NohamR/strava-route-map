import { useState, useCallback } from 'react'
import { Toaster, toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { useRoutes } from '@/hooks/use-routes'
import { SearchForm } from '@/components/search-form'
import { ResultsView } from '@/components/results-view'
import type { SearchParamsInput } from '@/lib/types'
import { getStoredUnits, storeUnits, type UnitSystem } from '@/lib/utils'

function App() {
  const [view, setView] = useState<'form' | 'results'>('form')
  const [lastParams, setLastParams] = useState<SearchParamsInput | null>(null)
  const [units, setUnits] = useState<UnitSystem>(getStoredUnits)
  const auth = useAuth()
  const routes = useRoutes()

  const handleSearch = useCallback(async (params: SearchParamsInput) => {
    if (!auth.token) {
      toast.error('Authenticate first')
      return
    }
    const result = await routes.search(auth.token, params)
    if (result.ok) {
      setLastParams(params)
      setView('results')
    } else {
      toast.error(result.error || 'Search failed')
    }
  }, [auth.token, routes])

  const handleResearch = useCallback(async () => {
    if (!auth.token || !lastParams) return
    const result = await routes.search(auth.token, lastParams)
    if (!result.ok) {
      toast.error(result.error || 'Re-search failed')
    }
  }, [auth.token, lastParams, routes])

  const handleNewSearch = useCallback(() => {
    routes.clear()
    setView('form')
  }, [routes])

  if (view === 'results' && routes.routes.length > 0) {
    return (
      <>
        <ResultsView
          routes={routes.routes}
          totalCount={routes.totalCount}
          adjustedBoundingBox={routes.adjustedBoundingBox}
          currentLocation={routes.currentLocation}
          onNewSearch={handleNewSearch}
          onResearch={handleResearch}
          loading={routes.loading}
          units={units}
          onToggleUnits={() => setUnits((u) => { const next = u === 'metric' ? 'imperial' : 'metric'; storeUnits(next); return next })}
        />
        <Toaster position="bottom-center" />
      </>
    )
  }

  return (
    <div className="min-h-full bg-cream text-stone font-sans antialiased overflow-y-auto">
      <SearchForm
        token={auth.token}
        authLoading={auth.loading}
        authError={auth.error}
        onSendOtp={auth.sendOtp}
        onVerifyOtp={auth.verifyOtp}
        onLogout={auth.logout}
        onSetAuthError={auth.setError}
        onSearch={handleSearch}
        loading={routes.loading}
      />
      <Toaster position="bottom-center" />
    </div>
  )
}

export default App
