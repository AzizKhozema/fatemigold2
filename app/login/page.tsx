'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, getRoleRedirect } from '@/lib/auth'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase_client'
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
  // Check cached session first — instant, no network call
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (session) {
      const user = await getCurrentUser()
      if (user) {
        router.replace(getRoleRedirect(user.role))
        return
      }
    }
    setChecking(false)
  })
}, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return setError('Please enter email and password')
    setLoading(true)
    setError(null)
    try {
      await signIn(email.trim(), password)
      const user = await getCurrentUser()
      if (user) router.replace(getRoleRedirect(user.role))
      else setError('Account not linked to an employee. Contact admin.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          border: '2px solid var(--border)', borderTopColor: 'var(--gold)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 60%)',
    }}>
      <div style={{ width: '100%', maxWidth: '380px', padding: '0 20px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px', color: 'var(--gold)',
            letterSpacing: '0.04em', marginBottom: '4px',
          }}>
            Fatemi Gold
          </div>
          <div style={{
            fontSize: '12px', color: 'var(--text-muted)',
            letterSpacing: '0.2em', textTransform: 'uppercase',
          }}>
            Business Suite
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface)',
          border: '0.5px solid var(--border)',
          borderRadius: '14px', padding: '32px',
        }}>
          <div style={{
            fontSize: '16px', fontWeight: 500,
            color: 'var(--text)', marginBottom: '6px',
          }}>
            Sign in
          </div>
          <div style={{
            fontSize: '13px', color: 'var(--text-muted)',
            marginBottom: '24px',
          }}>
            Enter your credentials to continue
          </div>

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                fontSize: '11px', color: 'var(--text-muted)',
                letterSpacing: '0.08em', display: 'block', marginBottom: '6px',
              }}>
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@fatemigold.com"
                autoComplete="email"
                autoFocus
                style={{
                  width: '100%', padding: '10px 14px',
                  background: 'var(--surface2)',
                  border: '0.5px solid var(--border)',
                  borderRadius: '8px', color: 'var(--text)',
                  fontSize: '14px', outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--border-bright)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                fontSize: '11px', color: 'var(--text-muted)',
                letterSpacing: '0.08em', display: 'block', marginBottom: '6px',
              }}>
                PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    width: '100%', padding: '10px 44px 10px 14px',
                    background: 'var(--surface2)',
                    border: '0.5px solid var(--border)',
                    borderRadius: '8px', color: 'var(--text)',
                    fontSize: '14px', outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--border-bright)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', color: 'var(--text-muted)',
                    fontSize: '13px', padding: '4px',
                  }}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                fontSize: '12px', color: 'var(--danger)',
                background: 'rgba(192,57,43,0.1)',
                border: '0.5px solid rgba(192,57,43,0.3)',
                borderRadius: '8px', padding: '10px 14px',
                marginBottom: '16px',
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '11px',
                background: loading ? 'var(--surface2)' : 'rgba(201,168,76,0.15)',
                border: `0.5px solid ${loading ? 'var(--border)' : 'var(--gold)'}`,
                borderRadius: '8px',
                color: loading ? 'var(--text-muted)' : 'var(--gold)',
                fontSize: '14px', fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px',
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '14px', height: '14px', borderRadius: '50%',
                    border: '1.5px solid var(--border)',
                    borderTopColor: 'var(--gold)',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Role hint */}
        <div style={{
          marginTop: '20px', textAlign: 'center',
          fontSize: '11px', color: 'var(--text-dim)',
        }}>
          Access level determined by your account role
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}