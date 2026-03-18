import React, { createContext, useContext, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import type { TokenResponse } from '@/client/types.gen'
import { login as loginApi, logout as logoutApi, oauthCallback, refreshToken as refreshTokenApi } from '@/client/sdk.gen'

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  EXPIRES_AT: 'expires_at',
} as const

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  basicLogin: (email: string, password: string) => Promise<void>
  oauthLogin: (provider: string, code: string, state: string, redirectUri: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Restore auth state on app load
  useEffect(() => {
    const restoreAuth = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      const refreshTok = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
      const expiresAt = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT)

      if (!token || !refreshTok || !expiresAt) {
        setIsLoading(false)
        return
      }

      const expiresAtMs = parseInt(expiresAt, 10)

      // If the access token is already expired, try a silent refresh before giving up
      if (Date.now() >= expiresAtMs) {
        try {
          const { data } = await refreshTokenApi({
            throwOnError: true,
            body: { refresh_token: refreshTok },
          })
          storeTokens(data)
        } catch {
          clearAuthData()
        } finally {
          setIsLoading(false)
        }
        return
      }

      // Token exists and isn't expired — trust it.
      // If it turns out to be revoked server-side, the interceptor will
      // catch the 401 on the first API call and handle refresh/logout.
      setIsAuthenticated(true)
      setIsLoading(false)
    }

    restoreAuth()
  }, [])

  // Listen for session-expired events dispatched by the response interceptor
  useEffect(() => {
    const handleSessionExpired = () => {
      clearAuthData()
    }
    window.addEventListener('auth:session-expired', handleSessionExpired)
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired)
  }, [])

  // Cross-tab sync: the native `storage` event fires when another tab modifies localStorage.
  useEffect(() => {
    const handleStorageChange = () => {
      if (!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)) {
        clearAuthData()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const clearAuthData = () => {
    setIsAuthenticated(false)
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT)
  }

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const storeTokens = (tokenData: TokenResponse) => {
    const expiresAt = Date.now() + tokenData.expires_in * 1000
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenData.access_token)
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refresh_token)
    localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString())
    setIsAuthenticated(true)
  }

  const basicLogin = async (email: string, password: string) => {
    try {
      const { data } = await loginApi({
        throwOnError: true,
        body: {
          username: email, // API expects 'username' field but uses email
          password,
          grant_type: 'password',
        },
      })
      storeTokens(data)
    } catch (error: any) {
      clearAuthData()
      throw new Error(
        error?.response?.data?.detail || error?.message || 'Login failed. Please check your credentials.'
      )
    }
  }

  const oauthLogin = async (
    provider: string,
    code: string,
    state: string,
    redirectUri: string
  ) => {
    try {
      // Exchange OAuth code for tokens
      const { data } = await oauthCallback({
        throwOnError: true,
        path: { provider },
        query: { code, state, redirect_uri: redirectUri },
      })
      // flushSync forces React to synchronously commit isAuthenticated=true.
      // Without it, the callback's throw redirect fires before the batched
      // state update commits, so the router evaluates _auth's beforeLoad
      // with stale context (isAuthenticated still false) and bounces to /login.
      flushSync(() => storeTokens(data))
    } catch (error: any) {
      clearAuthData()
      throw new Error(
        error?.response?.data?.detail ||
        error?.message ||
        'Authentication failed. Please try again.'
      )
    }
  }

  const logout = async () => {
    try {
      const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
      if (storedRefreshToken) {
        await logoutApi({
          body: {
            refresh_token: storedRefreshToken,
          },
        })
      }
    } catch (error) {
      // Even if logout API fails, we still clear local state
      console.error('Logout API failed:', error)
    } finally {
      clearAuthData()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        basicLogin,
        oauthLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
