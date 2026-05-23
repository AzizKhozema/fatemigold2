'use client'

import {
  createContext, useContext, useEffect,
  useState, useCallback, useRef, type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase_client'
import { getCurrentUser, signOut, type AuthUser } from '@/lib/auth'
import { useRouter, usePathname } from 'next/navigation'

type AuthContextType = {
  user:    AuthUser | null
  loading: boolean
  logout:  () => Promise<void>
  refetch: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user:    null,
  loading: true,
  logout:  async () => {},
  refetch: async () => {},
})

const PUBLIC_ROUTES = ['/login']
const ADMIN_ONLY    = ['/dashboard', '/inventory', '/sales', '/customers', '/billing', '/employees', '/labour', '/workflow', '/reports', '/ai-generator', '/design', '/wages']
const SUPER_ONLY    = ['/supervisor']
const WORKER_ONLY   = ['/worker']

// Simple in-memory cache
let cachedUser: AuthUser | null = null
let cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(cachedUser)
  const [loading, setLoading] = useState(!cachedUser)
  const router    = useRouter()
  const pathname  = usePathname()
  const mounted   = useRef(false)

  const fetchUser = useCallback(async (force = false) => {
    // Return cached user if fresh
    if (!force && cachedUser && Date.now() - cacheTime < CACHE_TTL) {
      setUser(cachedUser)
      setLoading(false)
      return cachedUser
    }
    const u = await getCurrentUser()
    cachedUser = u
    cacheTime  = Date.now()
    setUser(u)
    return u
  }, [])

  const redirectByRole = useCallback((u: AuthUser | null, path: string) => {
    if (!u) {
      if (!PUBLIC_ROUTES.includes(path)) router.replace('/login')
      return
    }
    if (u.role === 'worker') {
      if (!WORKER_ONLY.some(r => path.startsWith(r)) && !PUBLIC_ROUTES.includes(path)) {
        router.replace('/worker')
      }
    } else if (u.role === 'supervisor') {
      if (WORKER_ONLY.some(r => path.startsWith(r))) {
        router.replace('/supervisor')
      }
      if (ADMIN_ONLY.some(r => path.startsWith(r))) {
        router.replace('/supervisor')
      }
    }
  }, [router])

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUser().then(u => {
      setLoading(false)
      redirectByRole(u, pathname)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          cachedUser = null
          cacheTime  = 0
          setUser(null)
          router.replace('/login')
        } else if (event === 'SIGNED_IN' && session) {
          const u = await fetchUser(true)
          if (u) {
            if (u.role === 'admin')      router.replace('/dashboard')
            if (u.role === 'supervisor') router.replace('/supervisor')
            if (u.role === 'worker')     router.replace('/worker')
          }
        } else if (event === 'TOKEN_REFRESHED') {
          await fetchUser(true)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => {
    cachedUser = null
    cacheTime  = 0
    await signOut()
    setUser(null)
    router.replace('/login')
  }

  return (
    <AuthContext.Provider value={{
      user, loading,
      logout,
      refetch: () => fetchUser(true).then(() => {}),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}