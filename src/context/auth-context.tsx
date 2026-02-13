import React, { createContext, useContext, useEffect, useState } from 'react'
import type { TokenResponse, UserPublic } from '@/client/types.gen'
import { getCurrentUserInfo, login as loginApi, logout as logoutApi, oauthCallback } from '@/client/sdk.gen'

interface AuthState {
  isAuthenticated: boolean
  user: UserPublic | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  basicLogin: (email: string, password: string) => Promise<void>
  oauthLogin: (provider: string, code: string, state: string, redirectUri: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  EXPIRES_AT: 'expires_at',
} as const

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Restore auth state on app load
  useEffect(() => {
    const restoreAuth = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      const refreshTok = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
      const expiresAt = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT)

      // Early exit if no stored credentials
      if (!token || !refreshTok || !expiresAt) {
        setIsLoading(false)
        return
      }

      // Check if token is expired
      if (Date.now() >= parseInt(expiresAt, 10)) {
        clearAuthData()
        setIsLoading(false)
        return
      }

      // Restore state and validate token
      setAccessToken(token)
      setRefreshToken(refreshTok)
      setIsAuthenticated(true)

      try {
        const response = await getCurrentUserInfo()
        setUser(response.data as UserPublic)
      } catch {
        // Token invalid, clear everything
        clearAuthData()
      } finally {
        setIsLoading(false)
      }
    }

    restoreAuth()
  }, [])

  const clearAuthData = () => {
    setUser(null)
    setAccessToken(null)
    setRefreshToken(null)
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

  // Helper function to store tokens and fetch user info
  const storeTokensAndFetchUser = async (tokenData: TokenResponse) => {
    // Calculate token expiration timestamp
    const expiresAt = Date.now() + tokenData.expires_in * 1000

    // Save tokens to localStorage
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenData.access_token)
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refresh_token)
    localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString())

    // Update state
    setAccessToken(tokenData.access_token)
    setRefreshToken(tokenData.refresh_token)
    setIsAuthenticated(true)

    // Fetch user information
    const userResponse = await getCurrentUserInfo()
    setUser(userResponse.data as UserPublic)
  }

  const basicLogin = async (email: string, password: string) => {
    try {
      const response = await loginApi({
        body: {
          username: email, // API expects 'username' field but uses email
          password,
          grant_type: 'password',
        },
      })

      const tokenData = response.data as TokenResponse
      await storeTokensAndFetchUser(tokenData)
    } catch (error: any) {
      clearAuthData()
      throw new Error(
        error?.response?.data?.detail || 'Login failed. Please check your credentials.'
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
      const response = await oauthCallback({
        path: { provider },
        query: { code, state, redirect_uri: redirectUri },
      })

      const tokenData = response.data as TokenResponse
      await storeTokensAndFetchUser(tokenData)
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
      // Call logout API if we have a refresh token
      if (refreshToken) {
        await logoutApi({
          body: {
            refresh_token: refreshToken,
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
        user,
        accessToken,
        refreshToken,
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
