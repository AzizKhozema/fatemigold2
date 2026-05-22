'use client'

import {
  createContext, useContext, useEffect,
  useState, useCallback, type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase_client'
import { getCurrentUser, signOut, type AuthUser } from '@/lib/auth'
import { useRouter, usePathname } from 'next/navigation'

type AuthContextType = {
  user:    AuthUser | null
  loading: boolean
  logout:  () => Promise<void>
  refetch: () => Promise<AuthUser | null>
}

const AuthContext = createContext<AuthContextType>({
  user:    null,
  loading: true,
  logout:  async () => {},
  refetch: async () => null,
})

const PUBLIC_ROUTES  = ['/login']
const ADMIN_ROUTES   = ['/dashboard', '/inventory', '/sales', '/customers', '/billing', '/employees', '/labour', '/workflow', '/reports', '/ai-generator', '/design']
const SUPER_ROUTES   = ['/supervisor']
const WORKER_ROUTES  = ['/worker']

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router    = useRouter()
  const pathname  = usePathname()

  const fetchUser = useCallback(async () => {
    const u = await getCurrentUser()
    setUser(u)
    return u
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUser().then(u => {
      setLoading(false)
      if (!u && !PUBLIC_ROUTES.includes(pathname)) {
        router.replace('/login')
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
          router.replace('/login')
        } else if (event === 'SIGNED_IN') {
          const u = await fetchUser()
          if (u) {
            if (u.role === 'admin' && WORKER_ROUTES.some(r => pathname.startsWith(r))) {
              router.replace('/dashboard')
            } else if (u.role === 'supervisor' && WORKER_ROUTES.some(r => pathname.startsWith(r))) {
              router.replace('/supervisor')
            } else if (u.role === 'worker' && (
              ADMIN_ROUTES.some(r => pathname.startsWith(r)) ||
              SUPER_ROUTES.some(r => pathname.startsWith(r))
            )) {
              router.replace('/worker')
            }
          }
        }
      }
    )

    return () => subscription.unsubscribe()
    
  }, [])

  const logout = async () => {
    await signOut()
    setUser(null)
    router.replace('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, refetch: fetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}