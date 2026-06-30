import { useState, useCallback } from 'react'
import { TOKEN_KEY } from '@/lib/constants'
import { requestOtp, loginWithOtp } from '@/lib/api'

export function useAuth() {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const setToken = useCallback((t: string | null) => {
    if (t) {
      localStorage.setItem(TOKEN_KEY, t)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
    setTokenState(t)
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setError('')
  }, [setToken])

  const sendOtp = useCallback(async (email: string) => {
    setLoading(true)
    setError('')
    try {
      const state = await requestOtp(email)
      setLoading(false)
      return state
    } catch (err) {
      setError('Failed: ' + (err as Error).message)
      setLoading(false)
      return null
    }
  }, [])

  const verifyOtp = useCallback(async (email: string, state: string, otp: string) => {
    setLoading(true)
    setError('')
    try {
      const t = await loginWithOtp(email, state, otp)
      setToken(t)
      setLoading(false)
      return true
    } catch (err) {
      setError('Failed: ' + (err as Error).message)
      setLoading(false)
      return false
    }
  }, [setToken])

  return { token, loading, error, setError: setError as (msg: string) => void, setToken, logout, sendOtp, verifyOtp }
}
